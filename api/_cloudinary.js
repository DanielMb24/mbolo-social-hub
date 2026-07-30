import { v2 as cloudinary } from "cloudinary";

let configured = false;

function configureCloudinary() {
  if (configured) return true;

  if (process.env.CLOUDINARY_URL) {
    configured = true;
    return true;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return false;

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
  return true;
}

export function isCloudinaryConfigured() {
  return configureCloudinary();
}

export async function uploadToCloudinary(fileData, folder, options = {}) {
  if (!configureCloudinary()) {
    throw new Error("Cloudinary n'est pas configuré");
  }

  if (!fileData || typeof fileData !== "string") {
    throw new Error("Fichier manquant");
  }

  const result = await cloudinary.uploader.upload(fileData, {
    folder,
    resource_type: "auto",
    overwrite: false,
    ...options,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration || 0,
  };
}
