import crypto from "crypto";

import createErrors from "../Utils/CreateErrorsUtils.js";
import { secure, domain } from "../Configs/ProDevConfig.js";

export const generateCSRF = (req, res) => {
  let csrfToken = req.cookies.csrfToken;
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(24).toString("hex");
    res.cookie("csrfToken", csrfToken, {
      httpOnly: false,
      secure: secure,
      sameSite: "lax",
      domain: domain,
    });
  }
  res.json({ csrfToken });
};

export const verifyCSRF = (req, res, next) => {
  const tokenFromCookie = req.cookies.csrfToken;
  const tokenFromHeader = req.headers["x-csrf-token"];

  if (
    !tokenFromCookie ||
    !tokenFromHeader ||
    tokenFromCookie !== tokenFromHeader
  ) {
    return next(createErrors(403, "Invalid CSRF token"));
  }

  next();
};
