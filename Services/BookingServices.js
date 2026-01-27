import Booking from "../Models/BookingModel.js";
import Availability from "../Models/AvailabilityModel.js";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { sequelize } from "../Configs/DatabaseConfig.js";
import { createNotification } from "./NotificationServices.js";
import { createCalendarEvent } from "./GoogleCalendarService.js";

const BOOKING_STATUS = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
  "completed",
];

const includeAssociations = [
  { model: User, as: "user", attributes: ["id", "name", "email"] },
  { model: User, as: "consultant", attributes: ["id", "name", "email"] },
  { model: Availability, as: "availability" },
];

const ensureConsultantRole = (consultant) => {
  if (!consultant || consultant.role !== "consultant") {
    throw createError(400, "Target user is not a consultant");
  }
};

export const createBookingRequest = async ({
  userId,
  consultantId,
  availabilityId,
  notes,
}) => {
  if (userId === consultantId) {
    throw createError(400, "Consultants cannot book themselves");
  }

  const [user, consultant, availability] = await Promise.all([
    User.findByPk(userId),
    User.findByPk(consultantId),
    Availability.findOne({
      where: { id: availabilityId, consultantId },
    }),
  ]);

  if (!user) {
    throw createError(404, "User not found");
  }

  ensureConsultantRole(consultant);

  if (!availability) {
    throw createError(404, "Availability slot not found");
  }

  if (["pending", "booked"].includes(availability.status)) {
    throw createError(409, "Availability slot is not available");
  }

  const booking = await sequelize.transaction(async (transaction) => {
    const createdBooking = await Booking.create(
      {
        userId,
        consultantId,
        availabilityId,
        appointmentDate: availability.slotStart,
        slotStart: availability.slotStart,
        slotEnd: availability.slotEnd,
        timezone: availability.timezone,
        notes: notes || null,
      },
      { transaction },
    );

    await availability.update({ status: "pending" }, { transaction });

    await createNotification(
      {
        recipientId: consultantId,
        bookingId: createdBooking.id,
        type: "booking_request",
        message: `New booking request from ${user.name} for ${availability.slotStart.toISOString()}`,
        metadata: {
          slotStart: availability.slotStart,
          slotEnd: availability.slotEnd,
          timezone: availability.timezone,
        },
      },
      { transaction },
    );

    return createdBooking;
  });

  return Booking.findByPk(booking.id, {
    include: includeAssociations,
  });
};

export const listBookings = async ({ userId, consultantId, status } = {}) => {
  const where = {};
  if (userId) {
    where.userId = userId;
  }
  if (consultantId) {
    where.consultantId = consultantId;
  }
  if (status && BOOKING_STATUS.includes(status)) {
    where.status = status;
  }

  return Booking.findAll({
    where,
    include: includeAssociations,
    order: [["slotStart", "ASC"]],
  });
};

export const updateBookingStatus = async ({ bookingId, status, note }) => {
  const normalizedStatus = status?.toLowerCase();
  if (!BOOKING_STATUS.includes(normalizedStatus)) {
    throw createError(400, "Invalid booking status");
  }

  const updatedBooking = await sequelize.transaction(async (transaction) => {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: includeAssociations,
      transaction,
    });

    if (!booking) {
      throw createError(404, "Booking not found");
    }

    const updates = {
      status: normalizedStatus,
    };

    if (note) {
      updates.notes = note;
    }

    let meetingLink = booking.meetingLink;
    let googleEventId = booking.googleEventId;

    if (normalizedStatus === "accepted" && booking.status !== "accepted") {
      if (!booking.availability) {
        throw createError(400, "Cannot accept booking without availability");
      }

      const event = await createCalendarEvent({
        summary: `Consultation with ${booking.user?.name || "client"}`,
        description: note || booking.notes || "Consultation scheduled via Digital Consultancy Platform",
        start: booking.slotStart ?? booking.availability.slotStart,
        end: booking.slotEnd ?? booking.availability.slotEnd,
        timezone: booking.timezone || booking.availability.timezone || "UTC",
        attendees: [
          booking.user?.email ? { email: booking.user.email } : null,
          booking.consultant?.email ? { email: booking.consultant.email } : null,
        ],
      });

      googleEventId = event.id;
      meetingLink =
        event.hangoutLink ||
        event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")
          ?.uri ||
        meetingLink;

      await booking.availability.update({ status: "booked" }, { transaction });
      updates.googleEventId = googleEventId;
      updates.meetingLink = meetingLink;
    } else if (["declined", "cancelled"].includes(normalizedStatus) && booking.availability) {
      await booking.availability.update({ status: "open" }, { transaction });
    }

    await booking.update(updates, { transaction });

    const notificationMetadata = {
      slotStart: booking.slotStart ?? booking.availability?.slotStart,
      slotEnd: booking.slotEnd ?? booking.availability?.slotEnd,
      status: normalizedStatus,
    };

    await Promise.all([
      createNotification(
        {
          recipientId: booking.userId,
          bookingId: booking.id,
          type: "booking_update",
          message: `Your booking was ${normalizedStatus}`,
          metadata: notificationMetadata,
        },
        { transaction },
      ),
      createNotification(
        {
          recipientId: booking.consultantId,
          bookingId: booking.id,
          type: "booking_update",
          message: `Booking ${normalizedStatus}`,
          metadata: notificationMetadata,
        },
        { transaction },
      ),
    ]);

    return booking;
  });

  return Booking.findByPk(updatedBooking.id, { include: includeAssociations });
};
