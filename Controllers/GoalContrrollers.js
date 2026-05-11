import Goal from "../Models/GoalModel.js";
import Task from "../Models/TaskModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import UserGoal from "../Models/UserGoalModel.js";
import UserTaskProgress from "../Models/UserTaskProgressModel.js";
import { getNextTaskService } from "../Services/GoalServices.js";
import { completeTaskService } from "../Services/GoalServices.js";
import { getAllGoalsService,getGoalByIdService} from "../Services/GoalServices.js";

export const createGoal = async (req, res, next) => {
  try {
    const { title, description, category, tasks } = req.body;

    if (!title || !category) {
      throw createError(400, "Title and category are required");
    }

    const goal = await Goal.create({
      title,
      description,
      category,
    });

   
    if (tasks && Array.isArray(tasks)) {
      const taskData = tasks.map((t) => ({
        ...t,
        goalId: goal.id,
      }));

      await Task.bulkCreate(taskData);
    }

    res.status(201).json({
      message: "Goal created successfully",
      goal,
    });
  } catch (err) {
    next(err);
  }
};

export const startUserGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.body;

    const existing = await UserGoal.findOne({
      where: { userId, goalId },
    });

    if (existing) {
      throw createError(409, "Goal already started");
    }

    const userGoal = await UserGoal.create({
      userId,
      goalId,
      status: "in_progress",
    });

    const tasks = await Task.findAll({ where: { goalId } });

    const progressRows = tasks.map((task) => ({
      userGoalId: userGoal.id,
      taskId: task.id,
      isCompleted: false,
    }));

    await UserTaskProgress.bulkCreate(progressRows);

    res.status(201).json({
      message: "Goal started successfully",
      userGoal,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const goals = await UserGoal.findAll({
      where: { userId },
    });

    res.status(200).json(goals);
  } catch (err) {
    next(err);
  }
};

export const getNextTask = async (req, res, next) => {
  try {
    const { userGoalId } = req.params;

    const task = await getNextTaskService(userGoalId);

    res.status(200).json({
      nextTask: task,
    });
  } catch (err) {
    next(err);
  }
};

export const completeTask = async (req, res, next) => {
  try {
    const { userGoalId, taskId } = req.body;

    const result = await completeTaskService(userGoalId, taskId);

    res.status(200).json({
      message: "Task completed",
      result,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllGoals = async (req, res, next) => {
  try {
    const goals = await getAllGoalsService();

    res.status(200).json({
      message: "Goals fetched successfully",
      goals,
    });
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const goal = await getGoalByIdService(id);

    res.status(200).json({
      message: "Goal fetched successfully",
      goal,
    });
  } catch (err) {
    next(err);
  }
};