import { param, query } from "express-validator";

export const listNotificationsValidator = [
  query("unreadOnly")
    .optional()
    .isIn(["true", "false"])
    .withMessage("unreadOnly must be true or false"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage("limit must be between 1 and 200"),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be zero or a positive integer"),
];

export const markNotificationReadValidator = [
  param("notificationId")
    .isUUID()
    .withMessage("notificationId must be a valid UUID"),
];
