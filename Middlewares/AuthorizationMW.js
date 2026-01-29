import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

dotenv.config();

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next(createError(401, "You are not logged in!"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Immediate status check from DB
    const user = await User.findByPk(decoded.id, { attributes: ['accountStatus'] });
    
    if (!user) {
      return next(createError(404, "User account no longer exists"));
    }

    if (user.accountStatus === "suspended") {
      return next(createError(403, "Your account is suspended. Access revoked."));
    }
    if (user.accountStatus === "banned") {
      return next(createError(403, "Your account is banned. Access revoked."));
    }
    if (user.accountStatus === "inactive") {
      return next(createError(403, "Your account is inactive. Access revoked."));
    }

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
    const role = req.user?.role;
    if (role === "admin" || role === "superAdmin") {
      return next();
    } else if (!role || !allowedRoles.includes(role)) {
      return next(buildForbiddenError());
    }
    next();
  };
};

export const verifyAdmin = authorizeRoles("admin", "superAdmin");
export const verifyConsultant = authorizeRoles("consultant", "admin", "superAdmin");
export const verifyUser = authorizeRoles("client", "consultant", "admin", "superAdmin");
