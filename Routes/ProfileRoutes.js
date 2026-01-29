import express from "express";
import * as ProfileControllers from "../Controllers/ProfileControllers.js";
import { verifyToken } from "../Middlewares/AuthorizationMW.js";
import validate from "../Middlewares/ValidateMW.js";
import { updateProfileValidator, changePasswordValidator } from "../Validators/ProfileValidators.js";
import { profileUpdateLimiter } from "../Middlewares/RateLimitMW.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB for profile pics (FR-UP-05)
});

// Publicly accessible confirmation route (still uses token)
router.get("/confirm-email", ProfileControllers.confirmEmailChange);

router.use(verifyToken);

router.get("/me", ProfileControllers.getMyProfile);

router.patch(
  "/me", 
  profileUpdateLimiter, 
  validate(updateProfileValidator), 
  ProfileControllers.updateBasicProfile
);

router.patch(
  "/me/password", 
  profileUpdateLimiter, 
  validate(changePasswordValidator), 
  ProfileControllers.changePassword
);

router.post(
  "/me/picture", 
  profileUpdateLimiter, 
  upload.single("profilePicture"), 
  ProfileControllers.updateProfilePicture
);

export default router;
