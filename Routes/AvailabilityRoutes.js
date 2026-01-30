import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  addAvailability,
  addMyAvailability,
  getAvailability,
  getMyAvailability,
  modifyAvailability,
} from "../Controllers/AvailabilityControllers.js";
import {
  createAvailabilityValidator,
  listAvailabilityValidator,
  updateAvailabilityValidator,
} from "../Validators/AvailabilityValidators.js";
import { verifyConsultant, verifyToken } from "../Middlewares/AuthorizationMW.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  verifyConsultant,
  validate(createAvailabilityValidator),
  addAvailability,
);
router.post(
  "/me",
  verifyToken,
  verifyConsultant,
  validate(createAvailabilityValidator),
  addMyAvailability,
);
router.get("/me", verifyToken, verifyConsultant, getMyAvailability);
router.get(
  "/consultants/:consultantId",
  validate(listAvailabilityValidator),
  getAvailability,
);
router.patch(
  "/:availabilityId",
  verifyToken,
  verifyConsultant,
  validate(updateAvailabilityValidator),
  modifyAvailability,
);

export default router;
