import { MongoClient, ObjectId } from "mongodb";
import crypto from "node:crypto";
import { parseCookies } from "./_http.js";

let clientPromise;

export function json(res, status, data) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export function ok(data, message = "OK") {
  return { success: true, message, data };
}

export function error(message) {
  return { success: false, message };
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function db() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB || "mbolo");
}

export async function serviceDb(name) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }
  if (!clientPromise) {
    clientPromise = new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  const prefix = process.env.MONGODB_SERVICE_PREFIX || "mbolo";
  const dbName = process.env[`MONGODB_${name.toUpperCase()}_DB`] || `${prefix}_${name}`;
  return client.db(dbName);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    username: user.username,
    fullname: user.fullname || user.fullName || "",
    fullName: user.fullName || user.fullname || "",
    bio: user.bio || "",
    avatarUrl: user.avatarUrl || "",
    coverUrl: user.coverUrl || "",
    location: user.location || "",
    followersCount: user.followersCount || 0,
    followingCount: user.followingCount || 0,
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

export function privateUser(user) {
  if (!user) return null;
  return {
    ...publicUser(user),
    email: user.email || "",
  };
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  return hashPassword(password, salt) === `${salt}:${hash}`;
}

export function signToken(payload, expiresInSeconds = 60 * 60 * 24 * 7) {
  const secret = getJwtSecret();
  const body = {
    ...payload,
    typ: payload.typ || "access",
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token, expectedType = "access") {
  if (!token || !token.includes(".")) return null;
  const secret = getJwtSecret();
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  if (Buffer.byteLength(sig) !== Buffer.byteLength(expected)) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (expectedType && payload.typ !== expectedType) return null;
  if (!payload.userId || typeof payload.userId !== "string") return null;
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function currentUserId(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const payload = verifyToken(token);
  return payload?.userId || null;
}

export function currentAuth(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return verifyToken(token, "access");
}

export function refreshTokenFromRequest(req) {
  const cookies = parseCookies(req);
  return cookies.mbolo_refresh || "";
}

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    const error = new Error("JWT_SECRET is missing or too short");
    error.status = 503;
    throw error;
  }
  return secret;
}

export function makeId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}

export function normalizeDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id), ...rest };
}

export function pageResult(items, page, size, total) {
  return {
    content: items,
    totalElements: total,
    totalPages: Math.ceil(total / size),
    currentPage: page,
    size,
  };
}
