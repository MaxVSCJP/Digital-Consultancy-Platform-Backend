import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { saveCVImage } from "../Utils/SaveFilesUtils.js";

const ADMIN_PANEL_ROLES = new Set(["admin"]);

export const DEFAULT_ROLE = "user";

export const VALID_ROLES = {
  user: "user",
  admin: "admin",
  consultant: "consultant",
};

export const isAdminPanelRole = (role) => ADMIN_PANEL_ROLES.has(role);

export const buildUserAuthPayload = (user) => {
  const profile = user?.profile || {};
  const fullName = profile.full_name?.trim();
  const splitName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const resolvedName = fullName || splitName || user.email;

  return {
    id: user.id,
    email: user.email,
    name: resolvedName,
    avatar: profile.avatar_url || null,
    role: user.role || DEFAULT_ROLE,
  };
};

export const loginService = async (email, password) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw createError(400, "Email is required");
  }

  const user = await User.findOne({
    where: { email: normalizedEmail },
    attributes: ["id", "name", "password", "role", "profileImage"],
  });
  if (!user) throw createError(404, "User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError(400, "Incorrect password");

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
  );

  return { user, token };
};

export const signupService = async (userData) => {
  const {
    userName,
    email,
    password,
    role,
    phoneNumber,
    BusinessName,
    BusinessAddress,
    BusinessType,
    Business: businessArea,
    TIN,
    agreedToTerms,
    file,
  } = userData;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw createError(400, "Email is required");
  }

  if (!userName) {
    throw createError(400, "Full name is required");
  }

  const normalizedRole = typeof role === "string" ? role.toLowerCase() : undefined;
  const sanitizedRole = normalizedRole && VALID_ROLES[normalizedRole]
    ? normalizedRole
    : DEFAULT_ROLE;
  const resolvedRole = sanitizedRole === VALID_ROLES.admin ? DEFAULT_ROLE : sanitizedRole;
  const hasAgreed = agreedToTerms === true || agreedToTerms === "true";

  let identityDocumentUrl = null;
  if (file) {
    try {
      identityDocumentUrl = await saveCVImage(file.buffer, file.originalname);
    } catch (error) {
      throw createError(500, "Could not upload National ID file");
    }
  }

  try {
    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
      attributes: ["id"],
    });
    if (existingUser) {
      throw createError(409, "Email already in use");
    }

    const hashed = password ? await bcrypt.hash(password, 13) : null;

    const newUser = await User.create({
      name: userName.trim(),
      email: normalizedEmail,
      password: hashed,
      role: resolvedRole,
      phone: phoneNumber?.trim(),
      cv: identityDocumentUrl,
      nationalIdDocument: identityDocumentUrl,
      businessName: BusinessName?.trim() || null,
      businessAddress: BusinessAddress?.trim() || null,
      businessType: BusinessType?.trim() || null,
      businessArea: businessArea?.trim() || null,
      tin: TIN?.trim() || null,
      agreedToTerms: hasAgreed,
    });

    const safeUser = newUser.toJSON();
    delete safeUser.password;
    return safeUser;
  } catch (error) {
    console.error("Error during signup:", error);
    if (error.statusCode || error.status) {
      throw error;
    }
    throw createError(500, "Error during signup");
  }
};
