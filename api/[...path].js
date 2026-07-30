import {
  currentUserId,
  db,
  error,
  hashPassword,
  json,
  makeId,
  normalizeDoc,
  ok,
  pageResult,
  publicUser,
  readBody,
  signToken,
  serviceDb,
  verifyPassword,
  verifyToken,
} from "./_lib.js";

export default async function handler(req, res) {
  try {
    const pathname = new URL(req.url, "http://localhost").pathname;
    const parts = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      return res.status(204).end();
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (parts[0] === "auth") return authRoutes(req, res, parts.slice(1));
    if (parts[0] === "users") return userRoutes(req, res, parts.slice(1));
    if (parts[0] === "posts") return postRoutes(req, res, parts.slice(1));
    if (parts[0] === "videos") return videoRoutes(req, res, parts.slice(1));
    if (parts[0] === "chat") return chatRoutes(req, res, parts.slice(1));
    if (parts[0] === "moderation") return moderationRoutes(req, res, parts.slice(1));
    if (parts[0] === "health") return json(res, 200, ok({ status: "up" }));

    return json(res, 404, error("Endpoint introuvable"));
  } catch (err) {
    const status = err.message === "MONGODB_URI is missing" ? 503 : 500;
    return json(res, status, error(err.message || "Erreur serveur"));
  }
}

