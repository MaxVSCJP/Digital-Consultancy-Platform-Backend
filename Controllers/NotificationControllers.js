import {
  listNotificationsForRecipient,
  markNotificationRead,
} from "../Services/NotificationServices.js";

export const getNotifications = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    const offset = Number.parseInt(req.query.offset, 10) || 0;
    const unreadOnly = req.query.unreadOnly === "true";

    const notifications = await listNotificationsForRecipient(req.query.recipientId, {
      limit,
      offset,
      unreadOnly,
    });

    res.json({ data: notifications });
  } catch (error) {
    next(error);
  }
};

export const setNotificationRead = async (req, res, next) => {
  try {
    const notification = await markNotificationRead(req.params.notificationId);
    res.json({ data: notification });
  } catch (error) {
    next(error);
  }
};
