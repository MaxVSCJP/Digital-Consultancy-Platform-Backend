import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";
import Goal from "./GoalModel.js";

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  stepOrder: {
    type: DataTypes.INTEGER, // 1,2,3...
    allowNull: false,
  },

  mapLinks: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});

export default Task;