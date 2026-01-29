/**
 * Default permissions for each role
 * These are automatically assigned when a user signs up
 * Admins can later modify these permissions per user
 */

export const DEFAULT_PERMISSIONS = {
  client: {
    canCreateContent: false,
    canEditOwnContent: false,
    canDeleteOwnContent: false,
    canViewAllContent: false,
    canEditAllContent: false,
    canDeleteAllContent: false,
    canManageUsers: false,
    canManageRoles: false,
    canManagePermissions: false,
    canUploadMedia: true,
    canManageMedia: false,
    canViewAnalytics: false,
    canGenerateReports: false,
    canAcceptProjects: false,
    canManageProjects: false,
    canRequestServices: true,
    canViewOwnProjects: true,
  },
  consultant: {
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canViewAllContent: false,
    canEditAllContent: false,
    canDeleteAllContent: false,
    canManageUsers: false,
    canManageRoles: false,
    canManagePermissions: false,
    canUploadMedia: true,
    canManageMedia: false,
    canViewAnalytics: true,
    canGenerateReports: true,
    canAcceptProjects: true,
    canManageProjects: true,
    canRequestServices: false,
    canViewOwnProjects: true,
  },
  admin: {
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canViewAllContent: true,
    canEditAllContent: true,
    canDeleteAllContent: true,
    canManageUsers: true,
    canManageRoles: true,
    canManagePermissions: true,
    canUploadMedia: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canGenerateReports: true,
    canAcceptProjects: true,
    canManageProjects: true,
    canRequestServices: true,
    canViewOwnProjects: true,
  },
  mediaManager: {
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canViewAllContent: true,
    canEditAllContent: false,
    canDeleteAllContent: false,
    canManageUsers: false,
    canManageRoles: false,
    canManagePermissions: false,
    canUploadMedia: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canGenerateReports: false,
    canAcceptProjects: false,
    canManageProjects: false,
    canRequestServices: false,
    canViewOwnProjects: false,
  },
  superAdmin: {
    canCreateContent: true,
    canEditOwnContent: true,
    canDeleteOwnContent: true,
    canViewAllContent: true,
    canEditAllContent: true,
    canDeleteAllContent: true,
    canManageUsers: true,
    canManageRoles: true,
    canManagePermissions: true,
    canUploadMedia: true,
    canManageMedia: true,
    canViewAnalytics: true,
    canGenerateReports: true,
    canAcceptProjects: true,
    canManageProjects: true,
    canRequestServices: true,
    canViewOwnProjects: true,
  },
};

/**
 * Get default permissions for a role
 * @param {string} role - User role
 * @returns {object} Default permissions object
 */
export const getDefaultPermissions = (role) => {
  return DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.client;
};
