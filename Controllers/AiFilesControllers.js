import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import createError from "../Utils/CreateErrorsUtils.js";

const AI_FILES_DIR = process.env.AI_FILES_DIR || path.join(process.cwd(), "AI files");
const MAX_PREVIEW_CHARS = 12000;

const ensureAiFilesDir = async () => {
  await fs.promises.mkdir(AI_FILES_DIR, { recursive: true });
};

const resolveFilePath = (fileName) => {
  const safeName = path.basename(fileName || "");
  if (!safeName || safeName.includes("..")) {
    throw createError(400, "Invalid file name");
  }
  return path.join(AI_FILES_DIR, safeName);
};

const readPreviewContent = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    const buffer = await fs.promises.readFile(filePath);
    const parsed = await pdfParse(buffer);
    return parsed?.text || "";
  }
  return fs.promises.readFile(filePath, "utf8");
};

export const listAiFiles = async (req, res, next) => {
  try {
    await ensureAiFilesDir();
    const entries = await fs.promises.readdir(AI_FILES_DIR);
    const files = [];

    for (const name of entries) {
      const filePath = path.join(AI_FILES_DIR, name);
      const stats = await fs.promises.stat(filePath);
      if (!stats.isFile()) continue;
      files.push({
        name,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      });
    }

    files.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    res.json({ data: files });
  } catch (error) {
    next(error);
  }
};

export const uploadAiFiles = async (req, res, next) => {
  try {
    await ensureAiFilesDir();

    const uploaded = [];
    for (const file of req.files || []) {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;
      const destination = path.join(AI_FILES_DIR, fileName);
      await fs.promises.writeFile(destination, file.buffer);
      uploaded.push({ name: fileName });
    }

    res.status(201).json({ message: "AI files uploaded", data: uploaded });
  } catch (error) {
    next(error);
  }
};

export const deleteAiFile = async (req, res, next) => {
  try {
    await ensureAiFilesDir();
    const filePath = resolveFilePath(req.params.fileName);

    if (!fs.existsSync(filePath)) {
      throw createError(404, "AI file not found");
    }

    await fs.promises.unlink(filePath);
    res.json({ message: "AI file deleted" });
  } catch (error) {
    next(error);
  }
};

export const replaceAiFile = async (req, res, next) => {
  try {
    await ensureAiFilesDir();
    const filePath = resolveFilePath(req.params.fileName);

    if (!fs.existsSync(filePath)) {
      throw createError(404, "AI file not found");
    }

    if (!req.file) {
      throw createError(400, "Replacement file is required");
    }

    await fs.promises.writeFile(filePath, req.file.buffer);
    res.json({ message: "AI file replaced" });
  } catch (error) {
    next(error);
  }
};

export const previewAiFile = async (req, res, next) => {
  try {
    await ensureAiFilesDir();
    const filePath = resolveFilePath(req.params.fileName);

    if (!fs.existsSync(filePath)) {
      throw createError(404, "AI file not found");
    }

    const content = await readPreviewContent(filePath);
    const preview = content.slice(0, MAX_PREVIEW_CHARS);

    res.json({ data: { preview } });
  } catch (error) {
    next(error);
  }
};
