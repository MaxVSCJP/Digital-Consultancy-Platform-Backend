import { Op } from "sequelize";
import UserGoal from "../Models/UserGoalModel.js";
import Task from "../Models/TaskModel.js";
import UserTaskProgress from "../Models/UserTaskProgressModel.js";
import Goal from "../Models/GoalModel.js";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { sequelize } from "../Configs/DatabaseConfig.js";

const normalizeTargetValue = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const normalizeTargetField = (value) => {
  const trimmed = normalizeTargetValue(value);
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeMapLinks = (links) => {
  if (!Array.isArray(links)) {
    return null;
  }

  const normalized = links
    .filter((link) => link && typeof link === "object")
    .map((link) => ({
      city: typeof link.city === "string" ? link.city.trim() : "",
      subCity: typeof link.subCity === "string" ? link.subCity.trim() : "",
      url: typeof link.url === "string" ? link.url.trim() : "",
    }))
    .filter((link) => link.url && link.subCity);

  return normalized.length ? normalized : null;
};

const buildGoalMatchWhere = (businessArea, businessType) => {
  const area = normalizeTargetValue(businessArea);
  const type = normalizeTargetValue(businessType);
  const conditions = [{ businessArea: null, businessType: null }];

  if (area && type) {
    conditions.push({ businessArea: area, businessType: type });
  }

  if (area) {
    conditions.push({ businessArea: area, businessType: null });
  }

  if (type) {
    conditions.push({ businessArea: null, businessType: type });
  }

  return { [Op.or]: conditions };
};

const goalMatchesUser = (goal, user) => {
  const goalArea = normalizeTargetValue(goal?.businessArea);
  const goalType = normalizeTargetValue(goal?.businessType);
  const userArea = normalizeTargetValue(user?.businessArea);
  const userType = normalizeTargetValue(user?.businessType);

  if (!goalArea && !goalType) {
    return true;
  }

  if (!userArea && !userType) {
    return false;
  }

  if (goalArea && goalType) {
    return goalArea === userArea && goalType === userType;
  }

  if (goalArea) {
    return goalArea === userArea;
  }

  if (goalType) {
    return goalType === userType;
  }

  return false;
};


export const createGoalService = async (
  title,
  description,
  category,
  tasks,
  businessArea,
  businessType
) => {
  const goal = await Goal.create({
    title,
    description,
    category,
    businessArea: normalizeTargetField(businessArea),
    businessType: normalizeTargetField(businessType),
  });

  if (tasks && Array.isArray(tasks)) {
    const taskData = tasks.map((task, index) => {
      const parsedOrder = Number(task.stepOrder);
      const stepOrder = Number.isFinite(parsedOrder) && parsedOrder > 0
        ? parsedOrder
        : index + 1;

      return {
        goalId: goal.id,
        title: task.title,
        description: task.description ?? null,
        stepOrder,
        mapLinks: normalizeMapLinks(task.mapLinks),
      };
    });

    await Task.bulkCreate(taskData);
  }

  return goal;
};

export const assignGoalToUserService = async (userId, goalId, options = {}) => {
  const user = options.userProfile
    ? options.userProfile
    : await User.findByPk(userId, {
        attributes: ["id", "businessArea", "businessType"],
      });

  if (!user) {
    throw createError(404, "User not found");
  }

  const resolvedGoalId = options.goalRecord?.id ?? goalId;
  if (!resolvedGoalId) {
    throw createError(400, "Goal ID is required");
  }

  const goal = options.goalRecord
    ? options.goalRecord
    : await Goal.findByPk(resolvedGoalId);

  if (!goal) {
    throw createError(404, "Goal not found");
  }

  if (!goalMatchesUser(goal, user)) {
    throw createError(403, "Goal does not match your business profile");
  }

  const existing = await UserGoal.findOne({
    where: { userId, goalId: goal.id },
  });

  if (existing) {
    throw createError(409, "Goal already started");
  }

  const userGoal = await UserGoal.create({
    userId,
    goalId: goal.id,
    status: "in_progress",
  });

  const tasks = await Task.findAll({
    where: { goalId: goal.id },
  });

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
        include: [
          {
            model: Task,
          },
        ],
      },
      {
        model: UserTaskProgress,
        include: [
          {
            model: Task,
          },
        ],
      },
    ],
  });

  return userGoals.map((userGoal) => {
    const data = userGoal.toJSON();
    if (Array.isArray(data.Goal?.Tasks)) {
      data.Goal.Tasks = [...data.Goal.Tasks].sort((a, b) => a.stepOrder - b.stepOrder);
    }

    if (Array.isArray(data.UserTaskProgresses)) {
      data.UserTaskProgresses = [...data.UserTaskProgresses].sort(
        (a, b) => (a.Task?.stepOrder ?? 0) - (b.Task?.stepOrder ?? 0),
      );
    }

    if (Array.isArray(data.UserTaskProgress)) {
      data.UserTaskProgress = [...data.UserTaskProgress].sort(
        (a, b) => (a.Task?.stepOrder ?? 0) - (b.Task?.stepOrder ?? 0),
      );
    }

    return data;
  });
};

export const getGoalsForUserService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "businessArea", "businessType"],
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  const goals = await Goal.findAll({
    where: buildGoalMatchWhere(user.businessArea, user.businessType),
    include: [
      {
        model: Task,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return goals;
};

export const getGoalByIdForUserService = async (userId, goalId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "businessArea", "businessType"],
  });

  if (!user) {
    throw createError(404, "User not found");
  }

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

  if (!goalMatchesUser(goal, user)) {
    throw createError(403, "Goal does not match your business profile");
  }

  return goal;
};

