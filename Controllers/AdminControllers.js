import {
  listUsersForAdmin,
  createUserForAdmin,
  updateUserRoleForAdmin,
  updateUserStatusForAdmin,
} from "../Services/AdminUserServices.js";
import { listBookings } from "../Services/BookingServices.js";

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

export const createAdminUserController = async (req, res, next) => {
  try {
    const created = await createUserForAdmin({
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserStatusController = async (req, res, next) => {
  try {
    const updated = await updateUserStatusForAdmin(
      req.params.userId,
      req.body.status,
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getAdminBookingsController = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      consultantId: req.query.consultantId,
      status: req.query.status,
    };
    const bookings = await listBookings(filters);
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};
