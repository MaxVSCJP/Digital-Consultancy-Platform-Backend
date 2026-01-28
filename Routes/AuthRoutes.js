import express from "express";
import multer from "multer";

import passport from "../Configs/PassportConfig.js";
import {
  signup,
  login,
  logout,
  googleAuth,
} from "../Controllers/AuthControllers.js";
import validate from "../Middlewares/ValidateMW.js";
import {
  signupValidator,
  loginValidator,
} from "../Validators/AuthValidators.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.get("/google", (req, res, next) => {
  const role = req.query.role;
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    state: role,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  googleAuth,
);
router.post(
  "/signup",
  upload.single("nationalIdFile"),
  validate(signupValidator),
  signup,
);

router.post("/login", upload.single(), validate(loginValidator), login);
router.post("/logout", logout);

export default router;
