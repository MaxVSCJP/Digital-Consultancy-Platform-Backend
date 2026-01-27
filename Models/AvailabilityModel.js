import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const Availability = sequelize.define(
  "Availability",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    consultantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    slotStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    slotEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "UTC",
    },
    status: {
      type: DataTypes.ENUM("open", "pending", "booked", "archived"),
      allowNull: false,
      defaultValue: "open",
    },
    meta: {
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
      { fields: ["consultantId"] },
      { fields: ["status"] },
    ],
  },
);

export default Availability;
