import { body, param } from "express-validator";

const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/json",
  "text/csv",
];

export const uploadAiFilesValidator = [
  body("files").custom((value, { req }) => {
    if (!req.files || req.files.length === 0) {
      throw new Error("At least one file is required");
    }

    for (const file of req.files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new Error("Unsupported file type for AI files");
      }
    }

    return true;
  }),
];

export const fileNameParamValidator = [
  param("fileName")
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      if (value.includes("/") || value.includes("\\")) {
        throw new Error("Invalid file name");
      }
      return true;
    }),
];

export const replaceAiFileValidator = [
  ...fileNameParamValidator,
  body("file").custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Replacement file is required");
    }
    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      throw new Error("Unsupported file type for AI files");
    }
    return true;
  }),
];
