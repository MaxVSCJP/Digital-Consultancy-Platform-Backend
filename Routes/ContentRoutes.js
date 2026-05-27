import express from "express";
import multer from "multer";

import {
  createContentHandler,
  getContentHandler,
  getContentByIdHandler,
  updateContentHandler,
  deleteContentHandler,
} from "../Controllers/ContentController.js";

import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";
import validate from "../Middlewares/ValidateMW.js";
import {
  createContentValidator,
  getContentByIdValidator,
  listContentValidator,
  updateContentValidator,
} from "../Validators/ContentValidators.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();


router.get("/", validate(listContentValidator), getContentHandler);
router.get("/:id", validate(getContentByIdValidator), getContentByIdHandler);

// Admin-only 
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  upload.single("file"), 
  validate(createContentValidator),
  createContentHandler
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  upload.single("file"), 
  validate(updateContentValidator),
  updateContentHandler
);

router.delete("/:id", verifyToken, verifyAdmin, deleteContentHandler);

export default router;
