import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import {
  createBooking,
  getBookings,
  changeBookingStatus,
} from "../Controllers/BookingControllers.js";
import {
  createBookingValidator,
  listBookingsValidator,
  updateBookingStatusValidator,
} from "../Validators/BookingValidators.js";

const router = express.Router();

router.post("/", validate(createBookingValidator), createBooking);
router.get("/", validate(listBookingsValidator), getBookings);
router.patch(
  "/:bookingId/status",
  validate(updateBookingStatusValidator),
  changeBookingStatus,
);

export default router;
