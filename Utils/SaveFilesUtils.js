import sharp from "sharp";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { origin } from "../Configs/ProDevConfig.js";
import { invalidateCloudflareCache } from "./CloudflareUtils.js";

const uploadDir = process.env.UPLOAD_DIR || "./Uploads";

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const saveImage = async (
  imageBuffer,
  originalname,
  saveFolderName,
  width = 400,
  quality = 80
) => {
  try {
    const fileName = `${Date.now()}-${originalname}`;
    const outputDir = path.join(uploadDir, saveFolderName);
    ensureDirectory(outputDir);

    const filePath = path.join(outputDir, fileName);

    await sharp(imageBuffer)
      .resize({ width: width })
      .webp({ quality: quality })
      .toFile(filePath);

    return `${origin}/Uploads/${saveFolderName}/${fileName}`;
  } catch (error) {
    console.error("Error saving image:", error);
    throw new Error("Failed to save image");
  }
};

export const saveProfileImage = async (imageBuffer, originalname) => {
  return saveImage(imageBuffer, originalname, "ProfileImages");
};

export const saveCVImage = async (imageBuffer, originalname) => {
  return saveImage(imageBuffer, originalname, "CVImages");
};

export const deleteFileByUrl = async (fileUrl) => {
  try {
    if (typeof fileUrl !== "string" || !fileUrl.startsWith(origin)) {
      return false;
    }

    const urlObj = new URL(fileUrl);
    const filePath = decodeURIComponent(urlObj.pathname);
    const absolutePath = path.resolve(
      process.cwd(),
      ".",
      filePath.replace(/^[\\/]/, "")
    );

    if (fs.existsSync(absolutePath)) {
      await fs.promises.unlink(absolutePath);
      await invalidateCloudflareCache([filePath]);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error deleting file:", err);
    return false;
  }
};
