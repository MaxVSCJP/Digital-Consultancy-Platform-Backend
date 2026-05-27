import Notification from "../Models/NotificationModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

export const createNotification = async (payload, options = {}) => {
  return Notification.create(payload, options);
};

export const listNotificationsForRecipient = async (
  recipientId,
  { limit = 50, offset = 0, unreadOnly = false } = {},
) => {
  if (!recipientId) {
    throw createError(400, "recipientId is required for listing notifications");
  }

  const where = { recipientId };
  if (unreadOnly) {
    where.read = false;
  }

  return Notification.findAll({
    where,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
  });
};

export const markNotificationRead = async (notificationId, recipientId) => {
  if (!recipientId) {
    throw createError(401, "Authentication required");
  }

  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw createError(404, "Notification not found");
  }

  if (notification.recipientId !== recipientId) {
    throw createError(403, "You are not authorized to update this notification");
  }

  if (notification.read) {
    return notification;
  }

  return notification.update({ read: true });
};

export const markAllNotificationsRead = async (recipientId) => {
  if (!recipientId) {
    throw createError(401, "Authentication required");
  }

  const [updatedCount] = await Notification.update(
    { read: true },
    { where: { recipientId, read: false } },
  );

  return { updatedCount };
};
