import User from "../Models/UserModel.js";
import Permission from "../Models/PermissionModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import {
  getUserPermissions,
  updateUserPermissions,
  resetUserPermissionsToDefault,
} from "../Utils/PermissionUtils.js";

/**
 * Get all users with their permissions (admin only)
 */
export const getAllUsersWithPermissions = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "firstName", "lastName", "email", "role", "accountStatus", "verificationStatus", "profileCompletionPercentage", "createdAt"],
      include: [
        {
          model: Permission,
          as: "permissions",
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
};

/**
 * Get specific user with permissions (admin only)
 */
export const getUserWithPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "email", "role", "accountStatus", "verificationStatus", "profileCompletionPercentage", "createdAt"],
      include: [
        {
          model: Permission,
          as: "permissions",
        },
      ],
    });

    if (!user) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

/**
 * Update user permissions (admin only)
 */
export const updatePermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const permissionUpdates = req.body;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const updatedPermissions = await updateUserPermissions(userId, permissionUpdates);

    res.status(200).json({
      success: true,
      message: "Permissions updated successfully",
      permissions: updatedPermissions,
    });
  } catch (error) {
    console.error("Error updating permissions:", error);
    next(error);
  }
};

/**
 * Reset user permissions to role defaults (admin only)
 */
export const resetPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const resetPermissions = await resetUserPermissionsToDefault(userId, user.role);

    res.status(200).json({
      success: true,
      message: "Permissions reset to role defaults",
      permissions: resetPermissions,
    });
  } catch (error) {
    console.error("Error resetting permissions:", error);
    next(error);
  }
};

/**
 * Update user role (admin only)
 * Note: This also resets permissions to the new role's defaults
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return next(createError(400, "Role is required"));
    }

    const validRoles = ["client", "consultant", "admin", "mediaManager", "superAdmin"];
    if (!validRoles.includes(role)) {
      return next(createError(400, "Invalid role"));
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Update user role
    await user.update({ role });

    // Reset permissions to new role defaults
    const resetPermissions = await resetUserPermissionsToDefault(userId, role);

    res.status(200).json({
      success: true,
      message: "User role updated and permissions reset to defaults",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      permissions: resetPermissions,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    next(error);
  }
};
