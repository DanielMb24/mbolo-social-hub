import {
  currentUserId,
  currentAuth,
  error,
  hashPassword,
  json,
  makeId,
  normalizeDoc,
  ok,
  pageResult,
  privateUser,
  publicUser,
  readBody,
  refreshTokenFromRequest,
  signToken,
  serviceDb,
  verifyPassword,
  verifyToken,
} from "./_lib.js";
import { isCloudinaryConfigured, uploadToCloudinary } from "./_cloudinary.js";
import { COLLECTIONS } from "./_collections.js";
import { applySecurityHeaders, clearRefreshCookie, randomTokenId, setRefreshCookie } from "./_http.js";
import {
  escapeRegex,
  parsePagination,
  requireEmail,
  requirePassword,
  requireString,
  validateId,
  requireUsername,
  validateMedia,
  validateSearch,
} from "./_validation.js";

export default async function handler(req, res) {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const parts = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
    applySecurityHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (parts[0] === "auth") return authRoutes(req, res, parts.slice(1));
    if (parts[0] === "users") return userRoutes(req, res, parts.slice(1));
    if (parts[0] === "posts") return postRoutes(req, res, parts.slice(1));
    if (parts[0] === "stories") return storyRoutes(req, res, parts.slice(1));
    if (parts[0] === "notifications") return notificationRoutes(req, res, parts.slice(1));
    if (parts[0] === "videos") return videoRoutes(req, res, parts.slice(1));
    if (parts[0] === "chat") return chatRoutes(req, res, parts.slice(1));
    if (parts[0] === "moderation") return moderationRoutes(req, res, parts.slice(1));
    if (parts[0] === "search") return searchRoutes(req, res);
    if (parts[0] === "health") return json(res, 200, ok({ status: "up" }));

    return json(res, 404, error("Endpoint introuvable"));
  } catch (err) {
    const status = err.status || (err.message === "MONGODB_URI is missing" ? 503 : 500);
    return json(res, status, error(err.message || "Erreur serveur"));
  }
}

async function authRoutes(req, res, parts) {
  const authDb = await serviceDb("auth");
  const userDb = await serviceDb("user");
  const users = authDb.collection(COLLECTIONS.authUsers);
  const refreshTokens = authDb.collection(COLLECTIONS.refreshTokens);
  const profiles = userDb.collection(COLLECTIONS.userProfiles);
  const body = await readBody(req);

  if (req.method === "POST" && parts[0] === "register") {
    const username = requireUsername(body.username);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    const exists = await users.findOne({ $or: [{ username }, { email }] });
    if (exists) return json(res, 400, error("Utilisateur déjà existant"));

    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);
    const result = await users.insertOne({
      username,
      email,
      password: passwordHash,
      passwordHash,
      roles: ["USER"],
      isActive: true,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });
    await profiles.insertOne({
      _id: result.insertedId,
      username,
      email,
      fullname: body.fullName || body.fullname || "",
      bio: "",
      blockedUsers: [],
      followersCount: 0,
      followingCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    return issueSession(res, refreshTokens, String(result.insertedId), username, ["USER"]);
  }

  if (req.method === "POST" && parts[0] === "login") {
    const login = requireString(body.username || body.email, "Identifiant", { min: 3, max: 254 });
    const user = await users.findOne({ $or: [{ username: login }, { email: login.toLowerCase() }] });
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash || user.password)) {
      return json(res, 401, error("Identifiants invalides"));
    }
    return issueSession(res, refreshTokens, String(user._id), user.username, user.roles || ["USER"]);
  }

  if (req.method === "POST" && parts[0] === "refresh") {
    const token = refreshTokenFromRequest(req);
    const payload = verifyToken(token, "refresh");
    if (!payload?.userId || !payload?.jti) return json(res, 401, error("Session invalide"));
    const stored = await refreshTokens.findOne({ jti: payload.jti, userId: payload.userId, revokedAt: { $exists: false } });
    if (!stored) return json(res, 401, error("Session invalide"));
    await refreshTokens.updateOne({ _id: stored._id }, { $set: { revokedAt: new Date().toISOString() } });
    return issueSession(res, refreshTokens, payload.userId, payload.username, payload.roles || stored.roles || ["USER"]);
  }

  if (req.method === "POST" && parts[0] === "logout") {
    const token = refreshTokenFromRequest(req);
    const payload = verifyToken(token, "refresh");
    if (payload?.jti) {
      await refreshTokens.updateOne({ jti: payload.jti }, { $set: { revokedAt: new Date().toISOString() } });
    }
    clearRefreshCookie(res);
    return json(res, 200, ok(null, "Déconnecté"));
  }

  if (req.method === "GET" && parts[0] === "me") {
    const userId = currentUserId(req);
    if (!userId) return json(res, 401, error("Non authentifié"));
    const user = await profiles.findOne({ _id: makeId(userId) });
    return user ? json(res, 200, ok(privateUser(user))) : json(res, 404, error("Utilisateur introuvable"));
  }

  if (req.method === "POST" && parts[0] === "forgot-password") {
    return json(res, 200, { message: "Si ce compte existe, un lien de réinitialisation sera envoyé." });
  }

  if (req.method === "POST" && parts[0] === "reset-password") {
    return json(res, 200, { message: "Réinitialisation indisponible sur le backend serverless minimal." });
  }

  if (req.method === "POST" && parts[0] === "google") {
    return json(res, 501, error("Google OAuth doit être configuré côté Vercel avec GOOGLE_CLIENT_ID."));
  }

  return json(res, 404, error("Endpoint auth introuvable"));
}

