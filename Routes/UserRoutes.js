import express from "express";
import multer from "multer";

import {
  getProfile,
  updateProfile,
  listConsultants,
  getConsultant,
} from "../Controllers/UserControllers.js";
import validate from "../Middlewares/ValidateMW.js";
import {
  updateProfileValidator,
  listConsultantsValidator,
  getConsultantValidator,
} from "../Validators/UserValidators.js";
import { authorizeRoles, verifyToken } from "../Middlewares/AuthorizationMW.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.patch(
  "/profile",
  verifyToken,
  authorizeRoles("user", "consultant"),
  upload.single("profileImage"),
  validate(updateProfileValidator),
  updateProfile,
);

router.get(
  "/profile",
  verifyToken,
  authorizeRoles("user", "consultant"),
  getProfile,
);

router.get("/consultants", validate(listConsultantsValidator), listConsultants);
router.get(
  "/consultants/:consultantId",
  validate(getConsultantValidator),
  getConsultant,
);

export default router;
