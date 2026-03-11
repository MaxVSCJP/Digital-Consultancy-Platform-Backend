import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

const DEFAULT_ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".csv",
  ".pdf",
]);

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_CONTEXT_CHARS = 6000;

const normalizeText = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const scoreContent = (content, queryTokens) => {
  if (!content || queryTokens.length === 0) return 0;
  const text = content.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (!token) continue;
    const matches = text.split(token).length - 1;
    score += matches;
  }
  return score;
};

const extractSnippet = (content, queryTokens) => {
  if (!content) return "";
  const lower = content.toLowerCase();
  let index = -1;
  for (const token of queryTokens) {
    const pos = lower.indexOf(token);
    if (pos !== -1) {
      index = pos;
      break;
    }
  }
  if (index === -1) {
    return content.slice(0, 600);
  }
  const start = Math.max(0, index - 200);
  const end = Math.min(content.length, index + 600);
  return content.slice(start, end);
};

const readPdfSafely = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  const parsed = await pdfParse(buffer);
  return parsed?.text || "";
};

const readFileSafely = async (filePath) => {
  const stats = await fs.promises.stat(filePath);
  if (!stats.isFile() || stats.size > MAX_FILE_BYTES) return null;

  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    return readPdfSafely(filePath);
  }

  return fs.promises.readFile(filePath, "utf8");
};

const collectFiles = async (dirPath, allowedExtensions) => {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath, allowedExtensions);
      files.push(...nested);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExtensions.has(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
};

export const loadAiFileContext = async (baseDir, question) => {
  const queryTokens = normalizeText(question).slice(0, 30);
  const directoryExists = fs.existsSync(baseDir);
  if (!directoryExists) {
    return { context: "", sources: [] };
  }

  const files = await collectFiles(baseDir, DEFAULT_ALLOWED_EXTENSIONS);
  const scored = [];

  for (const filePath of files) {
    const content = await readFileSafely(filePath);
    if (!content) continue;
    const score = scoreContent(content, queryTokens);
    if (score > 0) {
      scored.push({
        filePath,
        score,
        snippet: extractSnippet(content, queryTokens),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3);
  let context = "";
  for (const entry of top) {
    const label = path.basename(entry.filePath);
    context += `Source: ${label}\n${entry.snippet}\n\n`;
  }

  if (context.length > MAX_CONTEXT_CHARS) {
    context = context.slice(0, MAX_CONTEXT_CHARS);
  }

  return {
    context: context.trim(),
    sources: top.map((item) => path.basename(item.filePath)),
  };
};