async function issueSession(res, refreshTokens, userId, username, roles = ["USER"]) {
  const jti = randomTokenId();
  const now = new Date();
  const cleanRoles = Array.isArray(roles) && roles.length ? roles : ["USER"];
  const refreshToken = signToken({ userId, username, roles: cleanRoles, jti, typ: "refresh" }, 60 * 60 * 24 * 30);
  await refreshTokens.insertOne({
    jti,
    userId,
    username,
    roles: cleanRoles,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  setRefreshCookie(res, refreshToken);
  return json(res, 200, ok({
    accessToken: signToken({ userId, username, roles: cleanRoles, typ: "access" }, 15 * 60),
    userId,
    username,
  }, "Authentifié"));
}

async function userRoutes(req, res, parts) {
  const database = await serviceDb("user");
  const users = database.collection(COLLECTIONS.userProfiles);
  const follows = database.collection(COLLECTIONS.userFollows);
  const userId = currentUserId(req);

  if (req.method === "GET" && parts[0] === "search") {
    const q = validateSearch(new URL(req.url, "http://localhost").searchParams.get("q"));
    const escaped = escapeRegex(q);
    const filter = escaped ? { username: { $regex: escaped, $options: "i" } } : {};
    const rows = await users.find(filter).limit(50).toArray();
    return json(res, 200, ok(rows.map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "followers") {
    const rows = await follows.find({ followingId: parts[0] }).toArray();
    const ids = rows.map((r) => makeId(r.followerId));
    const profiles = ids.length ? await users.find({ _id: { $in: ids } }).toArray() : [];
    return json(res, 200, ok(profiles.map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "following") {
    const rows = await follows.find({ followerId: parts[0] }).toArray();
    const ids = rows.map((r) => makeId(r.followingId));
    const profiles = ids.length ? await users.find({ _id: { $in: ids } }).toArray() : [];
    return json(res, 200, ok(profiles.map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "is-following") {
    if (!userId) return json(res, 200, ok(false));
    const found = await follows.findOne({ followerId: userId, followingId: parts[0] });
    return json(res, 200, ok(Boolean(found)));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "follow") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const targetId = parts[0];
    if (req.method === "POST") {
      await follows.updateOne({ followerId: userId, followingId: targetId }, { $setOnInsert: { createdAt: new Date().toISOString() } }, { upsert: true });
      await createNotification(database, targetId, {
        type: "follow",
        title: "Nouvel abonné",
        body: "Quelqu'un vous suit maintenant",
        actorId: userId,
      });
    } else {
      await follows.deleteOne({ followerId: userId, followingId: targetId });
    }
    await syncFollowCounts(database, userId, targetId);
    return json(res, 200, ok("OK"));
  }

  if (req.method === "GET" && parts[0]) {
    const user = await users.findOne({ _id: makeId(parts[0]) });
    return user ? json(res, 200, ok(publicUser(user))) : json(res, 404, error("Utilisateur introuvable"));
  }

  if (req.method === "PUT" && parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    if (userId !== parts[0]) return json(res, 403, error("Action interdite"));
    const body = await readBody(req);
    const patch = {
      fullname: String(body.fullname || body.fullName || "").trim().slice(0, 80),
      fullName: String(body.fullName || body.fullname || "").trim().slice(0, 80),
      bio: String(body.bio || "").trim().slice(0, 300),
      location: String(body.location || "").trim().slice(0, 80),
      updatedAt: new Date().toISOString(),
    };
    await users.updateOne({ _id: makeId(parts[0]) }, { $set: patch });
    const user = await users.findOne({ _id: makeId(parts[0]) });
    return json(res, 200, ok(publicUser(user)));
  }

  if (req.method === "POST" && (parts[1] === "avatar" || parts[1] === "cover")) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    if (userId !== parts[0]) return json(res, 403, error("Action interdite"));
    const body = await readBody(req);
    validateMedia(body, { imageOnly: true, maxSize: 5 * 1024 * 1024 });
    const field = parts[1] === "avatar" ? "avatarUrl" : "coverUrl";
    const uploaded = await saveMedia(body.fileData, `mbolo/profiles/${parts[1]}`);
    await users.updateOne(
      { _id: makeId(parts[0]) },
      { $set: { [field]: uploaded.url, [`${field}PublicId`]: uploaded.publicId || "", updatedAt: new Date().toISOString() } }
    );
    return json(res, 200, ok(uploaded));
  }

  return json(res, 404, error("Endpoint users introuvable"));
}

async function postRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const posts = database.collection(COLLECTIONS.posts);
  const comments = database.collection(COLLECTIONS.comments);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;

  if (req.method === "GET" && !parts[0]) {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const total = await posts.countDocuments();
    const rows = await posts.find().sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, ok(pageResult(rows.map(normalizeDoc), page, size, total)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    if (Number(body.fileSize || 0) > 5 * 1024 * 1024) return json(res, 413, error("Image trop lourde"));
    const uploaded = String(body.fileData || "").startsWith("data:image/")
      ? await saveMedia(body.fileData, "mbolo/posts")
      : null;
    const mediaUrls = uploaded ? [uploaded.url] : [];
    const now = new Date().toISOString();
    const result = await posts.insertOne({
      authorId: userId,
      content: body.content || "",
      mediaUrls,
      mediaPublicIds: uploaded?.publicId ? [uploaded.publicId] : [],
      likes: [],
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const post = await posts.findOne({ _id: result.insertedId });
    await createNotification(database, userId, {
      type: "post",
      title: "Publication créée",
      body: "Votre publication est en ligne",
      actorId: userId,
    });
    return json(res, 200, normalizeDoc(post));
  }

  if (req.method === "GET" && parts[0] && !parts[1]) {
    const post = await posts.findOne({ _id: makeId(parts[0]) });
    return post ? json(res, 200, ok(normalizeDoc(post))) : json(res, 404, error("Post introuvable"));
  }

  if (req.method === "DELETE" && parts[0] && !parts[1]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    if (!post) return json(res, 404, error("Post introuvable"));
    if (post.authorId !== userId && !hasAnyRole(auth, ["ADMIN", "MODERATOR"])) {
      return json(res, 403, error("Action interdite"));
    }
    await posts.deleteOne({ _id: post._id });
    await comments.deleteMany({ postId: parts[0] });
    return json(res, 200, ok(null, "Post supprimé"));
  }

  if (req.method === "POST" && parts[1] === "like") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(parts[0]) });
    if (!post) return json(res, 404, error("Post introuvable"));
    const likes = new Set(post?.likes || []);
    likes.has(userId) ? likes.delete(userId) : likes.add(userId);
    await posts.updateOne({ _id: makeId(parts[0]) }, { $set: { likes: [...likes], updatedAt: new Date().toISOString() } });
    const updated = await posts.findOne({ _id: makeId(parts[0]) });
    if (updated?.authorId && updated.authorId !== userId && likes.has(userId)) {
      await createNotification(database, updated.authorId, {
        type: "like",
        title: "Votre publication a reçu une réaction",
        body: "Quelqu'un a aimé votre publication",
        actorId: userId,
        entityId: parts[0],
      });
    }
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[1] === "comments") {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const filter = { postId: parts[0] };
    const total = await comments.countDocuments(filter);
    const rows = await comments.find(filter).sort({ createdAt: 1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, ok(pageResult(rows.map(normalizeDoc), page, size, total)));
  }

  if (req.method === "POST" && parts[1] === "comments") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const content = requireString(body.content, "Commentaire", { min: 1, max: 1000 });
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    if (!post) return json(res, 404, error("Post introuvable"));
    const now = new Date().toISOString();
    const result = await comments.insertOne({ postId: parts[0], authorId: userId, content, createdAt: now, updatedAt: now });
    await posts.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 }, $set: { updatedAt: now } });
    const comment = await comments.findOne({ _id: result.insertedId });
    if (post?.authorId && post.authorId !== userId) {
      await createNotification(database, post.authorId, {
        type: "comment",
        title: "Nouveau commentaire",
        body: content,
        actorId: userId,
        entityId: parts[0],
      });
    }
    return json(res, 200, ok(normalizeDoc(comment)));
  }

  if (req.method === "DELETE" && parts[1] === "comments" && parts[2]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    const comment = await comments.findOne({ _id: makeId(validateId(parts[2], "Commentaire")), postId: parts[0] });
    if (!post || !comment) return json(res, 404, error("Commentaire introuvable"));
    const allowed = comment.authorId === userId || post.authorId === userId || hasAnyRole(auth, ["ADMIN", "MODERATOR"]);
    if (!allowed) return json(res, 403, error("Action interdite"));
    await comments.deleteOne({ _id: comment._id });
    const commentsCount = await comments.countDocuments({ postId: parts[0] });
    await posts.updateOne({ _id: post._id }, { $set: { commentsCount, updatedAt: new Date().toISOString() } });
    return json(res, 200, ok(null, "Commentaire supprimé"));
  }

  return json(res, 404, error("Endpoint posts introuvable"));
}

async function storyRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const stories = database.collection(COLLECTIONS.stories);
  const userId = currentUserId(req);
  const now = new Date();

  if (req.method === "GET" && !parts[0]) {
    const rows = await stories.find({ expiresAt: { $gt: now.toISOString() } }).sort({ createdAt: -1 }).limit(100).toArray();
    return json(res, 200, ok(rows.map(normalizeDoc)));
  }

  if (req.method === "GET" && parts[0] === "me") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const rows = await stories.find({ userId, expiresAt: { $gt: now.toISOString() } }).sort({ createdAt: -1 }).toArray();
    return json(res, 200, ok(rows.map(normalizeDoc)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    if (Number(body.fileSize || 0) > 5 * 1024 * 1024) return json(res, 413, error("Image trop lourde"));
    const mediaType = body.mediaType === "image" || body.fileData ? "image" : "text";
    const uploaded = mediaType === "image" && body.fileData
      ? await saveMedia(body.fileData, "mbolo/stories")
      : null;
    const doc = {
      userId,
      username: body.username || "",
      avatarInitials: body.avatarInitials || "U",
      mediaType,
      mediaUrl: uploaded?.url || "",
      mediaPublicId: uploaded?.publicId || "",
      content: body.content || "",
      backgroundColor: body.backgroundColor || "linear-gradient(135deg, #2563eb 0%, #db2777 100%)",
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      seenBy: [],
      seen: false,
      views: 0,
      duration: 5000,
    };
    const result = await stories.insertOne(doc);
    const story = await stories.findOne({ _id: result.insertedId });
    await createNotification(database, userId, {
      type: "story",
      title: "Story publiée",
      body: "Votre story est disponible pendant 24h",
      actorId: userId,
      entityId: String(result.insertedId),
    });
    return json(res, 200, ok(normalizeDoc(story)));
  }

  if (req.method === "POST" && parts[1] === "seen") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await stories.updateOne({ _id: makeId(parts[0]) }, { $addToSet: { seenBy: userId }, $inc: { views: 1 } });
    return json(res, 200, ok(null));
  }

  if (req.method === "DELETE" && parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await stories.deleteOne({ _id: makeId(parts[0]), userId });
    return json(res, 200, ok(null, "Story supprimée"));
  }

  return json(res, 404, error("Endpoint stories introuvable"));
}

async function notificationRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const notifications = database.collection(COLLECTIONS.notifications);
  const userId = currentUserId(req);
  if (!userId) return json(res, 401, error("Non authentifié"));

  if (req.method === "GET" && !parts[0]) {
    const rows = await notifications.find({ userId }).sort({ createdAt: -1 }).limit(50).toArray();
    return json(res, 200, ok(rows.map(normalizeDoc)));
  }

  if (req.method === "GET" && parts[0] === "unread-count") {
    const count = await notifications.countDocuments({ userId, read: { $ne: true } });
    return json(res, 200, ok({ count }));
  }

  if (req.method === "POST" && parts[0] === "read-all") {
    await notifications.updateMany({ userId }, { $set: { read: true } });
    return json(res, 200, ok(null));
  }

  if (req.method === "POST" && parts[1] === "read") {
    await notifications.updateOne({ _id: makeId(parts[0]), userId }, { $set: { read: true } });
    return json(res, 200, ok(null));
  }

  if (req.method === "DELETE" && parts[0]) {
    await notifications.deleteOne({ _id: makeId(parts[0]), userId });
    return json(res, 200, ok(null));
  }

  return json(res, 404, error("Endpoint notifications introuvable"));
}

