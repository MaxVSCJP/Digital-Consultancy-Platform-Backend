import express from "express";
import multer from "multer";

import validate from "../Middlewares/ValidateMW.js";
import { verifyToken, verifyAdmin } from "../Middlewares/AuthorizationMW.js";
import {
  listAiFiles,
  uploadAiFiles,
  deleteAiFile,
  replaceAiFile,
  previewAiFile,
} from "../Controllers/AiFilesControllers.js";
import {
  uploadAiFilesValidator,
  fileNameParamValidator,
  replaceAiFileValidator,
} from "../Validators/AiFilesValidators.js";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
});

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, listAiFiles);
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  upload.array("files", 10),
  validate(uploadAiFilesValidator),
  uploadAiFiles,
);

router.get(
  "/:fileName/preview",
  verifyToken,
  verifyAdmin,
  validate(fileNameParamValidator),
  previewAiFile,
);

router.delete(
  "/:fileName",
  verifyToken,
  verifyAdmin,
  validate(fileNameParamValidator),
  deleteAiFile,
);

router.put(
  "/:fileName",
  verifyToken,
  verifyAdmin,
  upload.single("file"),
  validate(replaceAiFileValidator),
  replaceAiFile,
);

export default router;
