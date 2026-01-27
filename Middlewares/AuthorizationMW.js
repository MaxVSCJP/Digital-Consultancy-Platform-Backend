import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import createError from "../Utils/CreateErrorsUtils.js";

dotenv.config();

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(createError(401, "You are not logged in!"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(createError(403, "Token is not valid!"));
  }
};

export const attachUserIfAvailable = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Ignore invalid tokens for optional attach to avoid blocking guest flows
  }

  next();
};

const buildForbiddenError = () => createError(403, "You are not authorized!");

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user.role;
    if (role === "admin") {
      return next();
    } else if (!role || !allowedRoles.includes(role)) {
      return next(buildForbiddenError());
    }
    next();
  };
};

export const verifyAdmin = authorizeRoles("admin");
export const verifyConsultant = authorizeRoles("consultant");
export const verifyUser = authorizeRoles("user");
