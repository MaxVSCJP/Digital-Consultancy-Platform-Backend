import { DataTypes } from "sequelize";
import { sequelizeLogs } from "../Configs/DatabaseConfig.js";

const AuditLog = sequelizeLogs.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    targetUserId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    targetResource: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    changes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["userId"] },
      { fields: ["targetUserId"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default AuditLog;