async function searchRoutes(req, res) {
  const userId = currentUserId(req);
  if (!userId) return json(res, 401, error("Non authentifié"));

  const url = new URL(req.url, "http://localhost");
  const q = validateSearch(url.searchParams.get("q"));
  if (!q) return json(res, 200, ok({ users: [], posts: [], conversations: [] }));

  const escaped = escapeRegex(q);
  const userDb = await serviceDb("user");
  const postDb = await serviceDb("post");
  const chatDb = await serviceDb("chat");

  const users = await userDb.collection(COLLECTIONS.userProfiles)
    .find({
      $or: [
        { username: { $regex: escaped, $options: "i" } },
        { fullname: { $regex: escaped, $options: "i" } },
        { fullName: { $regex: escaped, $options: "i" } },
        { bio: { $regex: escaped, $options: "i" } },
      ],
    })
    .limit(8)
    .toArray();

  const posts = await postDb.collection(COLLECTIONS.posts)
    .find({ content: { $regex: escaped, $options: "i" } })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const conversations = await chatDb.collection(COLLECTIONS.conversations)
    .find({
      participants: userId,
      $or: [
        { groupName: { $regex: escaped, $options: "i" } },
        { lastMessage: { $regex: escaped, $options: "i" } },
      ],
    })
    .sort({ lastMessageTime: -1 })
    .limit(6)
    .toArray();

  return json(res, 200, ok({
    users: users.map(publicUser),
    posts: posts.map(normalizeDoc),
    conversations: conversations.map(normalizeDoc),
  }));
}

