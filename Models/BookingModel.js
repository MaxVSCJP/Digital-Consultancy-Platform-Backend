import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Booking = sequelize.define(
  "Booking",
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
    consultantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    appointmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined", "cancelled", "completed"),
      defaultValue: "pending",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    availabilityId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    slotStart: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    slotEnd: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "UTC",
    },
    googleEventId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    paranoid: true,
    deletedAt: "deletedAt",
    indexes: [
      { fields: ["userId"] },
      { fields: ["consultantId"] },
      { fields: ["status"] },
    ],
  },
);

export default Booking;
