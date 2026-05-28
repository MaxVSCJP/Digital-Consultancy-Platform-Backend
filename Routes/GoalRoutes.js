import express from "express";

import {
  createGoal,
  startUserGoal,
  getMyGoals,
  getNextTask,
  completeTask,
  getAllGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
} from "../Controllers/GoalContrrollers.js";
import {verifyToken,verifyAdmin,} from "../Middlewares/AuthorizationMW.js";
import validate from "../Middlewares/ValidateMW.js";
import {
  createGoalValidator,
  startUserGoalValidator,
  getNextTaskValidator,
  completeTaskValidator,
  updateGoalValidator,
  deleteGoalValidator,
} from "../Validators/GoalValidators.js";


const router = express.Router();

router.post( "/",verifyToken, verifyAdmin, validate(createGoalValidator),createGoal);

router.put("/:id", verifyToken, verifyAdmin, validate(updateGoalValidator), updateGoal);

router.delete("/:id", verifyToken, verifyAdmin, validate(deleteGoalValidator), deleteGoal);

// USER
router.post("/start",verifyToken,validate(startUserGoalValidator),startUserGoal);

router.get("/my-goals",verifyToken,getMyGoals);

router.get("/next-task/:userGoalId",verifyToken,validate(getNextTaskValidator),getNextTask);

router.post("/complete-task",verifyToken,validate(completeTaskValidator),completeTask);

router.get( "/",verifyToken,getAllGoals);

router.get("/:id",verifyToken,getGoalById);

export default router;