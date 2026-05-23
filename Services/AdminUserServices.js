import { Op } from "sequelize";
import bcrypt from "bcrypt";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

const MAX_PAGE_SIZE = 100;
const VALID_ROLES = new Set(["user", "consultant", "admin"]);
const VALID_STATUSES = new Set(["active", "inactive"]);

const normalizePageParams = ({ page, limit }) => {
  const safePage = Number(page) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) && Number(limit) > 0 ? Number(limit) : 20;
  return {
    page: safePage,
    limit: Math.min(safeLimit, MAX_PAGE_SIZE),
  };
};

const validateRole = (role) => {
  if (!VALID_ROLES.has(role)) {
    throw createError(400, "Invalid role");
  }
};

const validateStatus = (status) => {
  if (!VALID_STATUSES.has(status)) {
    throw createError(400, "Invalid status");
  }
};

export const listUsersForAdmin = async (filters = {}) => {
  const { page, limit } = normalizePageParams(filters);
  const where = {};

  if (filters.role) {
    validateRole(filters.role);
    where.role = filters.role;
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    where[Op.or] = [
      { email: { [Op.like]: term } },
      { name: { [Op.like]: term } },
      { phone: { [Op.like]: term } },
    ];
  }

  const [total, users] = await Promise.all([
    User.count({ where }),
    User.findAll({
      where,
      order: [["createdAt", "desc"]],
      limit,
      offset: (page - 1) * limit,
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "status",
        "phone",
        "createdAt",
        "updatedAt",
      ],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const updateUserRoleForAdmin = async (userId, role, requester) => {
  if (!userId) {
    throw createError(400, "userId is required");
  }

  validateRole(role);

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "role", "name", "phone", "createdAt", "updatedAt"],
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  if (requester?.id && requester.id === userId) {
    throw createError(400, "Cannot change your own role");
  }

  await user.update({ role });

  return user;
};

export const updateUserStatusForAdmin = async (userId, status) => {
  if (!userId) {
    throw createError(400, "userId is required");
  }

  validateStatus(status);

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "role", "status", "name", "phone", "createdAt", "updatedAt"],
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  await user.update({ status });

  return user;
};

export const createUserForAdmin = async ({ email, password, role }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw createError(400, "Email is required");
  }

  if (!password) {
    throw createError(400, "Password is required");
  }

  validateRole(role);

  const existingUser = await User.findOne({
    where: { email: normalizedEmail },
    attributes: ["id"],
  });

  if (existingUser) {
    throw createError(409, "Email already in use");
  }

  const hashed = await bcrypt.hash(password, 13);
  const nameFromEmail = normalizedEmail.split("@")[0] || "New User";

  const newUser = await User.create({
    name: nameFromEmail,
    email: normalizedEmail,
    password: hashed,
    role,
    status: "active",
    phone: "",
  });

  const safeUser = newUser.toJSON();
  delete safeUser.password;
  return safeUser;
};
