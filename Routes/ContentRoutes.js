import express from "express";
import multer from "multer";

import {
  createContentHandler,
  getContentHandler,
  updateContentHandler,
  deleteContentHandler,
} from "../Controllers/ContentController.js";

import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* Users (read-only) */
router.get("/", getContentHandler);

/* Admin only */
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("file"),
  createContentHandler
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("file"),
  updateContentHandler
);

router.delete("/:id", verifyToken, verifyAdmin, deleteContentHandler);

export default router;
