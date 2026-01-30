import {
  listUsersForAdmin,
  updateUserRoleForAdmin,
} from "../Services/AdminUserServices.js";

export const getAdminUsersController = async (req, res, next) => {
  try {
    const { page, limit, role, search } = req.query;
    const result = await listUsersForAdmin({ page, limit, role, search });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserRoleController = async (req, res, next) => {
  try {
    const updated = await updateUserRoleForAdmin(
      req.params.userId,
      req.body.role,
      req.user,
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
