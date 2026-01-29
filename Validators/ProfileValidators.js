import { body } from "express-validator";

export const updateProfileValidator = [
  body("firstName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty"),

  body("lastName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Please enter a valid E.164 phone number (e.g. +251911223344)"),

  body("timezone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Timezone cannot be empty"),

  body("businessName")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Business name cannot exceed 255 characters"),

  body("businessAddress")
    .optional()
    .trim()
];

export const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from the current one");
      }
      return true;
    })
];
