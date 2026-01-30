import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";
import {
  getAdminUsersController,
  updateAdminUserRoleController,
} from "../Controllers/AdminControllers.js";
import {
  listUsersValidator,
  updateUserRoleValidator,
} from "../Validators/AdminValidators.js";

const router = express.Router();

router.get("/users", verifyToken, verifyAdmin, validate(listUsersValidator), getAdminUsersController);
router.patch(
  "/users/:userId/role",
  verifyToken,
  verifyAdmin,
  validate(updateUserRoleValidator),
  updateAdminUserRoleController,
);

export default router;
