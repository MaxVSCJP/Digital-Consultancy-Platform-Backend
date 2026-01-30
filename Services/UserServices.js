import User from "../Models/UserModel.js";
import { Op } from "sequelize";
import createError from "../Utils/CreateErrorsUtils.js";
import { saveProfileImage, deleteFileByUrl } from "../Utils/SaveFilesUtils.js";

export const updateProfileService = async (userId, data = {}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  let nextProfileImage = user.profileImage;
  if (data.file) {
    try {
      nextProfileImage = await saveProfileImage(data.file.buffer, data.file.originalname);
      if (user.profileImage) {
        await deleteFileByUrl(user.profileImage);
      }
    } catch (error) {
      throw createError(500, "Could not upload profile image");
    }
  }

  await user.update({
    name: data.name !== undefined ? data.name.trim() : user.name,
    phone: data.phone !== undefined ? data.phone.trim() : user.phone,
    businessName:
      data.businessName !== undefined ? (data.businessName?.trim() || null) : user.businessName,
    businessAddress:
      data.businessAddress !== undefined
        ? (data.businessAddress?.trim() || null)
        : user.businessAddress,
    businessType:
      data.businessType !== undefined ? (data.businessType?.trim() || null) : user.businessType,
    businessArea:
      data.businessArea !== undefined ? (data.businessArea?.trim() || null) : user.businessArea,
    tin: data.tin !== undefined ? (data.tin?.trim() || null) : user.tin,
    profileImage: nextProfileImage,
  });

  const safeUser = user.toJSON();
  delete safeUser.password;
  return safeUser;
};

export const getProfileService = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  const safeUser = user.toJSON();
  delete safeUser.password;
  return safeUser;
};

export const listConsultantsService = async ({ search } = {}) => {
  const where = { role: "consultant" };
  const trimmed = typeof search === "string" ? search.trim() : "";

  if (trimmed) {
    where[Op.or] = [
      { name: { [Op.like]: `%${trimmed}%` } },
      { email: { [Op.like]: `%${trimmed}%` } },
      { businessArea: { [Op.like]: `%${trimmed}%` } },
      { businessType: { [Op.like]: `%${trimmed}%` } },
    ];
  }

  const consultants = await User.findAll({
    where,
    attributes: [
      "id",
      "name",
      "email",
      "profileImage",
      "phone",
      "businessName",
      "businessAddress",
      "businessType",
      "businessArea",
      "tin",
    ],
    order: [["name", "ASC"]],
  });

  return consultants.map((consultant) => consultant.toJSON());
};

export const getConsultantService = async (consultantId) => {
  const consultant = await User.findOne({
    where: { id: consultantId, role: "consultant" },
    attributes: [
      "id",
      "name",
      "email",
      "profileImage",
      "phone",
      "businessName",
      "businessAddress",
      "businessType",
      "businessArea",
      "tin",
    ],
  });

  if (!consultant) {
    throw createError(404, "Consultant not found");
  }

  return consultant.toJSON();
};
