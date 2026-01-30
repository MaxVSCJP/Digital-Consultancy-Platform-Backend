import { body, check, param, query } from "express-validator";

const imageSize = 3;

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty"),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty"),

  body("businessName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Business name must be 200 characters or fewer"),

  body("businessAddress")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Business address must be 300 characters or fewer"),

  body("businessType")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business type must be 100 characters or fewer"),

  body("businessArea")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business area must be 100 characters or fewer"),

  body("tin")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("TIN must be 50 characters or fewer"),

  check("profileImage")
    .optional()
    .custom((value, { req }) => {
      if (!req.file) return true;
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only JPG, JPEG, PNG, WEBP files are allowed for profile image");
      }
      if (req.file.size > imageSize * 1024 * 1024) {
        throw new Error(`Profile image size should be less than ${imageSize}MB`);
      }
      return true;
    }),
];

export const listConsultantsValidator = [
  query("search")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage("search must be 100 characters or fewer"),
];

export const getConsultantValidator = [
  param("consultantId").isUUID().withMessage("Valid consultantId is required"),
];
