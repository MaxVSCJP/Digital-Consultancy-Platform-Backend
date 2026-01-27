import { sequelizeLogs } from "../Configs/DatabaseConfig.js";
import { DataTypes } from "sequelize";

const Log = sequelizeLogs.define(
  "RequestLogs",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    method: DataTypes.STRING,
    url: DataTypes.TEXT,
    status: DataTypes.INTEGER,
    responseTime: DataTypes.INTEGER,
    userId: DataTypes.STRING,
    userName: DataTypes.STRING,
    userRole: DataTypes.STRING,
    ip: DataTypes.STRING,
  },
  {
    timestamps: true,
    createdAt: "timestamp",
    updatedAt: false,
  }
);

export default Log;
