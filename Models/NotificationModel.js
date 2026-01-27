import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("booking_request", "booking_update", "system"),
      allowNull: false,
      defaultValue: "system",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    paranoid: true,
    deletedAt: "deletedAt",
    indexes: [
      { fields: ["recipientId"] },
      { fields: ["bookingId"] },
      { fields: ["read"] },
    ],
  },
);

export default Notification;