async function videoRoutes(req, res, parts) {
  const database = await serviceDb("video");
  const videos = database.collection(COLLECTIONS.videos);
  const userId = currentUserId(req);

  if (req.method === "GET" && !parts[0]) {
    const rows = await videos.find().sort({ createdAt: -1 }).limit(50).toArray();
    return json(res, 200, rows.map(normalizeDoc));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    if (Number(body.fileSize || 0) > 20 * 1024 * 1024) return json(res, 413, error("Vidéo trop lourde"));
    const now = new Date().toISOString();
    const uploaded = body.fileData
      ? await saveMedia(body.fileData, "mbolo/videos", { resource_type: "video" })
      : null;
    const result = await videos.insertOne({
      userId,
      title: body.title || body.fileName || "Vidéo",
      description: body.description || "",
      videoUrl: uploaded?.url || "",
      videoPublicId: uploaded?.publicId || "",
      thumbnailUrl: "",
      views: 0,
      likes: [],
      duration: uploaded?.duration || 0,
      createdAt: now,
      updatedAt: now,
    });
    const video = await videos.findOne({ _id: result.insertedId });
    return json(res, 200, ok(normalizeDoc(video)));
  }

  if (req.method === "POST" && parts[1] === "like") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await videos.updateOne({ _id: makeId(parts[0]) }, { $addToSet: { likes: userId } });
    const video = await videos.findOne({ _id: makeId(parts[0]) });
    return json(res, 200, ok(normalizeDoc(video)));
  }

  if (req.method === "DELETE" && parts[1] === "like") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await videos.updateOne({ _id: makeId(parts[0]) }, { $pull: { likes: userId } });
    const video = await videos.findOne({ _id: makeId(parts[0]) });
    return json(res, 200, ok(normalizeDoc(video)));
  }

  if (req.method === "POST" && parts[1] === "view") {
    await videos.updateOne({ _id: makeId(parts[0]) }, { $inc: { views: 1 } });
    return json(res, 200, ok(null));
  }

  if (req.method === "DELETE" && parts[0] && !parts[1]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await videos.deleteOne({ _id: makeId(parts[0]), userId });
    return json(res, 200, ok(null));
  }

  return json(res, 404, error("Endpoint videos introuvable"));
}

