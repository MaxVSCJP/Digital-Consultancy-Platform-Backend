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
