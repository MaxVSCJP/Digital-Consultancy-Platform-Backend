import { body, param, query } from "express-validator";

const STATUS_VALUES = ["open", "pending", "booked", "archived"];

export const createAvailabilityValidator = [
  body("consultantId").isUUID().withMessage("Valid consultantId is required"),
  body("slotStart").isISO8601().withMessage("slotStart must be a valid ISO8601 date"),
  body("slotEnd").isISO8601().withMessage("slotEnd must be a valid ISO8601 date"),
  body("timezone").optional().isString().withMessage("timezone must be a string"),
  body("meta")
    .optional()
    .custom((value) => typeof value === "object" && value !== null)
    .withMessage("meta must be a plain object"),
];

export const listAvailabilityValidator = [
  param("consultantId").isUUID().withMessage("Valid consultantId is required"),
  query("status")
    .optional()
    .isIn(STATUS_VALUES)
    .withMessage("status must be open, pending, booked, or archived"),
];

export const updateAvailabilityValidator = [
  param("availabilityId").isUUID().withMessage("Valid availabilityId is required"),
  body("slotStart").optional().isISO8601().withMessage("slotStart must be a valid ISO8601 date"),
  body("slotEnd").optional().isISO8601().withMessage("slotEnd must be a valid ISO8601 date"),
  body("timezone").optional().isString().withMessage("timezone must be a string"),
  body("status")
    .optional()
    .isIn(STATUS_VALUES)
    .withMessage("status must be open, pending, booked, or archived"),
  body("meta")
    .optional()
    .custom((value) => typeof value === "object" && value !== null)
    .withMessage("meta must be a plain object"),
];
