import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import User from "../Models/UserModel.js";
import Permission from "../Models/PermissionModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { getDefaultPermissions } from "../Configs/PermissionsConfig.js";
import { saveCVImage } from "../Utils/SaveFilesUtils.js";

export const DEFAULT_ROLE = "client";

export const VALID_ROLES = {
  client: "client",
  consultant: "consultant",
  admin: "admin",
  mediaManager: "mediaManager",
  superAdmin: "superAdmin",
};

// Roles that have access to admin panel
export const ADMIN_PANEL_ROLES = new Set(["admin", "superAdmin", "mediaManager"]);

export const isAdminPanelRole = (role) => ADMIN_PANEL_ROLES.has(role);

/**
 * Build user authentication payload
 * @param {object} user - User object from database
 * @returns {object} User payload for JWT and response
 */
export const buildUserAuthPayload = (user) => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    profilePicture: user.profilePicture || null,
    role: user.role || DEFAULT_ROLE,
    accountStatus: user.accountStatus || "active",
  };
};

/**
 * Login service - authenticate user and generate JWT
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User and token
 */
export const loginService = async (email, password) => {
  const user = await User.findOne({
    where: { email: email },
    attributes: ["id", "firstName", "lastName", "password", "role", "profilePicture", "accountStatus"],
  });
  
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  console.log(`[DEBUG] FULL USER OBJECT DATA:`, JSON.stringify(user.toJSON(), null, 2));
  console.log(`[DEBUG] Login attempt: ${email}, Status: "${user.accountStatus}"`);

  // Check account status
  if (user.accountStatus === "suspended") {
    console.log(`[DEBUG] Blocking suspended user: ${email}`);
    throw createError(403, "Your account is suspended. Please contact support.");
  }
  if (user.accountStatus === "banned") {
    console.log(`[DEBUG] Blocking banned user: ${email}`);
    throw createError(403, "Your account has been permanently banned.");
  }
  if (user.accountStatus === "inactive") {
    console.log(`[DEBUG] Blocking inactive user: ${email}`);
    throw createError(403, "Your account is inactive. Please reactivate it to login.");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw createError(400, "Incorrect password");
  }

  const token = jwt.sign(
    { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { user, token };
};

/**
 * Signup service - create new user with default permissions
 * @param {object} userData - User registration data
 * @returns {object} Safe user object (without password)
 */
export const signupService = async (userData) => {
  const { firstName, lastName, email, password, role, phone, file } = userData;

  let cv = null;

  // Handle CV file upload
  if (file) {
    try {
      cv = await saveCVImage(file.buffer, file.originalname);
    } catch (error) {
      console.error("CV upload error:", error);
      throw createError(500, "Could not upload CV file");
    }
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email },
      attributes: ["id"],
    });
    
    if (existingUser) {
      throw createError(409, "Email already in use");
    }

    // Hash password
    const hashed = password ? await bcrypt.hash(password, 13) : null;

    // Prevent admin/superAdmin signup via regular signup
    const userRole = (role === VALID_ROLES.admin || role === VALID_ROLES.superAdmin) 
      ? VALID_ROLES.client 
      : role;

    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: userRole,
      phone,
      cv,
    });

    // Create default permissions for the user's role
    const defaultPermissions = getDefaultPermissions(userRole);
    await Permission.create({
      userId: newUser.id,
      ...defaultPermissions,
    });

    // Return safe user object (exclude password)
    const { password: _, ...safeUser } = newUser.toJSON();
    return safeUser;
  } catch (error) {
    // If it's already a custom error, rethrow it
    if (error.status) {
      throw error;
    }
    console.error("Error during signup:", error);
    throw createError(500, "Error during signup");
  }
};
