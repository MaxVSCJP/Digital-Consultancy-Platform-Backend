import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import { secure, domain } from "../Configs/ProDevConfig.js";
import { buildUserAuthPayload } from "../Services/AuthServices.js";
import {
  getProfileService,
  updateProfileService,
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
    const safeUser = await updateProfileService(req.user.id, {
      name: req.body.name,
      phone: req.body.phone,
      businessName: req.body.businessName,
      businessAddress: req.body.businessAddress,
      businessType: req.body.businessType,
      businessArea: req.body.businessArea,
      tin: req.body.tin,
      file: req.file,
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
