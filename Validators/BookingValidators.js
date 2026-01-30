import { body, param, query } from "express-validator";

const STATUS_VALUES = ["pending", "accepted", "declined", "cancelled", "completed"];

export const createBookingValidator = [
  body("consultantId").isUUID().withMessage("Valid consultantId is required"),
  body("availabilityId").isUUID().withMessage("Valid availabilityId is required"),
  body("notes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Notes must be at most 1000 characters"),
];

export const updateBookingStatusValidator = [
  param("bookingId").isUUID().withMessage("Valid bookingId is required"),
  body("status")
    .isString()
    .toLowerCase()
    .isIn(STATUS_VALUES)
    .withMessage("Status must be one of pending, accepted, declined, cancelled, or completed"),
  body("note")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Note must be at most 1000 characters"),
];

export const listBookingsValidator = [
  query("userId").optional().isUUID().withMessage("userId must be a valid UUID"),
  query("consultantId").optional().isUUID().withMessage("consultantId must be a valid UUID"),
  query("status")
    .optional()
    .isIn(STATUS_VALUES)
    .withMessage("status must be pending, accepted, declined, cancelled, or completed"),
];
