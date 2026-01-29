import { DataTypes } from "sequelize";
import { sequelizeLogs } from "../Configs/DatabaseConfig.js";

const Log = sequelizeLogs.define("Log", {
  method: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  responseTime: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userRole: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Log;
