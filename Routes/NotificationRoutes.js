import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  getNotifications,
  setNotificationRead,
  setAllNotificationsRead,
} from "../Controllers/NotificationControllers.js";
import {
  listNotificationsValidator,
  markNotificationReadValidator,
} from "../Validators/NotificationValidators.js";
import { verifyToken } from "../Middlewares/AuthorizationMW.js";

const router = express.Router();

router.get("/", verifyToken, validate(listNotificationsValidator), getNotifications);
router.patch("/read-all", verifyToken, setAllNotificationsRead);
router.patch(
  "/:notificationId/read",
  verifyToken,
  validate(markNotificationReadValidator),
  setNotificationRead,
);

export default router;