async function chatRoutes(req, res, parts) {
  const database = await serviceDb("chat");
  const userDb = await serviceDb("user");
  const conversations = database.collection(COLLECTIONS.conversations);
  const messages = database.collection(COLLECTIONS.messages);
  const profiles = userDb.collection(COLLECTIONS.userProfiles);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;
  if (!userId) return json(res, 401, error("Non authentifié"));

  if (req.method === "GET" && parts[0] === "conversations" && !parts[1]) {
    const rows = await conversations.find({ participants: userId }).sort({ lastMessageTime: -1 }).toArray();
    return json(res, 200, rows.map(normalizeDoc));
  }

  if (req.method === "GET" && parts[0] === "conversations" && parts[1] === "private") {
    const otherUserId = validateId(parts[2], "Utilisateur");
    const otherUser = await profiles.findOne({ _id: makeId(otherUserId) });
    if (!otherUser) return json(res, 404, error("Utilisateur introuvable"));
    let convo = await conversations.findOne({ type: "PRIVATE", participants: { $all: [userId, otherUserId] } });
    if (!convo) {
      const now = new Date().toISOString();
      const result = await conversations.insertOne({ participants: [userId, otherUserId], type: "PRIVATE", unreadCount: 0, createdAt: now, updatedAt: now });
      convo = await conversations.findOne({ _id: result.insertedId });
    }
    return json(res, 200, normalizeDoc(convo));
  }

  if (req.method === "GET" && parts[0] === "conversations" && parts[1] && !parts[2]) {
    const convo = await getConversationForUser(conversations, parts[1], userId);
    if (!convo) return json(res, 404, error("Conversation introuvable"));
    return json(res, 200, normalizeDoc(convo));
  }

  if (req.method === "POST" && parts[0] === "conversations") {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const participants = [...new Set([userId, ...(body.participants || body.participantIds || [])].map((id) => validateId(id, "Participant")))];
    const existingProfiles = await profiles.countDocuments({ _id: { $in: participants.map(makeId) } });
    if (existingProfiles !== participants.length) return json(res, 400, error("Participant invalide"));
    if ((body.type || "GROUP") === "PRIVATE" && participants.length === 2) {
      const existing = await conversations.findOne({ type: "PRIVATE", participants: { $all: participants } });
      if (existing) return json(res, 200, normalizeDoc(existing));
    }
    const result = await conversations.insertOne({ participants, type: body.type || "GROUP", groupName: body.groupName || "", unreadCount: 0, createdAt: now, updatedAt: now });
    const convo = await conversations.findOne({ _id: result.insertedId });
    return json(res, 200, normalizeDoc(convo));
  }

  if (
    req.method === "GET" &&
    ((parts[0] === "messages" && parts[1]) || (parts[0] === "conversations" && parts[2] === "messages"))
  ) {
    const conversationId = parts[0] === "messages" ? parts[1] : parts[1];
    const convo = await getConversationForUser(conversations, conversationId, userId);
    if (!convo) return json(res, 404, error("Conversation introuvable"));
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const filter = { conversationId, deleted: { $ne: true } };
    const total = await messages.countDocuments(filter);
    const rows = await messages.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, pageResult(rows.map(normalizeDoc).reverse(), page, size, total));
  }

  if (
    req.method === "POST" &&
    ((parts[0] === "messages" && !parts[1]) || (parts[0] === "conversations" && parts[2] === "messages" && !parts[3]))
  ) {
    const body = await readBody(req);
    const conversationId = parts[0] === "messages" ? body.conversationId : parts[1];
    const convo = await getConversationForUser(conversations, conversationId, userId);
    if (!convo) return json(res, 404, error("Conversation introuvable"));
    const content = requireString(body.content, "Message", { min: 1, max: 5000 });
    const now = new Date().toISOString();
    const message = {
      conversationId,
      senderId: userId,
      content,
      type: body.type || "TEXT",
      seenBy: [userId],
      deleted: false,
      createdAt: now,
      updatedAt: now,
      reactions: [],
    };
    const result = await messages.insertOne(message);
    await conversations.updateOne({ _id: convo._id }, { $set: { lastMessage: message.content, lastMessageTime: now, updatedAt: now } });
    const saved = await messages.findOne({ _id: result.insertedId });
    return json(res, 200, normalizeDoc(saved));
  }

  if (req.method === "PUT" && parts[0] === "conversations" && parts[2] === "seen") {
    const convo = await getConversationForUser(conversations, parts[1], userId);
    if (!convo) return json(res, 404, error("Conversation introuvable"));
    await messages.updateMany({ conversationId: parts[1], deleted: { $ne: true } }, { $addToSet: { seenBy: userId } });
    return json(res, 200, ok(null));
  }

  if (req.method === "PUT" && parts[0] === "messages" && parts[2] === "seen") {
    const msg = await messages.findOne({ _id: makeId(validateId(parts[1], "Message")), deleted: { $ne: true } });
    if (!msg) return json(res, 404, error("Message introuvable"));
    const convo = await getConversationForUser(conversations, msg.conversationId, userId);
    if (!convo) return json(res, 403, error("Action interdite"));
    await messages.updateOne({ _id: msg._id }, { $addToSet: { seenBy: userId }, $set: { updatedAt: new Date().toISOString() } });
    return json(res, 200, ok(null));
  }

  if (req.method === "DELETE" && parts[0] === "messages" && parts[1]) {
    const msg = await messages.findOne({ _id: makeId(validateId(parts[1], "Message")), deleted: { $ne: true } });
    if (!msg) return json(res, 404, error("Message introuvable"));
    const convo = await getConversationForUser(conversations, msg.conversationId, userId);
    if (!convo) return json(res, 403, error("Action interdite"));
    if (msg.senderId !== userId && !hasAnyRole(auth, ["ADMIN", "MODERATOR"])) return json(res, 403, error("Action interdite"));
    await messages.updateOne({ _id: msg._id }, { $set: { deleted: true, content: "", updatedAt: new Date().toISOString() } });
    return json(res, 200, ok(null));
  }

  if (req.method === "POST" && parts[0] === "messages" && parts[2] === "react") {
    const body = await readBody(req);
    const emoji = requireString(body.emoji, "Réaction", { min: 1, max: 16 });
    const msg = await messages.findOne({ _id: makeId(validateId(parts[1], "Message")), deleted: { $ne: true } });
    if (!msg) return json(res, 404, error("Message introuvable"));
    const convo = await getConversationForUser(conversations, msg.conversationId, userId);
    if (!convo) return json(res, 403, error("Action interdite"));
    const reactions = updateReactions(msg.reactions || [], emoji, userId);
    await messages.updateOne({ _id: msg._id }, { $set: { reactions, updatedAt: new Date().toISOString() } });
    return json(res, 200, ok(null));
  }

  if (req.method === "PUT" && parts[0] === "messages" && parts[2] === "star") {
    const msg = await messages.findOne({ _id: makeId(validateId(parts[1], "Message")), deleted: { $ne: true } });
    if (!msg) return json(res, 404, error("Message introuvable"));
    const convo = await getConversationForUser(conversations, msg.conversationId, userId);
    if (!convo) return json(res, 403, error("Action interdite"));
    const starredBy = new Set(msg.starredBy || []);
    starredBy.has(userId) ? starredBy.delete(userId) : starredBy.add(userId);
    await messages.updateOne({ _id: msg._id }, { $set: { starredBy: [...starredBy], starred: starredBy.has(userId), updatedAt: new Date().toISOString() } });
    return json(res, 200, ok(null));
  }

  if (req.method === "POST" && parts[0] === "conversations" && parts[2] === "typing") {
    const convo = await getConversationForUser(conversations, parts[1], userId);
    if (!convo) return json(res, 404, error("Conversation introuvable"));
    return json(res, 200, ok(null));
  }

  if (req.method === "POST" && parts[0] === "upload") {
    const body = await readBody(req);
    if (Number(body.fileSize || 0) > 10 * 1024 * 1024) return json(res, 413, error("Fichier trop lourd"));
    const uploaded = await saveMedia(body.fileData, "mbolo/chat");
    return json(res, 200, { url: uploaded.url, publicId: uploaded.publicId || "" });
  }

  return json(res, 404, error("Endpoint chat introuvable"));
}

