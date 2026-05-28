import { body, param } from "express-validator";

export const createGoalValidator = [
  body("title").notEmpty().withMessage("Title is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("businessArea").optional().isString(),
  body("businessType").optional().isString(),
  body().custom((value, { req }) => {
    const area = typeof req.body.businessArea === "string" ? req.body.businessArea.trim() : "";
    const type = typeof req.body.businessType === "string" ? req.body.businessType.trim() : "";
    if (!area && !type) {
      throw new Error("Business area or type is required");
    }
    return true;
  }),
  body("tasks").optional().isArray(),
  body("tasks.*.id").optional().isInt({ min: 1 }),
  body("tasks.*.title").optional().isString().notEmpty(),
  body("tasks.*.description").optional().isString(),
  body("tasks.*.stepOrder").optional().isInt({ min: 1 }),
  body("tasks.*.mapLinks").optional().isArray(),
  body("tasks.*.mapLinks.*.url").optional().isString().notEmpty(),
  body("tasks.*.mapLinks.*.subCity").optional().isString().notEmpty(),
  body("tasks.*.mapLinks.*.city").optional().isString(),
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

export const updateGoalValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid goal ID is required"),
  body("title").notEmpty().withMessage("Title is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("description").optional().isString(),
  body("businessArea").optional().isString(),
  body("businessType").optional().isString(),
  body().custom((value, { req }) => {
    const area = typeof req.body.businessArea === "string" ? req.body.businessArea.trim() : "";
    const type = typeof req.body.businessType === "string" ? req.body.businessType.trim() : "";
    if (!area && !type) {
      throw new Error("Business area or type is required");
    }
    return true;
  }),
  body("tasks").optional().isArray(),
  body("tasks.*.id").optional().isInt({ min: 1 }),
  body("tasks.*.title").optional().isString().notEmpty(),
  body("tasks.*.description").optional().isString(),
  body("tasks.*.stepOrder").optional().isInt({ min: 1 }),
  body("tasks.*.mapLinks").optional().isArray(),
  body("tasks.*.mapLinks.*.url").optional().isString().notEmpty(),
  body("tasks.*.mapLinks.*.subCity").optional().isString().notEmpty(),
  body("tasks.*.mapLinks.*.city").optional().isString(),
];

export const deleteGoalValidator = [
  param("id").isInt({ min: 1 }).withMessage("Valid goal ID is required"),
];