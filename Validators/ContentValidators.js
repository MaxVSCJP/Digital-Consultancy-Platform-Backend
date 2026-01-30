import { body, query } from "express-validator";

const CONTENT_TYPES = ["file", "article"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const listContentValidator = [
  query("category")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("category must be a non-empty string"),
  query("search")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("search must be a non-empty string"),
];

export const createContentValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("category is required"),
  body("contentType")
    .trim()
    .isIn(CONTENT_TYPES)
    .withMessage("contentType must be 'file' or 'article'"),
  body("description").custom((value, { req }) => {
    if (req.body.contentType === "article") {
      if (!value || String(value).trim().length === 0) {
        throw new Error("Description is required for article content");
      }
    }
    return true;
  }),
  body("file").custom((value, { req }) => {
    if (req.body.contentType === "file" && !req.file) {
      throw new Error("File is required when contentType is 'file'");
    }
    if (req.body.contentType === "article" && req.file) {
      throw new Error("File is not allowed when contentType is 'article'");
    }
    if (req.file && !ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      throw new Error("Unsupported file type for content upload");
    }
    return true;
  }),
];

export const updateContentValidator = [
  body("title")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("title must be a non-empty string"),
  body("category")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("category must be a non-empty string"),
  body("description")
    .optional()
    .isString()
    .trim()
    .withMessage("description must be a string"),
  body("file").custom((value, { req }) => {
    if (req.file && !ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      throw new Error("Unsupported file type for content upload");
    }
    return true;
  }),
];
