import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  getNotifications,
  setNotificationRead,
} from "../Controllers/NotificationControllers.js";
import {
  listNotificationsValidator,
  markNotificationReadValidator,
} from "../Validators/NotificationValidators.js";

const router = express.Router();

router.get("/", validate(listNotificationsValidator), getNotifications);
router.patch(
  "/:notificationId/read",
  validate(markNotificationReadValidator),
  setNotificationRead,
);

export default router;
