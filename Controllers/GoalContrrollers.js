import Goal from "../Models/GoalModel.js";
import Task from "../Models/TaskModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import {
  createGoalService,
  assignGoalToUserService,
  getUserGoalsService,
  getGoalsForUserService,
  getGoalByIdForUserService,
  getNextTaskService,
  completeTaskService,
  getAllGoalsService,
  getGoalByIdService,
  updateGoalService,
  deleteGoalService,
} from "../Services/GoalServices.js";


export const createGoal = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      tasks,
      businessArea,
      businessType,
    } = req.body;

    if (!title || !category) {
      throw createError(400, "Title and category are required");
    }

    const trimmedArea = typeof businessArea === "string" ? businessArea.trim() : "";
    const trimmedType = typeof businessType === "string" ? businessType.trim() : "";
    if (!trimmedArea && !trimmedType) {
      throw createError(400, "Business area or type is required");
    }

    const goal = await createGoalService(
      title,
      description,
      category,
      tasks,
      businessArea,
      businessType
    );

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

    const userGoal = await assignGoalToUserService(
      userId,
      goalId
    );

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

    const goals = await getUserGoalsService(userId);

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
    const isAdmin = req.user?.role === "admin";
    const goals = isAdmin
      ? await getAllGoalsService()
      : await getGoalsForUserService(req.user.id);

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
    const isAdmin = req.user?.role === "admin";
    const goal = isAdmin
      ? await getGoalByIdService(id)
      : await getGoalByIdForUserService(req.user.id, id);

    res.status(200).json({
      message: "Goal fetched successfully",
      goal,
    });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const goal = await updateGoalService(id, req.body);

    res.status(200).json({
      message: "Goal updated successfully",
      goal,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const { id } = req.params;

    await deleteGoalService(id);

    res.status(200).json({
      message: "Goal deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};