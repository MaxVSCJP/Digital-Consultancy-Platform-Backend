import {
  createBookingRequest,
  listBookings,
  updateBookingStatus,
  verifyBookingPayment,
} from "../Services/BookingServices.js";

export const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingRequest({
      userId: req.user?.id,
      consultantId: req.body.consultantId,
      availabilityId: req.body.availabilityId,
      notes: req.body.notes,
    });
    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      consultantId: req.query.consultantId,
      status: req.query.status,
    };
    const bookings = await listBookings(filters);
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

export const getConsultantBookings = async (req, res, next) => {
  try {
    const bookings = await listBookings({
      consultantId: req.user.id,
      status: req.query.status,
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
};

export const changeBookingStatus = async (req, res, next) => {
  try {
    if (req.user?.role === "user") {
      return res.status(403).json({ message: "You are not authorized to update bookings" });
    }

    const booking = await updateBookingStatus({
      bookingId: req.params.bookingId,
      status: req.body.status,
      note: req.body.note,
      consultantId: req.user?.role === "consultant" ? req.user.id : undefined,
    });
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
};

export const verifyChapaBookingCallbackController = async (req, res) => {
  try {
    const txRef =
      req.query?.tx_ref ||
      req.query?.trx_ref ||
      req.body?.tx_ref ||
      req.body?.trx_ref;

    const status = req.query?.status;

    if (!txRef || status !== "success") {
      return res.status(200).json({ received: true });
    }

    try {
      await verifyBookingPayment(txRef);
    } catch (innerErr) {
      console.error(`Booking payment verification failed for ${txRef}:`, innerErr.message);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Booking webhook controller error:", err);
    return res.status(200).json({ received: true });
  }
};