export const assignGoalsForUserProfileService = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "businessArea", "businessType"],
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  const goals = await Goal.findAll({
    where: buildGoalMatchWhere(user.businessArea, user.businessType),
    attributes: ["id", "businessArea", "businessType"],
  });

  if (!goals.length) {
    return [];
  }

  const assignments = [];
  for (const goal of goals) {
    try {
      const userGoal = await assignGoalToUserService(userId, goal.id, {
        userProfile: user,
        goalRecord: goal,
      });
      assignments.push(userGoal);
    } catch (error) {
      if (error?.statusCode === 409 || error?.status === 409) {
        continue;
      }
      throw error;
    }
  }

  return assignments;
};




export const completeTaskService = async (userGoalId, taskId) => {
  const taskProgress = await UserTaskProgress.findOne({
    where: { userGoalId, taskId },
    include: ["Task"],
  });

  if (!taskProgress) {
    throw createError(404, "Task not found");
  }

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

export const undoTaskService = async (userGoalId, taskId) => {
  const taskProgress = await UserTaskProgress.findOne({
    where: { userGoalId, taskId },
  });

  if (!taskProgress) {
    throw createError(404, "Task not found");
  }

  taskProgress.isCompleted = false;
  taskProgress.completedAt = null;
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


export const calculateProgressService = async (userGoalId, transaction) => {
  const allTasks = await UserTaskProgress.findAll({
    where: { userGoalId },
    transaction,
  });

  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.isCompleted).length;

  const progress = total === 0 ? 0 : (completed / total) * 100;

  const userGoal = await UserGoal.findByPk(userGoalId, { transaction });

  userGoal.progress = progress;
  userGoal.status = progress === 100 ? "completed" : "in_progress";

  await userGoal.save({ transaction });

  return userGoal;
};

export const updateGoalService = async (goalId, payload) => {
  const goal = await Goal.findByPk(goalId);

  if (!goal) {
    throw createError(404, "Goal not found");
  }

  return sequelize.transaction(async (transaction) => {
    goal.title = payload.title ?? goal.title;
    goal.description = payload.description ?? goal.description;
    goal.category = payload.category ?? goal.category;
    if (payload.businessArea !== undefined) {
      goal.businessArea = normalizeTargetField(payload.businessArea);
    }
    if (payload.businessType !== undefined) {
      goal.businessType = normalizeTargetField(payload.businessType);
    }
    await goal.save({ transaction });

    if (!Array.isArray(payload.tasks)) {
      return Goal.findByPk(goalId, {
        include: [{ model: Task }],
        transaction,
      });
    }

    const existingTasks = await Task.findAll({
      where: { goalId },
      transaction,
    });
    const existingMap = new Map(existingTasks.map((task) => [task.id, task]));

    const tasksToCreate = [];
    const tasksToUpdate = [];
    const incomingIds = new Set();

    payload.tasks.forEach((task, index) => {
      const parsedOrder = Number(task.stepOrder);
      const stepOrder = Number.isFinite(parsedOrder) && parsedOrder > 0
        ? parsedOrder
        : index + 1;
      const parsedId = Number(task.id);

      if (Number.isInteger(parsedId) && existingMap.has(parsedId)) {
        incomingIds.add(parsedId);
        tasksToUpdate.push({
          task: existingMap.get(parsedId),
          data: {
            title: task.title,
            description: task.description ?? null,
            stepOrder,
            mapLinks: normalizeMapLinks(task.mapLinks),
          },
        });
        return;
      }

      tasksToCreate.push({
        goalId,
        title: task.title,
        description: task.description ?? null,
        stepOrder,
        mapLinks: normalizeMapLinks(task.mapLinks),
      });
    });

    const tasksToDelete = existingTasks.filter((task) => !incomingIds.has(task.id));
    const tasksToDeleteIds = tasksToDelete.map((task) => task.id);

    if (tasksToDeleteIds.length) {
      await UserTaskProgress.destroy({
        where: { taskId: tasksToDeleteIds },
        transaction,
      });
      await Task.destroy({
        where: { id: tasksToDeleteIds },
        transaction,
      });
    }

    await Promise.all(
      tasksToUpdate.map(({ task, data }) => task.update(data, { transaction })),
    );

    const createdTasks = tasksToCreate.length
      ? await Task.bulkCreate(tasksToCreate, { transaction })
      : [];

    const userGoals = await UserGoal.findAll({
      where: { goalId },
      transaction,
    });

    if (userGoals.length && createdTasks.length) {
      const progressRows = [];
      userGoals.forEach((userGoal) => {
        createdTasks.forEach((task) => {
          progressRows.push({
            userGoalId: userGoal.id,
            taskId: task.id,
            isCompleted: false,
          });
        });
      });

      await UserTaskProgress.bulkCreate(progressRows, { transaction });
    }

    await Promise.all(
      userGoals.map((userGoal) =>
        calculateProgressService(userGoal.id, transaction),
      ),
    );

    return Goal.findByPk(goalId, {
      include: [{ model: Task }],
      transaction,
    });
  });
};

export const deleteGoalService = async (goalId) => {
  const goal = await Goal.findByPk(goalId);

  if (!goal) {
    throw createError(404, "Goal not found");
  }

  await sequelize.transaction(async (transaction) => {
    const userGoals = await UserGoal.findAll({
      where: { goalId },
      transaction,
    });
    const userGoalIds = userGoals.map((userGoal) => userGoal.id);

    if (userGoalIds.length) {
      await UserTaskProgress.destroy({
        where: { userGoalId: userGoalIds },
        transaction,
      });
      await UserGoal.destroy({
        where: { id: userGoalIds },
        transaction,
      });
    }

    await Task.destroy({ where: { goalId }, transaction });
    await goal.destroy({ transaction });
  });
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