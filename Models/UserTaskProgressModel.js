import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";
import UserGoal from "./UserGoalModel.js";
import Task from "./TaskModel.js";

const UserTaskProgress = sequelize.define("UserTaskProgress", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userGoalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: UserGoal,
      key: "id",
    },
    onDelete: "CASCADE",
  },

  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: "id",
    },
    onDelete: "CASCADE",
  },

  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default UserTaskProgress;