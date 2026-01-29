import express from "express";
import * as ConsultantControllers from "../Controllers/ConsultantControllers.js";
import { verifyToken, authorizeRoles } from "../Middlewares/AuthorizationMW.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB for documents
});

router.use(verifyToken);
router.use(authorizeRoles("consultant", "admin", "superAdmin"));

router.get("/profile/me", ConsultantControllers.getMyConsultantProfile);
router.patch("/profile/me", ConsultantControllers.updateConsultantProfile);
router.patch("/profile/me/status", ConsultantControllers.updateStatus);
router.post("/profile/me/expertise", ConsultantControllers.addExpertise);
router.post("/profile/me/documents", upload.single("document"), ConsultantControllers.uploadDocument);
router.post("/profile/me/submit-verification", ConsultantControllers.submitVerification);

export default router;
