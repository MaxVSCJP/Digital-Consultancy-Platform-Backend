import express from "express";
import multer from "multer";

import {
  createContentHandler,
  getContentHandler,
  updateContentHandler,
  deleteContentHandler,
} from "../Controllers/ContentController.js";

import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";
import validate from "../Middlewares/ValidateMW.js";
import {
  createContentValidator,
  listContentValidator,
  updateContentValidator,
} from "../Validators/ContentValidators.js";

// Setup multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Public route: get all content (read-only)
router.get("/", validate(listContentValidator), getContentHandler);

// Admin-only routes
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.single("file"), // Accept single file with field name 'file'
  validate(createContentValidator),
  createContentHandler
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.single("file"), // Accept single file when updating
  validate(updateContentValidator),
  updateContentHandler
);

router.delete("/:id", verifyToken, verifyAdmin, deleteContentHandler);

export default router;
