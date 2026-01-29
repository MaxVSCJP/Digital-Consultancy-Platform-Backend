import Permission from "../Models/PermissionModel.js";
import createError from "./CreateErrorsUtils.js";
import { getDefaultPermissions } from "../Configs/PermissionsConfig.js";

/**
 * Get user permissions by userId
 * @param {string} userId - User ID
 * @returns {Promise<object>} Permission object
 */
export const getUserPermissions = async (userId) => {
  try {
    const permissions = await Permission.findOne({
      where: { userId },
    });

    if (!permissions) {
      throw createError(404, "Permissions not found for user");
    }

    return permissions;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    throw error;
  }
};

/**
 * Update user permissions (admin only)
 * @param {string} userId - User ID
 * @param {object} permissionUpdates - Object with permission fields to update
 * @returns {Promise<object>} Updated permission object
 */
export const updateUserPermissions = async (userId, permissionUpdates) => {
  try {
    const permissions = await Permission.findOne({
      where: { userId },
    });

    if (!permissions) {
      throw createError(404, "Permissions not found for user");
    }

    await permissions.update(permissionUpdates);
    return permissions;
  } catch (error) {
    console.error("Error updating user permissions:", error);
    throw error;
  }
};

/**
 * Reset user permissions to role defaults (admin only)
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Promise<object>} Updated permission object
 */
export const resetUserPermissionsToDefault = async (userId, role) => {
  try {
    const permissions = await Permission.findOne({
      where: { userId },
    });

    if (!permissions) {
      throw createError(404, "Permissions not found for user");
    }

    const defaultPermissions = getDefaultPermissions(role);
    await permissions.update(defaultPermissions);
    return permissions;
  } catch (error) {
    console.error("Error resetting user permissions:", error);
    throw error;
  }
};

/**
 * Check if user has specific permission
 * @param {string} userId - User ID
 * @param {string} permissionName - Name of permission to check
 * @returns {Promise<boolean>} True if user has permission
 */
export const checkUserPermission = async (userId, permissionName) => {
  try {
    const permissions = await Permission.findOne({
      where: { userId },
    });

    if (!permissions) {
      return false;
    }

    return permissions[permissionName] === true;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
};

/**
 * Middleware to check if user has required permission
 * @param {string} permissionName - Name of permission required
 * @returns {Function} Express middleware function
 */
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return next(createError(401, "Authentication required"));
      }

      // Admins and superAdmins bypass permission checks
      if (req.user.role === "admin" || req.user.role === "superAdmin") {
        return next();
      }

      const hasPermission = await checkUserPermission(req.user.id, permissionName);

      if (!hasPermission) {
        return next(createError(403, `Permission denied: ${permissionName} required`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissionsToDefault,
  checkUserPermission,
  requirePermission,
};
