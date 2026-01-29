import express from "express";
import {
  getAllUsersWithPermissions,
  getUserWithPermissions,
  updatePermissions,
  resetPermissions,
  updateUserRole,
} from "../Controllers/AdminControllers.js";
import { verifyToken, authorizeRoles } from "../Middlewares/AuthorizationMW.js";

const router = express.Router();

// All admin routes require authentication and admin/superAdmin role
router.use(verifyToken);
router.use(authorizeRoles("admin", "superAdmin"));

// Get all users with permissions
router.get("/users", getAllUsersWithPermissions);

// Get specific user with permissions
router.get("/users/:userId", getUserWithPermissions);

// Update user permissions
router.patch("/users/:userId/permissions", updatePermissions);

// Reset user permissions to role defaults
router.post("/users/:userId/permissions/reset", resetPermissions);

// Update user role (also resets permissions)
router.patch("/users/:userId/role", updateUserRole);

// --- Profile Management ---
import * as AdminProfileControllers from "../Controllers/AdminProfileControllers.js";

router.get("/profiles", AdminProfileControllers.getAllProfiles);
router.get("/profiles/export", AdminProfileControllers.exportProfiles);
router.post("/consultant/:consultantId/verify", AdminProfileControllers.verifyConsultant);
router.patch("/users/:userId/status", AdminProfileControllers.updateAccountStatus);

export default router;
