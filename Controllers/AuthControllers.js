import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { saveProfileImage, saveCVImage } from "../Utils/SaveFilesUtils.js";
import {
  secure,
  frontendOrigin,
  adminRedirect,
  domain,
} from "../Configs/ProDevConfig.js";
import {
  loginService,
  signupService,
  VALID_ROLES,
} from "../Services/AuthServices.js";

const cookieSameSite = secure ? "none" : "lax";
const baseCookieOptions = {
  secure,
  sameSite: cookieSameSite,
  domain,
  path: "/",
};

const redirectRouting = {
  client: `${frontendOrigin}/clientDashboard`,
  consultant: `${frontendOrigin}/consultantDashboard`,
  admin: adminRedirect,
  mediaManager: `${frontendOrigin}/mediaDashboard`,
  superAdmin: adminRedirect,
};

export const googleAuth = (req, res, next) => {
  // Check account status
  if (req.user.accountStatus === "suspended") {
    return next(createError(403, "Your account is suspended. Please contact support."));
  }
  if (req.user.accountStatus === "banned") {
    return next(createError(403, "Your account has been permanently banned."));
  }
  if (req.user.accountStatus === "inactive") {
    return next(createError(403, "Your account is inactive. Please reactivate it to login."));
  }

  const token = jwt.sign(
    { id: req.user.id, firstName: req.user.firstName, lastName: req.user.lastName, role: req.user.role },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, {
    ...baseCookieOptions,
    httpOnly: true,
  });

  res.cookie(
    "userInfo",
    JSON.stringify({
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      profilePicture: req.user.profilePicture,
      role: req.user.role,
    }),
    {
      httpOnly: false,
      ...baseCookieOptions,
    },
  );

  if (req.user.role in redirectRouting) {
    res.redirect(redirectRouting[req.user.role] || frontendOrigin);
  } else {
    return next(createError(400, "Invalid role specified"));
  }
};

export const signup = async (req, res, next) => {
  try {
    const safeUser = await signupService({
      ...req.body,
      file: req.file,
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const { user, token } = await loginService(email, password);
    const userInfoCookie = {
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      role: user.role,
    };

    res.cookie("token", token, {
      httpOnly: true,
      ...baseCookieOptions,
    });

    res.cookie("userInfo", userInfoCookie, {
      httpOnly: false,
      ...baseCookieOptions,
    });

    res.status(200).json({
      status: "success",
      message: "Succesfully logged in",
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", { ...baseCookieOptions, httpOnly: true });
  res.clearCookie("csrfToken", { ...baseCookieOptions, httpOnly: true });
  res.clearCookie("userInfo", { ...baseCookieOptions, httpOnly: true });
  res.status(200).json({ message: "Logged out" });
};
