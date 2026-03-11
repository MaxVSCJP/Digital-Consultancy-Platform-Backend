import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const ChatThread = sequelize.define(
  "ChatThread",
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
    role: {
      type: DataTypes.ENUM("user", "consultant"),
      allowNull: false,
    },
  },
  {
    indexes: [{ fields: ["userId", "role"] }],
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

export default ChatThread;
