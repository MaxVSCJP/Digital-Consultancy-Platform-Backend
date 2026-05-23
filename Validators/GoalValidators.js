import { body } from "express-validator";

export const createGoalValidator = [
  body("title").notEmpty().withMessage("Title is required"),
  body("category").notEmpty().withMessage("Category is required"),
];

export const startUserGoalValidator = [
  body("goalId").notEmpty().withMessage("Goal ID is required"),
];

export const getNextTaskValidator = [
  body("userGoalId").notEmpty().withMessage("User Goal ID is required"),
];

export const completeTaskValidator = [
  body("userGoalId").notEmpty().withMessage("User Goal ID is required"),
  body("taskId").notEmpty().withMessage("Task ID is required"),
];