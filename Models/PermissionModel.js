import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Permission = sequelize.define(
  "Permission",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    // Core permissions
    canCreateContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canEditOwnContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canDeleteOwnContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canViewAllContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canEditAllContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canDeleteAllContent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // User management permissions
    canManageUsers: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canManageRoles: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canManagePermissions: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // Media permissions
    canUploadMedia: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canManageMedia: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // Analytics and reporting
    canViewAnalytics: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canGenerateReports: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // Consultant-specific permissions
    canAcceptProjects: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canManageProjects: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    // Client-specific permissions
    canRequestServices: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    canViewOwnProjects: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["userId"] }],
  }
);

export default Permission;
