import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  addAvailability,
  getAvailability,
  modifyAvailability,
} from "../Controllers/AvailabilityControllers.js";
import {
  createAvailabilityValidator,
  listAvailabilityValidator,
  updateAvailabilityValidator,
} from "../Validators/AvailabilityValidators.js";

const router = express.Router();

router.post("/", validate(createAvailabilityValidator), addAvailability);
router.get(
  "/consultants/:consultantId",
  validate(listAvailabilityValidator),
  getAvailability,
);
router.patch(
  "/:availabilityId",
  validate(updateAvailabilityValidator),
  modifyAvailability,
);

export default router;
