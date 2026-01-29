import { User } from "../Models/Associations.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { logAudit } from "./AuditServices.js";
import bcrypt from "bcrypt";
import { saveImage } from "../Utils/SaveFilesUtils.js";
import { getCache, setCache, invalidateRedisCache } from "../Utils/CacheUtils.js";
import { sendEmailChangeVerification } from "./EmailServices.js";
import crypto from "crypto";

const PROFILE_CACHE_TTL = 300; // 5 minutes in seconds

/**
 * Get user's own profile detail
 * @param {string} userId - ID of the user
 * @returns {object} User profile
 */
export const getMyProfile = async (userId) => {
  const cacheKey = `user:profile:${userId}`;
  
  // Try to get from cache
  const cachedProfile = await getCache(cacheKey);
  if (cachedProfile) return cachedProfile;

  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password", "googleId"] },
    include: ["permissions", "consultantProfile"],
  });

  if (!user) {
    throw createError(404, "Profile not found");
  }

  const profileData = user.toJSON();
  
  // Set in cache
  await setCache(cacheKey, profileData, PROFILE_CACHE_TTL);

  return profileData;
};

/**
 * Update basic profile information
 * @param {string} userId - ID of the user
 * @param {object} updateData - Data to update
 * @param {object} req - Request object for auditing
 * @returns {object} Updated user and meta
 */
export const updateBasicProfile = async (userId, updateData, req) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  const { firstName, lastName, phone, timezone, email, businessName, businessAddress } = updateData;
  let emailChangePending = false;

  const previousData = {
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    timezone: user.timezone,
    email: user.email,
    businessName: user.businessName,
    businessAddress: user.businessAddress,
  };

  // FR-UP-06: Email change requires verification
  if (email && email !== user.email) {
    // Check if new email is taken
    const existing = await User.findOne({ where: { email } });
    if (existing) throw createError(409, "Email already in use");

    const token = crypto.randomBytes(32).toString("hex");
    // Store pending change in Redis for 1 hour
    await setCache(`email_change:${token}`, { userId, newEmail: email }, 3600);
    await sendEmailChangeVerification(user, email, token);
    emailChangePending = true;
  }

  await user.update({
    firstName: firstName !== undefined ? firstName : user.firstName,
    lastName: lastName !== undefined ? lastName : user.lastName,
    phone: phone !== undefined ? phone : user.phone,
    timezone: timezone !== undefined ? timezone : user.timezone,
    businessName: businessName !== undefined ? businessName : user.businessName,
    businessAddress: businessAddress !== undefined ? businessAddress : user.businessAddress,
    lastProfileUpdate: new Date(),
  });

  // Invalidate cache
  await invalidateRedisCache([`user:profile:${userId}`]);

  // Log the change
  await logAudit({
    userId,
    action: "UPDATE_PROFILE_BASIC",
    targetResource: "User",
    changes: { from: previousData, to: { ...updateData, emailChangePending } },
    req,
  });

  return { user, emailChangePending };
};

/**
 * Verify and complete email change (FR-UP-06)
 */
export const confirmEmailChange = async (token) => {
    const data = await getCache(`email_change:${token}`);
    if (!data) throw createError(400, "Invalid or expired verification token");

    const user = await User.findByPk(data.userId);
    if (!user) throw createError(404, "User no longer exists");

    const oldEmail = user.email;
    await user.update({ email: data.newEmail, emailVerified: true });
    
    // Cleanup
    await invalidateRedisCache([`email_change:${token}`, `user:profile:${user.id}`]);

    return { oldEmail, newEmail: data.newEmail };
};

/**
 * Change user password
 * @param {string} userId - ID of the user
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @param {object} req - Request object for auditing
 */
export const changePassword = async (userId, currentPassword, newPassword, req) => {
  const user = await User.findByPk(userId, { attributes: ["id", "password"] });
  if (!user) {
    throw createError(404, "User not found");
  }

  // If user signed up via Google and has no password
  if (!user.password) {
    throw createError(400, "User has no password set (OAuth user). Please set a password via forgot password flow if needed.");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createError(401, "Current password incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 13);
  await user.update({ password: hashed });

  // Invalidate cache
  await invalidateRedisCache([`user:profile:${userId}`]);

  await logAudit({
    userId,
    action: "CHANGE_PASSWORD",
    targetResource: "User",
    req,
  });
};

/**
 * Update profile picture
 * @param {string} userId - ID of the user
 * @param {object} file - Uploaded file buffer and name
 * @param {object} req - Request object for auditing
 * @returns {string} New profile picture URL
 */
export const updateProfilePicture = async (userId, file, req) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  const imageUrl = await saveImage(file.buffer, file.originalname, "ProfileImages");
  
  await user.update({ profilePicture: imageUrl });

  // Invalidate cache
  await invalidateRedisCache([`user:profile:${userId}`]);

  await logAudit({
    userId,
    action: "UPDATE_PROFILE_PICTURE",
    targetResource: "User",
    changes: { imageUrl },
    req,
  });

  return imageUrl;
};
