import express from "express";
import {
  createGoal,
  startUserGoal,
  getMyGoals,
  getNextTask,
  completeTask,
  getAllGoals,
  getGoalById,
} from "../Controllers/GoalContrrollers.js";

import {
  verifyToken,
  verifyAdmin,
} from "../Middlewares/AuthorizationMW.js";

const router = express.Router();

// ADMIN ONLY
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  createGoal
);

// USER
router.post("/start", verifyToken, startUserGoal);
router.get("/my-goals", verifyToken, getMyGoals);
router.get("/next-task/:userGoalId", verifyToken, getNextTask);
router.post("/complete-task", verifyToken, completeTask);
router.get("/", verifyToken, getAllGoals);
router.get("/:id", verifyToken, getGoalById);

export default router;