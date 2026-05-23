import { body, param, query } from "express-validator";

const ROLE_VALUES = ["user", "consultant", "admin"];

export const listUsersValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1 }).withMessage("limit must be >= 1"),
  query("role")
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage("role must be user, consultant, or admin"),
  query("search").optional().isString().trim(),
];

export const updateUserRoleValidator = [
  param("userId").isUUID().withMessage("Valid userId is required"),
  body("role")
    .isString()
    .isIn(ROLE_VALUES)
    .withMessage("role must be user, consultant, or admin"),
];

export const createAdminUserValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("role")
    .isString()
    .isIn(ROLE_VALUES)
    .withMessage("role must be user, consultant, or admin"),
];

export const updateUserStatusValidator = [
  param("userId").isUUID().withMessage("Valid userId is required"),
  body("status")
    .isString()
    .isIn(["active", "inactive"])
    .withMessage("status must be active or inactive"),
];
