import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";
import User from "./UserModel.js";
import Goal from "./GoalModel.js";

const UserGoal = sequelize.define("UserGoal", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
  },

  goalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Goal,
      key: "id",
    },
    onDelete: "CASCADE",
  },

  progress: {
    type: DataTypes.FLOAT, // 0 to 100
    defaultValue: 0,
  },

  status: {
    type: DataTypes.ENUM("not_started", "in_progress", "completed"),
    defaultValue: "not_started",
  },
});

export default UserGoal;