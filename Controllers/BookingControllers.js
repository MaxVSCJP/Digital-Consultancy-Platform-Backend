import {
  createBookingRequest,
  listBookings,
  updateBookingStatus,
} from "../Services/BookingServices.js";

export const createBooking = async (req, res, next) => {
  try {
    const booking = await createBookingRequest(req.body);
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

export const changeBookingStatus = async (req, res, next) => {
  try {
    const booking = await updateBookingStatus({
      bookingId: req.params.bookingId,
      status: req.body.status,
      note: req.body.note,
    });
    res.json({ data: booking });
  } catch (error) {
    next(error);
  }
};