async function moderationRoutes(req, res, parts) {
  const database = await serviceDb("moderation");
  const reports = database.collection(COLLECTIONS.reports);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;
  if (!userId) return json(res, 401, error("Non authentifié"));

  if (req.method === "POST" && parts[0] === "reports" && !parts[1]) {
    const body = await readBody(req);
    const contentId = validateId(body.contentId, "Contenu");
    const contentType = requireString(body.contentType, "Type de contenu", { min: 2, max: 40 }).toUpperCase();
    const reason = requireString(body.reason, "Motif", { min: 3, max: 500 });
    const now = new Date().toISOString();
    const result = await reports.insertOne({
      contentId,
      contentType,
      reason,
      reporterId: userId,
      status: "OPEN",
      history: [{ action: "OPEN", actorId: userId, at: now }],
      createdAt: now,
      updatedAt: now,
    });
    const report = await reports.findOne({ _id: result.insertedId });
    return json(res, 200, ok(normalizeDoc(report), "Signalement reçu"));
  }

  if (req.method === "GET" && parts[0] === "reports") {
    if (!hasAnyRole(auth, ["ADMIN", "MODERATOR"])) return json(res, 403, error("Action interdite"));
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const status = validateSearch(url.searchParams.get("status")).toUpperCase();
    const filter = status ? { status } : {};
    const total = await reports.countDocuments(filter);
    const rows = await reports.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, pageResult(rows.map(normalizeDoc), page, size, total));
  }

  if (req.method === "POST" && parts[0] === "reports" && parts[2] === "resolve") {
    if (!hasAnyRole(auth, ["ADMIN", "MODERATOR"])) return json(res, 403, error("Action interdite"));
    const body = await readBody(req);
    const action = requireString(body.action, "Action", { min: 3, max: 20 }).toUpperCase();
    if (!["APPROVE", "REJECT", "BAN"].includes(action)) return json(res, 400, error("Action invalide"));
    const now = new Date().toISOString();
    const update = {
      status: action === "REJECT" ? "REJECTED" : "RESOLVED",
      action,
      resolvedBy: userId,
      resolvedAt: now,
      updatedAt: now,
    };
    await reports.updateOne(
      { _id: makeId(validateId(parts[1], "Signalement")) },
      { $set: update, $push: { history: { action, actorId: userId, at: now } } }
    );
    const report = await reports.findOne({ _id: makeId(parts[1]) });
    return report ? json(res, 200, ok(normalizeDoc(report))) : json(res, 404, error("Signalement introuvable"));
  }

  return json(res, 404, error("Endpoint modération introuvable"));
}

