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

/**
 * FR-CP-03: Virus scanning mock
 * In a real production environment, this would integrate with ClamAV or a cloud provider API.
 */
export const scanForViruses = async (fileBuffer) => {
    // Mock sleep to simulate processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Safety check: common "eicar" test string to simulate a detection
    const content = fileBuffer.toString();
    if (content.includes("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*")) {
        console.warn("VIRUS DETECTED: Eicar test file found!");
        return { safe: false, reason: "Virus detected (Eicar test string)" };
    }
    
    return { safe: true };
};

export const saveImage = async (
  imageBuffer,
  originalname,
  saveFolderName,
  width = 400,
  quality = 80
) => {
  try {
    // FR-CP-03: Scanning before storage
    const scan = await scanForViruses(imageBuffer);
    if (!scan.safe) throw new Error(scan.reason);

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
    throw error;
  }
};

export const saveProfileImage = async (imageBuffer, originalname) => {
  return saveImage(imageBuffer, originalname, "ProfileImages");
};

export const saveCVImage = async (fileBuffer, originalname, quality = 80) => {
  try {
    // FR-CP-03: Scanning before storage
    const scan = await scanForViruses(fileBuffer);
    if (!scan.safe) throw new Error(scan.reason);

    const fileName = `${Date.now()}-${originalname}`;
    const outputDir = path.join(uploadDir, "CVImages");
    ensureDirectory(outputDir);

    const filePath = path.join(outputDir, fileName);

    // Check if file is PDF or Word doc - save directly without Sharp processing
    const lowerName = originalname.toLowerCase();
    const isDirectSave = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');
    
    if (isDirectSave) {
      // Save documents directly
      await fs.promises.writeFile(filePath, fileBuffer);
    } else {
      // Process images with Sharp
      await sharp(fileBuffer)
        .resize({ width: 800 })
        .webp({ quality: quality })
        .toFile(filePath);
    }

    return `${origin}/Uploads/CVImages/${fileName}`;
  } catch (error) {
    console.error("Error saving CV file:", error);
    throw error;
  }
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
