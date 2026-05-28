import { body, check, param, query } from "express-validator";

const imageSize = 3;
const cvSize = 5;
const CV_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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

  body("title")
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage("Professional title must be 120 characters or fewer"),

  body("about")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("About section must be 2000 characters or fewer"),

  body("userAddress")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("User address must be 300 characters or fewer"),

  body("businessName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Business name must be 200 characters or fewer"),

  body("businessCity")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business city must be 100 characters or fewer"),

  body("businessSubCity")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business sub-city must be 100 characters or fewer"),

  body("businessWereda")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business Wereda must be 100 characters or fewer"),

  body("businessKebele")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Business Kebele must be 100 characters or fewer"),

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
      const profileImage = req.files?.profileImage?.[0];
      if (!profileImage) return true;
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
      if (!allowedTypes.includes(profileImage.mimetype)) {
        throw new Error("Only JPG, JPEG, PNG, WEBP files are allowed for profile image");
      }
      if (profileImage.size > imageSize * 1024 * 1024) {
        throw new Error(`Profile image size should be less than ${imageSize}MB`);
      }
      return true;
    }),

  check("cv")
    .optional()
    .custom((value, { req }) => {
      const cvFile = req.files?.cv?.[0];
      if (!cvFile) return true;
      if (!CV_MIME_TYPES.includes(cvFile.mimetype)) {
        throw new Error("Only PDF, DOC, DOCX files are allowed for CV");
      }
      if (cvFile.size > cvSize * 1024 * 1024) {
        throw new Error(`CV size should be less than ${cvSize}MB`);
      }
      return true;
    }),
];

export const changePasswordValidator = [
  body("oldPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required")
    .isLength({ min: 8 })
    .withMessage("Current password must be at least 8 characters long"),

  body("newPassword")
    .trim()
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long"),
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
