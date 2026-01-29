import AuditLog from "../Models/AuditLogModel.js";

/**
 * Log an action to the audit database
 * @param {object} logData - Data to log
 */
export const logAudit = async ({
  userId,
  action,
  targetUserId = null,
  targetResource = null,
  changes = null,
  req = null,
}) => {
  try {
    const logEntry = {
      userId,
      action,
      targetUserId,
      targetResource,
      changes,
    };

    if (req) {
      logEntry.ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      logEntry.userAgent = req.headers["user-agent"];
    }

    await AuditLog.create(logEntry);
  } catch (error) {
    // We don't want audit logging failure to crash the main request
    // but we should log it to the server console
    console.error("Audit logging failed:", error);
  }
};

/**
 * Get audit logs (for admin)
 * @param {object} filters - Search filters
 * @returns {object} Paginated logs
 */
export const getAuditLogs = async (filters = {}) => {
  const { userId, targetUserId, action, page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;
  if (targetUserId) where.targetUserId = targetUserId;
  if (action) where.action = action;

  const logs = await AuditLog.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [["createdAt", "DESC"]],
  });

  return {
    totalItems: logs.count,
    items: logs.rows,
    totalPages: Math.ceil(logs.count / limit),
    currentPage: page,
  };
};