async function authRoutes(req, res, parts) {
  const authDb = await serviceDb("auth");
  const userDb = await serviceDb("user");
  const users = authDb.collection("users_auth");
  const profiles = userDb.collection("users_profile");
  const body = await readBody(req);

  if (req.method === "POST" && parts[0] === "register") {
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || !email || password.length < 6) {
      return json(res, 400, error("Nom, email et mot de passe requis"));
    }
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
    return json(res, 200, ok(authPayload(String(result.insertedId), username)));
  }

  if (req.method === "POST" && parts[0] === "login") {
    const login = String(body.username || body.email || "").trim();
    const user = await users.findOne({ $or: [{ username: login }, { email: login.toLowerCase() }] });
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash || user.password)) {
      return json(res, 401, error("Identifiants invalides"));
    }
    return json(res, 200, ok(authPayload(String(user._id), user.username)));
  }

  if (req.method === "POST" && parts[0] === "refresh") {
    const token = body.refreshToken || body.token;
    const payload = verifyToken(token);
    if (!payload?.userId) return json(res, 401, error("Token invalide"));
    return json(res, 200, ok(authPayload(payload.userId, payload.username)));
  }

  if (req.method === "GET" && parts[0] === "me") {
    const userId = currentUserId(req);
    if (!userId) return json(res, 401, error("Non authentifié"));
    const user = await profiles.findOne({ _id: makeId(userId) });
    return user ? json(res, 200, publicUser(user)) : json(res, 404, error("Utilisateur introuvable"));
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

function authPayload(userId, username) {
  return {
    success: true,
    accessToken: signToken({ userId, username }),
    refreshToken: signToken({ userId, username }, 60 * 60 * 24 * 30),
    userId,
    username,
    message: "Authentifié",
  };
}

async function userRoutes(req, res, parts) {
  const database = await serviceDb("user");
  const users = database.collection("users_profile");
  const follows = database.collection("user_follows");
  const userId = currentUserId(req);

  if (req.method === "GET" && parts[0] === "search") {
    const q = String(new URL(req.url, "http://localhost").searchParams.get("q") || "");
    const filter = q ? { username: { $regex: q, $options: "i" } } : {};
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
    const body = await readBody(req);
    const patch = {
      fullname: body.fullname || body.fullName || "",
      fullName: body.fullName || body.fullname || "",
      bio: body.bio || "",
      location: body.location || "",
      updatedAt: new Date().toISOString(),
    };
    await users.updateOne({ _id: makeId(parts[0]) }, { $set: patch });
    const user = await users.findOne({ _id: makeId(parts[0]) });
    return json(res, 200, ok(publicUser(user)));
  }

  if (req.method === "POST" && (parts[1] === "avatar" || parts[1] === "cover")) {
    return json(res, 200, ok({ url: "/placeholder.svg", message: "Upload fichier à connecter à un stockage externe." }));
  }

  return json(res, 404, error("Endpoint users introuvable"));
}

async function postRoutes(req, res, parts) {
  const database = await serviceDb("post");
  const posts = database.collection("posts");
  const comments = database.collection("comments");
  const userId = currentUserId(req);

  if (req.method === "GET" && !parts[0]) {
    const url = new URL(req.url, "http://localhost");
    const page = Number(url.searchParams.get("page") || 0);
    const size = Number(url.searchParams.get("size") || 20);
    const total = await posts.countDocuments();
    const rows = await posts.find().sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, ok(pageResult(rows.map(normalizeDoc), page, size, total)));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = await posts.insertOne({
      authorId: userId,
      content: body.content || "",
      mediaUrls: [],
      likes: [],
      commentsCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    const post = await posts.findOne({ _id: result.insertedId });
    return json(res, 200, normalizeDoc(post));
  }

  if (req.method === "GET" && parts[0] && !parts[1]) {
    const post = await posts.findOne({ _id: makeId(parts[0]) });
    return post ? json(res, 200, ok(normalizeDoc(post))) : json(res, 404, error("Post introuvable"));
  }

  if (req.method === "DELETE" && parts[0] && !parts[1]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    await posts.deleteOne({ _id: makeId(parts[0]), authorId: userId });
    return json(res, 200, ok(null, "Post supprimé"));
  }

  if (req.method === "POST" && parts[1] === "like") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const post = await posts.findOne({ _id: makeId(parts[0]) });
    const likes = new Set(post?.likes || []);
    likes.has(userId) ? likes.delete(userId) : likes.add(userId);
    await posts.updateOne({ _id: makeId(parts[0]) }, { $set: { likes: [...likes], updatedAt: new Date().toISOString() } });
    const updated = await posts.findOne({ _id: makeId(parts[0]) });
    return json(res, 200, ok(normalizeDoc(updated)));
  }

  if (req.method === "GET" && parts[1] === "comments") {
    const url = new URL(req.url, "http://localhost");
    const page = Number(url.searchParams.get("page") || 0);
    const size = Number(url.searchParams.get("size") || 20);
    const filter = { postId: parts[0] };
    const total = await comments.countDocuments(filter);
    const rows = await comments.find(filter).sort({ createdAt: 1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, ok(pageResult(rows.map(normalizeDoc), page, size, total)));
  }

  if (req.method === "POST" && parts[1] === "comments") {
    if (!userId) return json(res, 401, error("Non authentifié"));
    const body = await readBody(req);
    const now = new Date().toISOString();
    const result = await comments.insertOne({ postId: parts[0], authorId: userId, content: body.content || "", createdAt: now });
    await posts.updateOne({ _id: makeId(parts[0]) }, { $inc: { commentsCount: 1 } });
    const comment = await comments.findOne({ _id: result.insertedId });
    return json(res, 200, ok(normalizeDoc(comment)));
  }

  return json(res, 404, error("Endpoint posts introuvable"));
}

async function videoRoutes(req, res, parts) {
  const database = await serviceDb("video");
  const videos = database.collection("videos");
  const userId = currentUserId(req);

  if (req.method === "GET" && !parts[0]) {
    const rows = await videos.find().sort({ createdAt: -1 }).limit(50).toArray();
    return json(res, 200, rows.map(normalizeDoc));
  }

  if (req.method === "POST" && !parts[0]) {
    if (!userId) return json(res, 401, error("Non authentifié"));
    return json(res, 200, ok({ url: "/placeholder.svg", message: "Upload vidéo à connecter à un stockage externe." }));
  }

  if (req.method === "POST" && parts[1] === "like") {
    await videos.updateOne({ _id: makeId(parts[0]) }, { $inc: { likes: 1 } });
    return json(res, 200, ok(null));
  }

  if (req.method === "POST" && parts[1] === "view") {
    await videos.updateOne({ _id: makeId(parts[0]) }, { $inc: { views: 1 } });
    return json(res, 200, ok(null));
  }

  return json(res, 404, error("Endpoint videos introuvable"));
}

async function chatRoutes(req, res, parts) {
  const database = await serviceDb("chat");
  const conversations = database.collection("conversations");
  const messages = database.collection("messages");
  const userId = currentUserId(req);
  if (!userId) return json(res, 401, error("Non authentifié"));

  if (req.method === "GET" && parts[0] === "conversations" && !parts[1]) {
    const rows = await conversations.find({ participants: userId }).sort({ lastMessageTime: -1 }).toArray();
    return json(res, 200, rows.map(normalizeDoc));
  }

  if (req.method === "GET" && parts[0] === "conversations" && parts[1] === "private") {
    const otherUserId = parts[2];
    let convo = await conversations.findOne({ type: "PRIVATE", participants: { $all: [userId, otherUserId] } });
    if (!convo) {
      const now = new Date().toISOString();
      const result = await conversations.insertOne({ participants: [userId, otherUserId], type: "PRIVATE", unreadCount: 0, createdAt: now });
      convo = await conversations.findOne({ _id: result.insertedId });
    }
    return json(res, 200, normalizeDoc(convo));
  }

  if (req.method === "POST" && parts[0] === "conversations") {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const participants = [...new Set([userId, ...(body.participants || body.participantIds || [])])];
    const result = await conversations.insertOne({ participants, type: body.type || "GROUP", groupName: body.groupName || "", unreadCount: 0, createdAt: now });
    const convo = await conversations.findOne({ _id: result.insertedId });
    return json(res, 200, normalizeDoc(convo));
  }

  if (req.method === "GET" && parts[0] === "messages") {
    const url = new URL(req.url, "http://localhost");
    const page = Number(url.searchParams.get("page") || 0);
    const size = Number(url.searchParams.get("size") || 20);
    const filter = { conversationId: parts[1], deleted: { $ne: true } };
    const total = await messages.countDocuments(filter);
    const rows = await messages.find(filter).sort({ createdAt: -1 }).skip(page * size).limit(size).toArray();
    return json(res, 200, pageResult(rows.map(normalizeDoc).reverse(), page, size, total));
  }

  if (req.method === "POST" && parts[0] === "messages") {
    const body = await readBody(req);
    const now = new Date().toISOString();
    const message = {
      conversationId: body.conversationId,
      senderId: userId,
      content: body.content || "",
      type: body.type || "TEXT",
      seenBy: [userId],
      deleted: false,
      createdAt: now,
      updatedAt: now,
      reactions: [],
    };
    const result = await messages.insertOne(message);
    await conversations.updateOne({ _id: makeId(body.conversationId) }, { $set: { lastMessage: message.content, lastMessageTime: now } });
    const saved = await messages.findOne({ _id: result.insertedId });
    return json(res, 200, normalizeDoc(saved));
  }

  if (req.method === "POST" && parts[0] === "upload") {
    return json(res, 200, { url: "/placeholder.svg" });
  }

  if (["PUT", "POST", "DELETE"].includes(req.method)) {
    return json(res, 200, ok(null));
  }

  return json(res, 404, error("Endpoint chat introuvable"));
}

async function moderationRoutes(req, res) {
  if (req.method === "POST") return json(res, 200, ok(null, "Signalement reçu"));
  return json(res, 200, ok([]));
}

async function syncFollowCounts(database, followerId, followingId) {
  const follows = database.collection("follows");
  const users = database.collection("users");
  const followingCount = await follows.countDocuments({ followerId });
  const followersCount = await follows.countDocuments({ followingId });
  await users.updateOne({ _id: makeId(followerId) }, { $set: { followingCount } });
  await users.updateOne({ _id: makeId(followingId) }, { $set: { followersCount } });
}
