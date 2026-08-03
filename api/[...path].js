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
import { isEmailConfigured, sendNotificationEmail } from "./_smtp-mailer.js";
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
    if (parts[0] === "groups") return groupRoutes(req, res, parts.slice(1));
    if (parts[0] === "pages") return pageRoutes(req, res, parts.slice(1));
    if (parts[0] === "recommendations") return recommendationRoutes(req, res);
    if (parts[0] === "chat") return chatRoutes(req, res, parts.slice(1));
    if (parts[0] === "admin") return adminRoutes(req, res, parts.slice(1));
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
      profileVisibility: "PUBLIC",
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
    if (user.suspended || user.isActive === false) {
      return json(res, 403, error("Compte suspendu. Contactez l'administration."));
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
    const [user, authUser] = await Promise.all([
      profiles.findOne({ _id: makeId(userId) }),
      users.findOne({ _id: makeId(userId) }),
    ]);
    return user ? json(res, 200, ok({
      ...privateUser(user),
      roles: authUser?.roles || ["USER"],
      suspended: Boolean(user.suspended || authUser?.suspended),
      isActive: authUser?.isActive !== false,
    })) : json(res, 404, error("Utilisateur introuvable"));
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
  const followRequests = database.collection(COLLECTIONS.userFollowRequests);
  const userId = currentUserId(req);

  if (req.method === "GET" && parts[0] === "me" && parts[1] === "blocked") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const viewer = await users.findOne({ _id: makeId(userId) });
    const blockedIds = viewer?.blockedUsers || [];
    const rows = blockedIds.length
      ? await users.find({ _id: { $in: blockedIds.map(makeId) } }).toArray()
      : [];
    return json(res, 200, ok(rows.map(publicUser)));
  }

  if (req.method === "GET" && parts[0] === "me" && parts[1] === "follow-requests") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const rows = await followRequests.find({ targetId: userId, status: "PENDING" }).sort({ createdAt: -1 }).limit(100).toArray();
    const requesterIds = rows.map((row) => makeId(row.requesterId));
    const profiles = requesterIds.length ? await users.find({ _id: { $in: requesterIds } }).toArray() : [];
    const byId = new Map(profiles.map((profile) => [String(profile._id), publicUser(profile)]));
    return json(res, 200, ok(rows.map(row => ({ ...normalizeDoc(row), requester: byId.get(row.requesterId) || null }))));
  }

  if (req.method === "GET" && parts[0] === "search") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const viewer = await users.findOne({ _id: makeId(userId) });
    const viewerBlocked = new Set(viewer?.blockedUsers || []);
    const q = validateSearch(new URL(req.url, "http://localhost").searchParams.get("q"));
    const escaped = escapeRegex(q);
    const filter = escaped ? { username: { $regex: escaped, $options: "i" } } : {};
    const rows = await users.find(filter).limit(50).toArray();
    return json(res, 200, ok(rows
      .filter(row => canViewProfile(row, userId, viewerBlocked))
      .map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "followers") {
    const profileId = validateId(parts[0], "Utilisateur");
    const rows = await follows.find({ followingId: profileId }).toArray();
    const ids = rows.map((r) => makeId(r.followerId));
    const profiles = ids.length ? await users.find({ _id: { $in: ids } }).toArray() : [];
    return json(res, 200, ok(profiles.map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "following") {
    const profileId = validateId(parts[0], "Utilisateur");
    const rows = await follows.find({ followerId: profileId }).toArray();
    const ids = rows.map((r) => makeId(r.followingId));
    const profiles = ids.length ? await users.find({ _id: { $in: ids } }).toArray() : [];
    return json(res, 200, ok(profiles.map(publicUser)));
  }

  if (req.method === "GET" && parts[1] === "is-following") {
    if (!userId) return json(res, 200, ok(false));
    const targetId = validateId(parts[0], "Utilisateur");
    const found = await follows.findOne({ followerId: userId, followingId: targetId });
    return json(res, 200, ok(Boolean(found)));
  }

  if (req.method === "GET" && parts[1] === "follow-status") {
    if (!userId) return json(res, 200, ok({ status: "NONE" }));
    const targetId = validateId(parts[0], "Utilisateur");
    const found = await follows.findOne({ followerId: userId, followingId: targetId });
    if (found) return json(res, 200, ok({ status: "FOLLOWING" }));
    const pending = await followRequests.findOne({ requesterId: userId, targetId, status: "PENDING" });
    return json(res, 200, ok({ status: pending ? "PENDING" : "NONE" }));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "follow") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const targetId = validateId(parts[0], "Utilisateur");
    if (targetId === userId) return json(res, 400, error("Vous ne pouvez pas vous suivre vous-même"));
    const target = await users.findOne({ _id: makeId(targetId) });
    if (!target) return json(res, 404, error("Utilisateur introuvable"));
    if (req.method === "POST") {
      const isPrivate = String(target.profileVisibility || "PUBLIC").toUpperCase() === "PRIVATE";
      if (isPrivate) {
        const alreadyFollowing = await follows.findOne({ followerId: userId, followingId: targetId });
        if (!alreadyFollowing) {
          await followRequests.updateOne(
            { requesterId: userId, targetId },
            { $setOnInsert: { requesterId: userId, targetId, status: "PENDING", createdAt: new Date().toISOString() } },
            { upsert: true }
          );
          await createNotification(database, targetId, {
            type: "follow_request",
            title: "Demande d'abonnement",
            body: "Quelqu'un souhaite vous suivre",
            actorId: userId,
          });
        }
        return json(res, 200, ok({ status: alreadyFollowing ? "FOLLOWING" : "PENDING" }, "Demande envoyée"));
      }
      await follows.updateOne({ followerId: userId, followingId: targetId }, { $setOnInsert: { createdAt: new Date().toISOString() } }, { upsert: true });
      await followRequests.deleteOne({ requesterId: userId, targetId });
      await createNotification(database, targetId, {
        type: "follow",
        title: "Nouvel abonné",
        body: "Quelqu'un vous suit maintenant",
        actorId: userId,
      });
    } else {
      await follows.deleteOne({ followerId: userId, followingId: targetId });
      await followRequests.deleteOne({ requesterId: userId, targetId });
    }
    await syncFollowCounts(database, userId, targetId);
    return json(res, 200, ok({ status: req.method === "POST" ? "FOLLOWING" : "NONE" }));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "follow-requests" && parts[2]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const requesterId = validateId(parts[2], "Utilisateur");
    const request = await followRequests.findOne({ requesterId, targetId: userId, status: "PENDING" });
    if (!request) return json(res, 404, error("Demande introuvable"));
    if (req.method === "POST") {
      await follows.updateOne(
        { followerId: requesterId, followingId: userId },
        { $setOnInsert: { createdAt: new Date().toISOString() } },
        { upsert: true }
      );
      await followRequests.updateOne({ _id: request._id }, { $set: { status: "APPROVED", updatedAt: new Date().toISOString() } });
      await syncFollowCounts(database, requesterId, userId);
      await createNotification(database, requesterId, {
        type: "follow",
        title: "Demande acceptée",
        body: "Votre demande d'abonnement a été acceptée",
        actorId: userId,
      });
      return json(res, 200, ok({ status: "FOLLOWING" }, "Demande acceptée"));
    }
    await followRequests.updateOne({ _id: request._id }, { $set: { status: "REJECTED", updatedAt: new Date().toISOString() } });
    return json(res, 200, ok({ status: "NONE" }, "Demande refusée"));
  }

  if (req.method === "GET" && parts[0]) {
    const profileId = validateId(parts[0], "Utilisateur");
    const user = await users.findOne({ _id: makeId(profileId) });
    if (!user) return json(res, 404, error("Utilisateur introuvable"));
    if (profileId !== userId) {
      const viewer = userId ? await users.findOne({ _id: makeId(userId) }) : null;
      if (!canViewProfile(user, userId, new Set(viewer?.blockedUsers || []))) {
        return json(res, 403, error("Profil privé ou indisponible"));
      }
    }
    return json(res, 200, ok(profileId === userId ? privateUser(user) : publicUser(user)));
  }

  if (req.method === "PUT" && parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const profileId = validateId(parts[0], "Utilisateur");
    if (userId !== profileId) return json(res, 403, error("Action interdite"));
    const body = await readBody(req);
    const existing = await users.findOne({ _id: makeId(profileId) });
    if (!existing) return json(res, 404, error("Utilisateur introuvable"));
    const patch = {
      updatedAt: new Date().toISOString(),
    };
    if (body.username != null) {
      const username = requireUsername(body.username);
      const duplicate = await users.findOne({ username, _id: { $ne: makeId(profileId) } });
      if (duplicate) return json(res, 409, error("Nom d'utilisateur déjà utilisé"));
      patch.username = username;
    }
    if (body.fullname != null || body.fullName != null) {
      const fullname = requireString(body.fullname || body.fullName, "Nom complet", { min: 1, max: 80 });
      patch.fullname = fullname;
      patch.fullName = fullname;
    }
    if (body.bio != null) patch.bio = String(body.bio).trim().slice(0, 300);
    if (body.location != null) patch.location = String(body.location).trim().slice(0, 80);
    if (body.profileVisibility != null) {
      const visibility = String(body.profileVisibility).toUpperCase();
      if (!["PUBLIC", "PRIVATE"].includes(visibility)) return json(res, 400, error("Visibilité invalide"));
      patch.profileVisibility = visibility;
    }
    await users.updateOne({ _id: makeId(profileId) }, { $set: patch });
    const user = await users.findOne({ _id: makeId(profileId) });
    return json(res, 200, ok(privateUser(user)));
  }

  if (req.method === "POST" && (parts[1] === "avatar" || parts[1] === "cover")) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const profileId = validateId(parts[0], "Utilisateur");
    if (userId !== profileId) return json(res, 403, error("Action interdite"));
    const body = await readBody(req);
    validateMedia(body, { imageOnly: true, maxSize: 5 * 1024 * 1024 });
    const field = parts[1] === "avatar" ? "avatarUrl" : "coverUrl";
    const uploaded = await saveMedia(body.fileData, `mbolo/profiles/${parts[1]}`);
    await users.updateOne(
      { _id: makeId(profileId) },
      { $set: { [field]: uploaded.url, [`${field}PublicId`]: uploaded.publicId || "", updatedAt: new Date().toISOString() } }
    );
    return json(res, 200, ok(uploaded));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "block") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const targetId = validateId(parts[0], "Utilisateur");
    if (targetId === userId) return json(res, 400, error("Vous ne pouvez pas vous bloquer vous-même"));
    const target = await users.findOne({ _id: makeId(targetId) });
    if (!target) return json(res, 404, error("Utilisateur introuvable"));
    if (req.method === "POST") {
      await users.updateOne({ _id: makeId(userId) }, { $addToSet: { blockedUsers: targetId }, $set: { updatedAt: new Date().toISOString() } });
      await follows.deleteMany({ $or: [
        { followerId: userId, followingId: targetId },
        { followerId: targetId, followingId: userId },
      ] });
      await followRequests.deleteMany({ $or: [
        { requesterId: userId, targetId },
        { requesterId: targetId, targetId: userId },
      ] });
    } else {
      await users.updateOne({ _id: makeId(userId) }, { $pull: { blockedUsers: targetId }, $set: { updatedAt: new Date().toISOString() } });
    }
    await syncFollowCounts(database, userId, targetId);
    const updated = await users.findOne({ _id: makeId(userId) });
    return json(res, 200, ok(privateUser(updated)));
  }

  return json(res, 404, error("Endpoint users introuvable"));
}

