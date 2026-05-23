import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";
import {
  createAdminUserController,
  getAdminUsersController,
  getAdminBookingsController,
  updateAdminUserRoleController,
  updateAdminUserStatusController,
} from "../Controllers/AdminControllers.js";
import {
  createAdminUserValidator,
  listUsersValidator,
  updateUserStatusValidator,
  updateUserRoleValidator,
} from "../Validators/AdminValidators.js";
import { listBookingsValidator } from "../Validators/BookingValidators.js";

const router = express.Router();

router.get("/users", verifyToken, verifyAdmin, validate(listUsersValidator), getAdminUsersController);
router.get(
  "/bookings",
  verifyToken,
  verifyAdmin,
  validate(listBookingsValidator),
  getAdminBookingsController,
);
router.post(
  "/users",
  verifyToken,
  verifyAdmin,
  validate(createAdminUserValidator),
  createAdminUserController,
);
router.patch(
  "/users/:userId/role",
  verifyToken,
  verifyAdmin,
  validate(updateUserRoleValidator),
  updateAdminUserRoleController,
);
router.patch(
  "/users/:userId/status",
  verifyToken,
  verifyAdmin,
  validate(updateUserStatusValidator),
  updateAdminUserStatusController,
);

export default router;
