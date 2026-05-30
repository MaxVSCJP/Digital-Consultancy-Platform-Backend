import { body, param, query } from "express-validator";

const REVIEW_MAX_LENGTH = 2000;

export const createReviewValidator = [
  body("consultantId").isUUID().withMessage("Valid consultantId is required"),
  body("rating")
    .isInt({ min: 0, max: 5 })
    .withMessage("Rating must be an integer between 0 and 5"),
  body("review")
    .isString()
    .trim()
    .isLength({ min: 1, max: REVIEW_MAX_LENGTH })
    .withMessage("Review must be between 1 and 2000 characters"),
];

export const reviewIdParamValidator = [
  param("reviewId").isUUID().withMessage("Valid reviewId is required"),
];

export const consultantIdParamValidator = [
  param("consultantId").isUUID().withMessage("Valid consultantId is required"),
];

export const listReviewsValidator = [
  query("consultantId").isUUID().withMessage("consultantId must be a valid UUID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

export const listMyReviewsValidator = [
  query("consultantId")
    .optional()
    .isUUID()
    .withMessage("consultantId must be a valid UUID"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];