async function postRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const posts = database.collection(COLLECTIONS.posts);
  const comments = database.collection(COLLECTIONS.comments);
  const savedPosts = database.collection(COLLECTIONS.savedPosts);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;

  if (req.method === "GET" && !parts[0]) {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const targetType = String(url.searchParams.get("targetType") || "").toUpperCase();
    const targetId = url.searchParams.get("targetId");
    const filter = userId
      ? { $or: [{ visibility: { $ne: "PRIVATE" } }, { authorId: userId }] }
      : { visibility: { $ne: "PRIVATE" } };
    if (targetId && ["GROUP", "PAGE"].includes(targetType)) {
      filter.targetType = targetType;
      filter.targetId = validateId(targetId, "Cible");
    } else {
      filter.targetType = { $exists: false };
    }
    if (userId) {
      const userDb = await serviceDb("user");
      const viewer = await userDb.collection(COLLECTIONS.userProfiles).findOne({ _id: makeId(userId) });
      const blockedByViewer = viewer?.blockedUsers || [];
      const blockingViewer = await userDb.collection(COLLECTIONS.userProfiles)
        .find({ blockedUsers: userId })
        .project({ _id: 1 })
        .toArray();
      const hiddenAuthors = [...new Set([...blockedByViewer, ...blockingViewer.map(row => String(row._id))])];
      if (hiddenAuthors.length) filter.authorId = { $nin: hiddenAuthors };
    }
    const total = await posts.countDocuments(filter);
    const rows = await posts.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, ok(pageResult(rows.map(normalizeDoc), page, size, total)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const target = await resolvePostTarget(database, body, userId);
    if (Number(body.fileSize || 0) > 5 * 1024 * 1024) return json(res, 413, error("Image trop lourde"));
    const uploaded = String(body.fileData || "").startsWith("data:image/")
      ? await saveMedia(body.fileData, "mbolo/posts")
      : null;
    const mediaUrls = uploaded ? [uploaded.url] : [];
    const now = new Date().toISOString();
    const result = await posts.insertOne({
      authorId: userId,
      content: body.content || "",
      visibility: normalizeVisibility(body.visibility),
      ...(target ? { targetType: target.type, targetId: target.id, targetName: target.name } : {}),
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

  if (req.method === "GET" && parts[0] === "saved") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const saved = await savedPosts.find({ userId }).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    const postIds = saved.map((item) => makeId(item.postId));
    const rows = postIds.length ? await posts.find({ _id: { $in: postIds } }).toArray() : [];
    const byId = new Map(rows.filter((post) => canViewPost(post, userId)).map((post) => [String(post._id), normalizeDoc(post)]));
    const ordered = saved.map((item) => byId.get(item.postId)).filter(Boolean);
    const total = await savedPosts.countDocuments({ userId });
    return json(res, 200, ok(pageResult(ordered, page, size, total)));
  }

  if (req.method === "GET" && parts[0] && !parts[1]) {
    const post = await posts.findOne({ _id: makeId(parts[0]) });
    if (post && !canViewPost(post, userId)) return json(res, 403, error("Publication privée"));
    return post ? json(res, 200, ok(normalizeDoc(post))) : json(res, 404, error("Post introuvable"));
  }

  if (req.method === "DELETE" && parts[0] && !parts[1]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    if (!post) return json(res, 404, error("Post introuvable"));
    const canModerateContext = await canModeratePostTarget(database, post, userId);
    if (post.authorId !== userId && !hasAnyRole(auth, ["ADMIN", "MODERATOR"]) && !canModerateContext) {
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
    if (!canViewPost(post, userId)) return json(res, 403, error("Publication privée"));
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

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "save") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    if (!post) return json(res, 404, error("Post introuvable"));
    if (!canViewPost(post, userId)) return json(res, 403, error("Publication privée"));

    if (req.method === "POST") {
      await savedPosts.updateOne(
        { userId, postId: parts[0] },
        { $setOnInsert: { userId, postId: parts[0], authorId: post.authorId, createdAt: new Date().toISOString() } },
        { upsert: true }
      );
      return json(res, 200, ok({ saved: true }, "Publication enregistrée"));
    }

    await savedPosts.deleteOne({ userId, postId: parts[0] });
    return json(res, 200, ok({ saved: false }, "Publication retirée"));
  }

  if (req.method === "GET" && parts[1] === "comments") {
    const post = await posts.findOne({ _id: makeId(validateId(parts[0], "Post")) });
    if (!post) return json(res, 404, error("Post introuvable"));
    if (!canViewPost(post, userId)) return json(res, 403, error("Publication privée"));
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
    if (!canViewPost(post, userId)) return json(res, 403, error("Publication privée"));
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
    if (!canViewPost(post, userId)) return json(res, 403, error("Publication privée"));
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
    const filter = userId
      ? { expiresAt: { $gt: now.toISOString() }, $or: [{ visibility: { $ne: "PRIVATE" } }, { userId }] }
      : { expiresAt: { $gt: now.toISOString() }, visibility: { $ne: "PRIVATE" } };
    const rows = await stories.find(filter).sort({ createdAt: -1 }).limit(100).toArray();
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
      visibility: normalizeVisibility(body.visibility),
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
    const story = await stories.findOne({ _id: makeId(validateId(parts[0], "Story")) });
    if (!story) return json(res, 404, error("Story introuvable"));
    if (!canViewStory(story, userId, now)) return json(res, 403, error("Story privée"));
    await stories.updateOne({ _id: story._id }, { $addToSet: { seenBy: userId }, $inc: { views: 1 } });
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

  if (req.method === "POST" && parts[0] === "test-email") {
    const userDb = await serviceDb("user");
    const profile = await userDb.collection(COLLECTIONS.userProfiles).findOne({ _id: makeId(userId) });
    if (!profile?.email) return json(res, 400, error("Aucun email sur ce profil"));
    if (!isEmailConfigured()) return json(res, 503, error("SMTP non configuré"));
    await sendNotificationEmail(profile.email, {
      title: "Test email MBolo",
      body: "La configuration SMTP fonctionne.",
    });
    return json(res, 200, ok(null, "Email envoyé"));
  }

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

async function groupRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const groups = database.collection(COLLECTIONS.groups);
  const members = database.collection(COLLECTIONS.groupMembers);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;

  if (req.method === "GET" && !parts[0]) {
    const url = new URL(req.url, "http://localhost");
    const q = validateSearch(url.searchParams.get("q"));
    const filter = q
      ? { $or: [
          { name: { $regex: escapeRegex(q), $options: "i" } },
          { description: { $regex: escapeRegex(q), $options: "i" } },
        ] }
      : {};
    const rows = await groups.find(filter).sort({ membersCount: -1, createdAt: -1 }).limit(50).toArray();
    return json(res, 200, ok(rows.map(normalizeDoc)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const name = requireString(body.name, "Nom du groupe", { min: 3, max: 80 });
    const slug = await uniqueSlug(groups, name);
    const now = new Date().toISOString();
    const result = await groups.insertOne({
      name,
      slug,
      description: String(body.description || "").trim().slice(0, 300),
      visibility: ["PUBLIC", "PRIVATE"].includes(String(body.visibility || "").toUpperCase())
        ? String(body.visibility).toUpperCase()
        : "PUBLIC",
      ownerId: userId,
      admins: [userId],
      membersCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    const groupId = String(result.insertedId);
    await members.insertOne({ groupId, userId, role: "ADMIN", status: "ACTIVE", createdAt: now });
    const group = await groups.findOne({ _id: result.insertedId });
    return json(res, 200, ok(normalizeDoc(group), "Groupe créé"));
  }

  if (req.method === "GET" && parts[1] === "members") {
    const groupId = validateId(parts[0], "Groupe");
    const group = await groups.findOne({ _id: makeId(groupId) });
    if (!group) return json(res, 404, error("Groupe introuvable"));
    const rows = await members.find({ groupId, status: "ACTIVE" }).sort({ role: 1, createdAt: 1 }).limit(200).toArray();
    const userDb = await serviceDb("user");
    const profiles = rows.length
      ? await userDb.collection(COLLECTIONS.userProfiles).find({ _id: { $in: rows.map(row => makeId(row.userId)) } }).toArray()
      : [];
    const byId = new Map(profiles.map(profile => [String(profile._id), publicUser(profile)]));
    return json(res, 200, ok(rows.map(row => ({ ...normalizeDoc(row), user: byId.get(row.userId) || null }))));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "members") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const groupId = validateId(parts[0], "Groupe");
    const group = await groups.findOne({ _id: makeId(groupId) });
    if (!group) return json(res, 404, error("Groupe introuvable"));

    if (req.method === "POST") {
      const status = group.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
      await members.updateOne(
        { groupId, userId },
        { $setOnInsert: { groupId, userId, role: "MEMBER", status, createdAt: new Date().toISOString() } },
        { upsert: true }
      );
      if (status === "PENDING") {
        await createNotification(database, group.ownerId, {
          type: "group_request",
          title: "Demande d'adhésion",
          body: `Nouvelle demande pour ${group.name}`,
          actorId: userId,
          entityId: groupId,
        });
      }
    } else {
      const targetUserId = parts[2] ? validateId(parts[2], "Utilisateur") : userId;
      const isAdmin = group.ownerId === userId || (Array.isArray(group.admins) && group.admins.includes(userId));
      if (targetUserId !== userId && !isAdmin) return json(res, 403, error("Action interdite"));
      if (group.ownerId === targetUserId) return json(res, 400, error("Le propriétaire ne peut pas être retiré"));
      await members.deleteOne({ groupId, userId: targetUserId });
    }

    const membersCount = await members.countDocuments({ groupId, status: "ACTIVE" });
    await groups.updateOne({ _id: group._id }, { $set: { membersCount, updatedAt: new Date().toISOString() } });
    const updated = await groups.findOne({ _id: group._id });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[1] === "requests") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const groupId = validateId(parts[0], "Groupe");
    const group = await groups.findOne({ _id: makeId(groupId) });
    if (!group) return json(res, 404, error("Groupe introuvable"));
    const isAdmin = group.ownerId === userId || (Array.isArray(group.admins) && group.admins.includes(userId));
    if (!isAdmin) return json(res, 403, error("Action interdite"));
    const rows = await members.find({ groupId, status: "PENDING" }).sort({ createdAt: -1 }).limit(50).toArray();
    const userDb = await serviceDb("user");
    const profiles = rows.length
      ? await userDb.collection(COLLECTIONS.userProfiles).find({ _id: { $in: rows.map(row => makeId(row.userId)) } }).toArray()
      : [];
    const byId = new Map(profiles.map(profile => [String(profile._id), publicUser(profile)]));
    return json(res, 200, ok(rows.map(row => ({ ...normalizeDoc(row), user: byId.get(row.userId) || null }))));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "requests" && parts[2]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const groupId = validateId(parts[0], "Groupe");
    const requestUserId = validateId(parts[2], "Utilisateur");
    const group = await groups.findOne({ _id: makeId(groupId) });
    if (!group) return json(res, 404, error("Groupe introuvable"));
    const isAdmin = group.ownerId === userId || (Array.isArray(group.admins) && group.admins.includes(userId));
    if (!isAdmin) return json(res, 403, error("Action interdite"));

    if (req.method === "POST") {
      await members.updateOne(
        { groupId, userId: requestUserId, status: "PENDING" },
        { $set: { status: "ACTIVE", approvedBy: userId, approvedAt: new Date().toISOString() } }
      );
    } else {
      await members.deleteOne({ groupId, userId: requestUserId, status: "PENDING" });
    }

    const membersCount = await members.countDocuments({ groupId, status: "ACTIVE" });
    await groups.updateOne({ _id: group._id }, { $set: { membersCount, updatedAt: new Date().toISOString() } });
    const updated = await groups.findOne({ _id: group._id });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "PUT" && parts[1] === "members" && parts[2] && parts[3] === "role") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const groupId = validateId(parts[0], "Groupe");
    const memberUserId = validateId(parts[2], "Utilisateur");
    const group = await groups.findOne({ _id: makeId(groupId) });
    if (!group) return json(res, 404, error("Groupe introuvable"));
    if (group.ownerId !== userId) return json(res, 403, error("Seul le propriétaire peut modifier les rôles"));
    if (memberUserId === group.ownerId) return json(res, 400, error("Le propriétaire garde son rôle"));
    const body = await readBody(req);
    const role = String(body.role || "").toUpperCase();
    if (!["MEMBER", "MODERATOR", "ADMIN"].includes(role)) return json(res, 400, error("Rôle invalide"));
    const result = await members.updateOne(
      { groupId, userId: memberUserId, status: "ACTIVE" },
      { $set: { role, updatedAt: new Date().toISOString() } }
    );
    if (!result.matchedCount) return json(res, 404, error("Membre introuvable"));
    const admins = role === "ADMIN"
      ? [...new Set([...(group.admins || []), memberUserId])]
      : (group.admins || []).filter(id => id !== memberUserId);
    await groups.updateOne({ _id: group._id }, { $set: { admins, updatedAt: new Date().toISOString() } });
    const updated = await groups.findOne({ _id: group._id });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[0]) {
    const groupId = validateId(parts[0], "Groupe");
    const group = await groups.findOne({ _id: makeId(groupId) });
    return group ? json(res, 200, ok(normalizeDoc(group))) : json(res, 404, error("Groupe introuvable"));
  }

  return json(res, 404, error("Endpoint groupes introuvable"));
}

async function pageRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const pages = database.collection(COLLECTIONS.pages);
  const followers = database.collection(COLLECTIONS.pageFollowers);
  const auth = currentAuth(req);
  const userId = auth?.userId || null;

  if (req.method === "GET" && !parts[0]) {
    const url = new URL(req.url, "http://localhost");
    const q = validateSearch(url.searchParams.get("q"));
    const filter = q
      ? { $or: [
          { name: { $regex: escapeRegex(q), $options: "i" } },
          { description: { $regex: escapeRegex(q), $options: "i" } },
          { category: { $regex: escapeRegex(q), $options: "i" } },
        ] }
      : {};
    const rows = await pages.find(filter).sort({ followersCount: -1, createdAt: -1 }).limit(50).toArray();
    return json(res, 200, ok(rows.map(normalizeDoc)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const name = requireString(body.name, "Nom de la page", { min: 3, max: 80 });
    const slug = await uniqueSlug(pages, name);
    const now = new Date().toISOString();
    const result = await pages.insertOne({
      name,
      slug,
      category: requireString(body.category || "Communauté", "Catégorie", { min: 2, max: 60 }),
      description: String(body.description || "").trim().slice(0, 300),
      ownerId: userId,
      admins: [userId],
      followersCount: 1,
      createdAt: now,
      updatedAt: now,
    });
    const pageId = String(result.insertedId);
    await followers.insertOne({ pageId, userId, role: "ADMIN", createdAt: now });
    const page = await pages.findOne({ _id: result.insertedId });
    return json(res, 200, ok(normalizeDoc(page), "Page créée"));
  }

  if ((req.method === "POST" || req.method === "DELETE") && parts[1] === "followers") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const pageId = validateId(parts[0], "Page");
    const page = await pages.findOne({ _id: makeId(pageId) });
    if (!page) return json(res, 404, error("Page introuvable"));

    if (req.method === "POST") {
      await followers.updateOne(
        { pageId, userId },
        { $setOnInsert: { pageId, userId, role: "FOLLOWER", createdAt: new Date().toISOString() } },
        { upsert: true }
      );
    } else {
      if (page.ownerId === userId) return json(res, 400, error("Le propriétaire ne peut pas se désabonner"));
      await followers.deleteOne({ pageId, userId });
    }

    const followersCount = await followers.countDocuments({ pageId });
    await pages.updateOne({ _id: page._id }, { $set: { followersCount, updatedAt: new Date().toISOString() } });
    const updated = await pages.findOne({ _id: page._id });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[0]) {
    const pageId = validateId(parts[0], "Page");
    const page = await pages.findOne({ _id: makeId(pageId) });
    return page ? json(res, 200, ok(normalizeDoc(page))) : json(res, 404, error("Page introuvable"));
  }

  return json(res, 404, error("Endpoint pages introuvable"));
}

async function resolvePostTarget(database, body, userId) {
  const targetType = String(body.targetType || "").toUpperCase();
  if (!targetType) return null;
  if (!["GROUP", "PAGE"].includes(targetType)) {
    const err = new Error("Cible de publication invalide");
    err.status = 400;
    throw err;
  }
  const targetId = validateId(body.targetId, "Cible");

  if (targetType === "GROUP") {
    const group = await database.collection(COLLECTIONS.groups).findOne({ _id: makeId(targetId) });
    if (!group) {
      const err = new Error("Groupe introuvable");
      err.status = 404;
      throw err;
    }
    const membership = await database.collection(COLLECTIONS.groupMembers).findOne({ groupId: targetId, userId, status: "ACTIVE" });
    if (!membership) {
      const err = new Error("Rejoignez le groupe avant de publier");
      err.status = 403;
      throw err;
    }
    return { type: "GROUP", id: targetId, name: group.name };
  }

  const page = await database.collection(COLLECTIONS.pages).findOne({ _id: makeId(targetId) });
  if (!page) {
    const err = new Error("Page introuvable");
    err.status = 404;
    throw err;
  }
  const isAdmin = page.ownerId === userId || (Array.isArray(page.admins) && page.admins.includes(userId));
  if (!isAdmin) {
    const err = new Error("Seuls les administrateurs peuvent publier sur cette page");
    err.status = 403;
    throw err;
  }
  return { type: "PAGE", id: targetId, name: page.name };
}

async function canModeratePostTarget(database, post, userId) {
  if (!post?.targetType || !post?.targetId || !userId) return false;

  if (post.targetType === "GROUP") {
    const group = await database.collection(COLLECTIONS.groups).findOne({ _id: makeId(post.targetId) });
    if (!group) return false;
    if (group.ownerId === userId || (Array.isArray(group.admins) && group.admins.includes(userId))) return true;
    const membership = await database.collection(COLLECTIONS.groupMembers).findOne({
      groupId: post.targetId,
      userId,
      status: "ACTIVE",
      role: { $in: ["MODERATOR", "ADMIN"] },
    });
    return Boolean(membership);
  }

  if (post.targetType === "PAGE") {
    const page = await database.collection(COLLECTIONS.pages).findOne({ _id: makeId(post.targetId) });
    return Boolean(page && (page.ownerId === userId || (Array.isArray(page.admins) && page.admins.includes(userId))));
  }

  return false;
}

async function recommendationRoutes(req, res) {
  const userId = currentUserId(req);
  if (!userId) return json(res, 401, error("Non authentifié"));

  const userDb = await serviceDb("user");
  const postDb = await serviceDb("post");
  const [users, groups, pages, posts] = await Promise.all([
    userDb.collection(COLLECTIONS.userProfiles)
      .find({ _id: { $ne: makeId(userId) } })
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(8)
      .toArray(),
    postDb.collection(COLLECTIONS.groups)
      .find({ visibility: "PUBLIC" })
      .sort({ membersCount: -1, createdAt: -1 })
      .limit(8)
      .toArray(),
    postDb.collection(COLLECTIONS.pages)
      .find()
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(8)
      .toArray(),
    postDb.collection(COLLECTIONS.posts)
      .find()
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray(),
  ]);

  return json(res, 200, ok({
    people: users.map(publicUser),
    groups: groups.map(normalizeDoc),
    pages: pages.map(normalizeDoc),
    posts: posts.map(normalizeDoc),
  }));
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

async function adminRoutes(req, res, parts) {
  const auth = currentAuth(req);
  const userId = auth?.userId || null;
  if (!userId) return json(res, 401, error("Non authentifié"));

  const authDb = await serviceDb("auth");
  const authUsers = authDb.collection(COLLECTIONS.authUsers);
  const authUser = await authUsers.findOne({ _id: makeId(userId) });
  const effectiveAuth = { ...auth, roles: authUser?.roles || auth?.roles || ["USER"] };
  if (authUser?.suspended || authUser?.isActive === false) return json(res, 403, error("Compte suspendu"));
  if (!hasAnyRole(effectiveAuth, ["ADMIN", "MODERATOR"])) return json(res, 403, error("Action interdite"));

  const userDb = await serviceDb("user");
  const postDb = await serviceDb("post");
  const moderationDb = await serviceDb("moderation");

  const profiles = userDb.collection(COLLECTIONS.userProfiles);
  const posts = postDb.collection(COLLECTIONS.posts);
  const comments = postDb.collection(COLLECTIONS.comments);
  const stories = postDb.collection(COLLECTIONS.stories);
  const videos = postDb.collection(COLLECTIONS.videos);
  const groups = postDb.collection(COLLECTIONS.groups);
  const pages = postDb.collection(COLLECTIONS.pages);
  const notifications = postDb.collection(COLLECTIONS.notifications);
  const reports = moderationDb.collection(COLLECTIONS.reports);
  const auditLogs = moderationDb.collection(COLLECTIONS.auditLogs);

  if (req.method === "GET" && parts[0] === "overview") {
    const [
      usersCount,
      suspendedUsers,
      postsCount,
      commentsCount,
      storiesCount,
      videosCount,
      groupsCount,
      pagesCount,
      openReports,
      resolvedReports,
      unreadNotifications,
      recentReports,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      profiles.countDocuments({}),
      profiles.countDocuments({ suspended: true }),
      posts.countDocuments({}),
      comments.countDocuments({}),
      stories.countDocuments({}),
      videos.countDocuments({}),
      groups.countDocuments({}),
      pages.countDocuments({}),
      reports.countDocuments({ status: { $in: ["OPEN", "PENDING"] } }),
      reports.countDocuments({ status: { $in: ["RESOLVED", "REJECTED"] } }),
      notifications.countDocuments({ read: false }),
      reports.find({}).sort({ createdAt: -1 }).limit(8).toArray(),
      profiles.find({}).sort({ createdAt: -1 }).limit(8).toArray(),
      posts.find({}).sort({ createdAt: -1 }).limit(8).toArray(),
    ]);

    return json(res, 200, ok({
      stats: {
        users: usersCount,
        suspendedUsers,
        posts: postsCount,
        comments: commentsCount,
        stories: storiesCount,
        videos: videosCount,
        groups: groupsCount,
        pages: pagesCount,
        openReports,
        resolvedReports,
        unreadNotifications,
      },
      recentReports: recentReports.map(normalizeDoc),
      recentUsers: recentUsers.map(privateUser),
      recentPosts: recentPosts.map(normalizeDoc),
    }));
  }

  if (req.method === "GET" && parts[0] === "users" && !parts[1]) {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const q = validateSearch(url.searchParams.get("q"));
    const search = q ? { $regex: escapeRegex(q), $options: "i" } : null;
    const filter = search
      ? { $or: [{ username: search }, { email: search }, { fullname: search }] }
      : {};
    const total = await profiles.countDocuments(filter);
    const rows = await profiles.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    const ids = rows.map((row) => row._id);
    const authRows = await authUsers.find({ _id: { $in: ids } }).toArray();
    const authById = new Map(authRows.map((row) => [String(row._id), row]));
    return json(res, 200, pageResult(rows.map((profile) => ({
      ...privateUser(profile),
      roles: authById.get(String(profile._id))?.roles || ["USER"],
      suspended: Boolean(profile.suspended || authById.get(String(profile._id))?.suspended),
      isActive: authById.get(String(profile._id))?.isActive !== false,
      suspendedReason: profile.suspendedReason || authById.get(String(profile._id))?.suspendedReason || "",
    })), page, size, total));
  }

  if (req.method === "GET" && parts[0] === "users" && parts[1]) {
    const targetId = validateId(parts[1], "Utilisateur");
    const [profile, authUser, postsCount, commentsCount, reportsCount, recentPosts, recentReports] = await Promise.all([
      profiles.findOne({ _id: makeId(targetId) }),
      authUsers.findOne({ _id: makeId(targetId) }),
      posts.countDocuments({ authorId: targetId }),
      comments.countDocuments({ authorId: targetId }),
      reports.countDocuments({ reporterId: targetId }),
      posts.find({ authorId: targetId }).sort({ createdAt: -1 }).limit(5).toArray(),
      reports.find({ reporterId: targetId }).sort({ createdAt: -1 }).limit(5).toArray(),
    ]);
    if (!profile) return json(res, 404, error("Utilisateur introuvable"));
    return json(res, 200, ok({
      profile: {
        ...privateUser(profile),
        roles: authUser?.roles || ["USER"],
        suspended: Boolean(profile.suspended || authUser?.suspended),
        isActive: authUser?.isActive !== false,
        suspendedReason: profile.suspendedReason || authUser?.suspendedReason || "",
      },
      auth: authUser ? {
        id: String(authUser._id),
        username: authUser.username,
        email: authUser.email,
        roles: authUser.roles || ["USER"],
        isActive: authUser.isActive !== false,
        suspended: Boolean(authUser.suspended),
        isVerified: Boolean(authUser.isVerified),
        createdAt: authUser.createdAt || "",
        updatedAt: authUser.updatedAt || "",
      } : null,
      stats: { posts: postsCount, comments: commentsCount, reports: reportsCount },
      recentPosts: recentPosts.map(normalizeDoc),
      recentReports: recentReports.map(normalizeDoc),
    }));
  }

  if (req.method === "PUT" && parts[0] === "users" && parts[2] === "roles") {
    if (!hasAnyRole(effectiveAuth, ["ADMIN"])) return json(res, 403, error("Action réservée aux admins"));
    const targetId = validateId(parts[1], "Utilisateur");
    const body = await readBody(req);
    const allowedRoles = new Set(["USER", "MODERATOR", "ADMIN"]);
    const roles = [...new Set(Array.isArray(body.roles) ? body.roles.map((role) => String(role).toUpperCase()) : [])]
      .filter((role) => allowedRoles.has(role));
    if (!roles.includes("USER")) roles.unshift("USER");
    const now = new Date().toISOString();
    await authUsers.updateOne({ _id: makeId(targetId) }, { $set: { roles, updatedAt: now } });
    await writeAuditLog(auditLogs, userId, "USER_ROLES_UPDATED", { targetId, roles });
    return json(res, 200, ok({ userId: targetId, roles }));
  }

  if (req.method === "POST" && parts[0] === "users" && parts[2] === "suspend") {
    const targetId = validateId(parts[1], "Utilisateur");
    if (targetId === userId) return json(res, 400, error("Impossible de suspendre votre propre compte"));
    const body = await readBody(req);
    const reason = requireString(body.reason || "Suspension administrative", "Raison", { min: 3, max: 300 });
    const now = new Date().toISOString();
    const update = { suspended: true, isActive: false, suspendedReason: reason, suspendedAt: now, updatedAt: now };
    await Promise.all([
      profiles.updateOne({ _id: makeId(targetId) }, { $set: update }),
      authUsers.updateOne({ _id: makeId(targetId) }, { $set: update }),
      writeAuditLog(auditLogs, userId, "USER_SUSPENDED", { targetId, reason }),
    ]);
    await createNotification(postDb, targetId, {
      type: "moderation",
      title: "Compte suspendu",
      body: reason,
      actorId: userId,
      entityId: targetId,
    });
    return json(res, 200, ok({ userId: targetId, suspended: true }));
  }

  if (req.method === "DELETE" && parts[0] === "users" && parts[2] === "suspend") {
    const targetId = validateId(parts[1], "Utilisateur");
    const now = new Date().toISOString();
    await Promise.all([
      profiles.updateOne({ _id: makeId(targetId) }, { $set: { suspended: false, isActive: true, updatedAt: now }, $unset: { suspendedReason: "", suspendedAt: "" } }),
      authUsers.updateOne({ _id: makeId(targetId) }, { $set: { suspended: false, isActive: true, updatedAt: now }, $unset: { suspendedReason: "", suspendedAt: "" } }),
      writeAuditLog(auditLogs, userId, "USER_UNSUSPENDED", { targetId }),
    ]);
    return json(res, 200, ok({ userId: targetId, suspended: false }));
  }

  if (req.method === "GET" && parts[0] === "reports") {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const status = validateSearch(url.searchParams.get("status")).toUpperCase();
    const filter = status && status !== "ALL" ? { status } : {};
    const total = await reports.countDocuments(filter);
    const rows = await reports.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, pageResult(rows.map(normalizeDoc), page, size, total));
  }

  if (req.method === "POST" && parts[0] === "reports" && parts[2] === "resolve") {
    const reportId = validateId(parts[1], "Signalement");
    const body = await readBody(req);
    const action = requireString(body.action || "REJECT", "Action", { min: 3, max: 20 }).toUpperCase();
    if (!["APPROVE", "REJECT", "BAN", "DELETE"].includes(action)) return json(res, 400, error("Action invalide"));
    const now = new Date().toISOString();
    const report = await reports.findOne({ _id: makeId(reportId) });
    if (!report) return json(res, 404, error("Signalement introuvable"));
    if (action === "DELETE" && String(report.contentType || "").toUpperCase() === "POST") {
      await deletePostCascade(posts, comments, report.contentId);
    }
    const update = {
      status: action === "REJECT" ? "REJECTED" : "RESOLVED",
      action,
      resolvedBy: userId,
      resolvedAt: now,
      updatedAt: now,
    };
    await reports.updateOne({ _id: makeId(reportId) }, { $set: update, $push: { history: { action, actorId: userId, at: now } } });
    await writeAuditLog(auditLogs, userId, `REPORT_${action}`, { reportId, contentType: report.contentType, contentId: report.contentId });
    const updated = await reports.findOne({ _id: makeId(reportId) });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[0] === "content") {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const rows = await posts.find({}).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    const total = await posts.countDocuments({});
    return json(res, 200, pageResult(rows.map(normalizeDoc), page, size, total));
  }

  if (req.method === "DELETE" && parts[0] === "posts" && parts[1]) {
    const postId = validateId(parts[1], "Publication");
    await deletePostCascade(posts, comments, postId);
    await writeAuditLog(auditLogs, userId, "POST_DELETED", { postId });
    return json(res, 200, ok({ id: postId }, "Publication supprimée"));
  }

  if (req.method === "GET" && parts[0] === "audit") {
    const url = new URL(req.url, "http://localhost");
    const { page, size } = parsePagination(url);
    const total = await auditLogs.countDocuments({});
    const rows = await auditLogs.find({}).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, pageResult(rows.map(normalizeDoc), page, size, total));
  }

  return json(res, 404, error("Endpoint admin introuvable"));
}

async function writeAuditLog(auditLogs, actorId, action, details = {}) {
  await auditLogs.insertOne({
    actorId,
    action,
    details,
    createdAt: new Date().toISOString(),
  });
}

async function deletePostCascade(posts, comments, postId) {
  await Promise.all([
    posts.deleteOne({ _id: makeId(postId) }),
    comments.deleteMany({ postId }),
  ]);
}

function hasAnyRole(auth, roles) {
  const userRoles = Array.isArray(auth?.roles) ? auth.roles : [];
  return roles.some((role) => userRoles.includes(role));
}

function canViewProfile(profile, viewerId, viewerBlocked = new Set()) {
  const profileId = String(profile?._id || profile?.id || "");
  if (!profileId) return false;
  if (viewerId && profileId === viewerId) return true;
  if (viewerBlocked.has(profileId)) return false;
  if (Array.isArray(profile.blockedUsers) && viewerId && profile.blockedUsers.includes(viewerId)) return false;
  return String(profile.profileVisibility || "PUBLIC").toUpperCase() !== "PRIVATE";
}

function normalizeVisibility(value) {
  const visibility = String(value || "PUBLIC").toUpperCase();
  return ["PUBLIC", "PRIVATE"].includes(visibility) ? visibility : "PUBLIC";
}

function canViewPost(post, viewerId) {
  if (!post) return false;
  if (String(post.authorId || "") === String(viewerId || "")) return true;
  return String(post.visibility || "PUBLIC").toUpperCase() !== "PRIVATE";
}

function canViewStory(story, viewerId, now = new Date()) {
  if (!story) return false;
  if (new Date(story.expiresAt).getTime() <= now.getTime()) return false;
  if (String(story.userId || "") === String(viewerId || "")) return true;
  return String(story.visibility || "PUBLIC").toUpperCase() !== "PRIVATE";
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
  const notificationDb = await serviceDb("post");
  const notifications = notificationDb.collection(COLLECTIONS.notifications);
  const actorInitials = String(payload.actorId || "U").slice(0, 2).toUpperCase();
  const doc = {
    userId,
    type: payload.type || "message",
    title: payload.title || "Nouvelle notification",
    body: payload.body || "",
    actorId: payload.actorId || "",
    entityId: payload.entityId || "",
    avatarInitials: actorInitials,
    read: false,
    createdAt: new Date().toISOString(),
    emailSent: false,
  };
  await notifications.insertOne(doc);
  sendNotificationEmailForUser(userId, doc).catch((err) => {
    console.error("Email notification failed:", err?.message || err);
  });
}

async function sendNotificationEmailForUser(userId, notification) {
  if (!isEmailConfigured()) return;
  const userDb = await serviceDb("user");
  const profile = await userDb.collection(COLLECTIONS.userProfiles).findOne({ _id: makeId(userId) });
  if (!profile?.email) return;
  await sendNotificationEmail(profile.email, notification);
  const notificationDb = await serviceDb("post");
  await notificationDb.collection(COLLECTIONS.notifications).updateOne(
    { userId, createdAt: notification.createdAt, title: notification.title },
    { $set: { emailSent: true, emailSentAt: new Date().toISOString() } }
  );
}

async function uniqueSlug(collection, name) {
  const base = String(name || "item")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";
  let slug = base;
  let suffix = 2;
  while (await collection.findOne({ slug })) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
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
