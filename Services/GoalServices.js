import UserGoal from "../Models/UserGoalModel.js";
import Task from "../Models/TaskModel.js";
import UserTaskProgress from "../Models/UserTaskProgressModel.js";
import Goal from "../Models/GoalModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

export const assignGoalToUserService = async (userId, goalId) => {
  const goal = await Goal.findByPk(goalId);
  if (!goal) throw createError(404, "Goal not found");

  const existing = await UserGoal.findOne({
    where: { userId, goalId },
  });

  if (existing) {
    throw createError(409, "Goal already assigned to user");
  }

  const userGoal = await UserGoal.create({
    userId,
    goalId,
    status: "not_started",
    progress: 0,
  });

  const tasks = await Task.findAll({ where: { goalId } });

  const progressRows = tasks.map((task) => ({
    userGoalId: userGoal.id,
    taskId: task.id,
    isCompleted: false,
  }));

  await UserTaskProgress.bulkCreate(progressRows);

  return userGoal;
};

export const getUserGoalsService = async (userId) => {
  const userGoals = await UserGoal.findAll({
    where: { userId },
    include: [
      {
        model: Goal,
      },
    ],
  });

  return userGoals;
};

export const startGoalService = async (userGoalId) => {
  const userGoal = await UserGoal.findByPk(userGoalId);

  if (!userGoal) {
    throw createError(404, "User goal not found");
  }

  userGoal.status = "in_progress";
  await userGoal.save();

  return userGoal;
};


export const completeTaskService = async (userGoalId, taskId) => {
  const taskProgress = await UserTaskProgress.findOne({
    where: { userGoalId, taskId },
    include: ["Task"],
  });

  if (!taskProgress) {
    throw createError(404, "Task not found");
  }

  // optional rule: prevent skipping steps
  const nextTask = await getNextTaskService(userGoalId);

  if (nextTask && nextTask.id !== taskId) {
    throw createError(400, "Complete previous task first");
  }

  taskProgress.isCompleted = true;
  taskProgress.completedAt = new Date();
  await taskProgress.save();

  await calculateProgressService(userGoalId);

  return taskProgress;
};



export const getNextTaskService = async (userGoalId) => {
  const tasks = await UserTaskProgress.findAll({
    where: { userGoalId },
    include: [Task],
    order: [[Task, "stepOrder", "ASC"]],
  });

  const nextTask = tasks.find(t => t.isCompleted === false);

  return nextTask ? nextTask.Task : null;
};


export const calculateProgressService = async (userGoalId) => {
  const allTasks = await UserTaskProgress.findAll({
    where: { userGoalId },
  });

  const total = allTasks.length;
  const completed = allTasks.filter(t => t.isCompleted).length;

  const progress = total === 0 ? 0 : (completed / total) * 100;

  const userGoal = await UserGoal.findByPk(userGoalId);

  userGoal.progress = progress;

  if (progress === 100) {
    userGoal.status = "completed";
  }

  await userGoal.save();

  return userGoal;
};

export const getAllGoalsService = async () => {
  const goals = await Goal.findAll({
    include: [
      {
        model: Task,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return goals;
};

export const getGoalByIdService = async (goalId) => {
  const goal = await Goal.findByPk(goalId, {
    include: [
      {
        model: Task,
      },
    ],
  });

  if (!goal) {
    throw createError(404, "Goal not found");
  }

  return goal;
};