function hasAnyRole(auth, roles) {
  const userRoles = Array.isArray(auth?.roles) ? auth.roles : [];
  return roles.some((role) => userRoles.includes(role));
}

async function getConversationForUser(conversations, conversationId, userId) {
  if (!conversationId) return null;
  return conversations.findOne({ _id: makeId(validateId(conversationId, "Conversation")), participants: userId });
}

function updateReactions(reactions, emoji, userId) {
  const next = reactions.map((reaction) => ({ ...reaction, users: [...new Set(reaction.users || [])] }));
  const existing = next.find((reaction) => reaction.emoji === emoji);
  if (existing) {
    const users = new Set(existing.users || []);
    users.has(userId) ? users.delete(userId) : users.add(userId);
    existing.users = [...users];
    existing.count = existing.users.length;
  } else {
    next.push({ emoji, users: [userId], count: 1 });
  }
  return next.filter((reaction) => reaction.count > 0);
}

async function syncFollowCounts(database, followerId, followingId) {
  const follows = database.collection(COLLECTIONS.userFollows);
  const users = database.collection(COLLECTIONS.userProfiles);
  const followingCount = await follows.countDocuments({ followerId });
  const followersCount = await follows.countDocuments({ followingId });
  await users.updateOne({ _id: makeId(followerId) }, { $set: { followingCount } });
  await users.updateOne({ _id: makeId(followingId) }, { $set: { followersCount } });
}

async function createNotification(database, userId, payload) {
  if (!userId) return;
  const notifications = database.collection(COLLECTIONS.notifications);
  const actorInitials = String(payload.actorId || "U").slice(0, 2).toUpperCase();
  await notifications.insertOne({
    userId,
    type: payload.type || "message",
    title: payload.title || "Nouvelle notification",
    body: payload.body || "",
    actorId: payload.actorId || "",
    entityId: payload.entityId || "",
    avatarInitials: actorInitials,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

async function saveMedia(fileData, folder, options = {}) {
  if (!fileData) return { url: "", publicId: "" };
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(fileData, folder, options);
  }

  return {
    url: fileData,
    publicId: "",
    resourceType: fileData.startsWith("data:video/") ? "video" : "image",
    duration: 0,
  };
}
