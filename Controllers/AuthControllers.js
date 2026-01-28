import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import createError from "../Utils/CreateErrorsUtils.js";
import {
  secure,
  frontendOrigin,
  adminRedirect,
  domain,
} from "../Configs/ProDevConfig.js";
import {
  buildUserAuthPayload,
  loginService,
  signupService,
} from "../Services/AuthServices.js";

const cookieSameSite = secure ? "none" : "lax";
const baseCookieOptions = {
  secure,
  sameSite: cookieSameSite,
  domain,
  path: "/",
};

const redirectRouting = {
  user: `${frontendOrigin}/userDashboard`,
  admin: adminRedirect,
  consultant: `${frontendOrigin}/consultantDashboard`,
};

export const googleAuth = (req, res, next) => {
  const token = jwt.sign(
    { id: req.user.id, name: req.user.name, role: req.user.role },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, {
    ...baseCookieOptions,
    httpOnly: true,
  });

  res.cookie(
    "userInfo",
    JSON.stringify({
      name: req.user.name,
      profileImage: req.user.profileImage,
      role: req.user.role,
    }),
    {
      httpOnly: false,
      ...baseCookieOptions,
    },
  );

  if (Object.keys(redirectRouting).includes(req.user.role)) {
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
    const userInfoCookie = buildUserAuthPayload(user);

    res.cookie("token", token, {
      httpOnly: true,
      ...baseCookieOptions,
    });

    res.cookie("userInfo", userInfoCookie, {
      httpOnly: false,
      ...baseCookieOptions,
    });

    res.status(200).json({
      message: "Succesfully logged in",
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
