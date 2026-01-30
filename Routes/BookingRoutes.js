import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  createBooking,
  getBookings,
  getConsultantBookings,
  changeBookingStatus,
  verifyChapaBookingCallbackController,
} from "../Controllers/BookingControllers.js";
import {
  createBookingValidator,
  listBookingsValidator,
  updateBookingStatusValidator,
} from "../Validators/BookingValidators.js";
import { verifyToken } from "../Middlewares/AuthorizationMW.js";
import { verifyConsultant } from "../Middlewares/AuthorizationMW.js";

const router = express.Router();

router.post("/", verifyToken, validate(createBookingValidator), createBooking);
router.get("/", verifyToken, validate(listBookingsValidator), getBookings);
router.get(
  "/consultants/me",
  verifyToken,
  verifyConsultant,
  validate(listBookingsValidator),
  getConsultantBookings,
);
router.patch(
  "/:bookingId/status",
  verifyToken,
  verifyConsultant,
  validate(updateBookingStatusValidator),
  changeBookingStatus,
);

router.get("/verify-payment", verifyChapaBookingCallbackController);

export default router;
