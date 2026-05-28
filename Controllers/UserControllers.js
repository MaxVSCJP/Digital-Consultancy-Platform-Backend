import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { secure, domain } from "../Configs/ProDevConfig.js";
import { buildUserAuthPayload } from "../Services/AuthServices.js";
import {
  getProfileService,
  updateProfileService,
  changePasswordService,
  listConsultantsService,
  getConsultantService,
} from "../Services/UserServices.js";

const cookieSameSite = secure ? "none" : "lax";
const baseCookieOptions = {
  secure,
  sameSite: cookieSameSite,
  domain,
  path: "/",
};

export const updateProfile = async (req, res, next) => {
  try {
    const profileImage = req.files?.profileImage?.[0] ?? null;
    const cvFile = req.files?.cv?.[0] ?? null;
    const safeUser = await updateProfileService(req.user.id, {
      name: req.body.name,
      phone: req.body.phone,
      title: req.body.title,
      about: req.body.about,
      businessName: req.body.businessName,
      businessCity: req.body.businessCity,
      businessSubCity: req.body.businessSubCity,
      businessWereda: req.body.businessWereda,
      businessKebele: req.body.businessKebele,
      businessType: req.body.businessType,
      businessArea: req.body.businessArea,
      tin: req.body.tin,
      file: profileImage,
      cvFile,
    });

    const token = jwt.sign(
      { id: safeUser.id, name: safeUser.name, role: safeUser.role },
      process.env.JWT_SECRET,
    );
    const userInfoCookie = buildUserAuthPayload(safeUser);

    res.cookie("token", token, {
      httpOnly: true,
      ...baseCookieOptions,
    });

    res.cookie("userInfo", userInfoCookie, {
      httpOnly: false,
      ...baseCookieOptions,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const safeUser = await getProfileService(req.user.id);
    res.status(200).json({ user: safeUser });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await changePasswordService(req.user.id, {
      oldPassword: req.body.oldPassword,
      newPassword: req.body.newPassword,
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const listConsultants = async (req, res, next) => {
  try {
    const consultants = await listConsultantsService({ search: req.query.search });
    res.status(200).json({ data: consultants });
  } catch (error) {
    next(error);
  }
};

export const getConsultant = async (req, res, next) => {
  try {
    const consultant = await getConsultantService(req.params.consultantId);
    res.status(200).json({ data: consultant });
  } catch (error) {
    next(error);
  }
};
