import { Op } from "sequelize";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

const MAX_PAGE_SIZE = 100;
const VALID_ROLES = new Set(["user", "consultant", "admin"]);

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
      attributes: ["id", "name", "email", "role", "phone", "createdAt", "updatedAt"],
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
