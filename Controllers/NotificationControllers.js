import {
  listNotificationsForRecipient,
  markAllNotificationsRead,
  markNotificationRead,
} from "../Services/NotificationServices.js";

export const getNotifications = async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 50;
    const offset = Number.parseInt(req.query.offset, 10) || 0;
    const unreadOnly = req.query.unreadOnly === "true";

    const recipientId = req.user?.id;

    const notifications = await listNotificationsForRecipient(recipientId, {
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
    const notification = await markNotificationRead(req.params.notificationId, req.user?.id);
    res.json({ data: notification });
  } catch (error) {
    next(error);
  }
};

export const setAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await markAllNotificationsRead(req.user?.id);
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
};
