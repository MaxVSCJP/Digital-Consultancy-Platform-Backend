import { body, query, param } from "express-validator";

const CONTENT_TYPES = ["file", "article"];
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const FILE_MIME_TYPES = [
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

export const getContentByIdValidator = [
  param("id").isUUID().withMessage("id must be a valid UUID"),
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
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required"),
  body("file").custom((value, { req }) => {
    const fileUpload = req.files?.file?.[0];
    if (req.body.contentType === "file" && !fileUpload) {
      throw new Error("File is required when contentType is 'file'");
    }
    if (req.body.contentType === "article" && fileUpload) {
      throw new Error("File is not allowed when contentType is 'article'");
    }
    if (fileUpload && !FILE_MIME_TYPES.includes(fileUpload.mimetype)) {
      throw new Error("Unsupported file type for content upload");
    }
    return true;
  }),
  body("image").custom((value, { req }) => {
    const imageUpload = req.files?.image?.[0];
    if (!imageUpload) {
      throw new Error("Cover image is required");
    }
    if (imageUpload && !IMAGE_MIME_TYPES.includes(imageUpload.mimetype)) {
      throw new Error("Unsupported image type for cover image");
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
    const fileUpload = req.files?.file?.[0];
    if (fileUpload && !FILE_MIME_TYPES.includes(fileUpload.mimetype)) {
      throw new Error("Unsupported file type for content upload");
    }
    return true;
  }),
  body("image").custom((value, { req }) => {
    const imageUpload = req.files?.image?.[0];
    if (imageUpload && !IMAGE_MIME_TYPES.includes(imageUpload.mimetype)) {
      throw new Error("Unsupported image type for cover image");
    }
    return true;
  }),
];
