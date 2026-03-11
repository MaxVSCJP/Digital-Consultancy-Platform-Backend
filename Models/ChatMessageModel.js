import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    threadId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender: {
      type: DataTypes.ENUM("user", "ai"),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    indexes: [{ fields: ["threadId", "createdAt"] }],
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: false,
  }
);

export default ChatMessage;
