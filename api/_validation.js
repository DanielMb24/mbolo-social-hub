import { ObjectId } from "mongodb";

export function requireString(value, field, { min = 1, max = 500 } = {}) {
  const text = String(value || "").trim();
  if (text.length < min || text.length > max) {
    const error = new Error(`${field} invalide`);
    error.status = 400;
    throw error;
  }
  return text;
}

export function requireEmail(value) {
  const email = requireString(value, "Email", { min: 5, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Email invalide");
    error.status = 400;
    throw error;
  }
  return email;
}

export function requireUsername(value) {
  const username = requireString(value, "Nom d'utilisateur", { min: 3, max: 30 });
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(username)) {
    const error = new Error("Nom d'utilisateur invalide");
    error.status = 400;
    throw error;
  }
  return username;
}

export function requirePassword(value) {
  const password = String(value || "");
  if (password.length < 8 || password.length > 128) {
    const error = new Error("Le mot de passe doit contenir au moins 8 caractères");
    error.status = 400;
    throw error;
  }
  return password;
}

export function validateId(value, field = "Identifiant") {
  const id = requireString(value, field, { min: 1, max: 80 });
  if (id.length === 24 && !ObjectId.isValid(id)) {
    const error = new Error(`${field} invalide`);
    error.status = 400;
    throw error;
  }
  return id;
}

export function parsePagination(url) {
  const page = Math.max(0, Math.min(1000, Number(url.searchParams.get("page") || 0)));
  const size = Math.max(1, Math.min(50, Number(url.searchParams.get("size") || 20)));
  return { page, size };
}

export function escapeRegex(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function validateSearch(value) {
  return String(value || "").trim().slice(0, 50);
}

export function validateMedia(body, { imageOnly = false, maxSize = 5 * 1024 * 1024 } = {}) {
  if (!body.fileData) return null;
  const fileType = String(body.fileType || "");
  const fileSize = Number(body.fileSize || 0);
  const isImage = fileType.startsWith("image/") && String(body.fileData).startsWith("data:image/");
  const isVideo = fileType.startsWith("video/") && String(body.fileData).startsWith("data:video/");

  if (fileSize <= 0 || fileSize > maxSize || (!isImage && (!isVideo || imageOnly))) {
    const error = new Error("Fichier invalide");
    error.status = fileSize > maxSize ? 413 : 400;
    throw error;
  }

  return { fileType, fileSize };
}
