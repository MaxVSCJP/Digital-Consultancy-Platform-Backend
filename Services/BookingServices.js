import dotenv from "dotenv";
dotenv.config();

import Booking from "../Models/BookingModel.js";
import Availability from "../Models/AvailabilityModel.js";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { sequelize } from "../Configs/DatabaseConfig.js";
import { createNotification } from "./NotificationServices.js";
import { createCalendarEvent, isGoogleCalendarConfigured } from "./GoogleCalendarService.js";
import { frontendOrigin, origin } from "../Configs/ProDevConfig.js";

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

const BOOKING_PRICE = Number(process.env.BOOKING_PRICE || 0);
const BOOKING_CURRENCY = process.env.BOOKING_CURRENCY || "ETB";
const CHAPA_BASE_URL = "https://api.chapa.co/v1";

const getChapaSecret = () => {
  const secret = process.env.CHAPA_API_SECRET_KEY;
  if (!secret) {
    throw createError(500, "Payment provider credentials are not configured");
  }
  return secret;
};

const callChapa = async (path, { method = "GET", body } = {}) => {
  const headers = {
    Authorization: `Bearer ${getChapaSecret()}`,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${CHAPA_BASE_URL}${path}`, {
      method,
      headers,
      body,
    });
  } catch (error) {
    console.error("Chapa request failed:", error);
    throw createError(502, "Unable to reach payment provider");
  }

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.data?.message ||
      `Payment provider responded with status ${response.status}`;
    throw createError(502, message);
  }

  return data;
};

const initializeChapaTransaction = async ({
  userId,
  amount,
  currency,
  email,
  phoneNumber,
  firstName,
  lastName,
}) => {
  const txRef = `tx-Booking-${Date.now()}-${userId.slice(0, 10)}`;
  const callbackUrl =
    process.env.BOOKING_PAYMENT_CALLBACK_URL ||
    `${origin}/bookings/verify-payment`;
  const returnUrl =
    process.env.BOOKING_PAYMENT_RETURN_URL ||
    `${frontendOrigin}/booking-payment/return`;

  const payload = {
    amount,
    currency,
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
  };

  const data = await callChapa("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (data?.status !== "success") {
    throw createError(502, data?.message || "Payment initialization failed");
  }

  const checkoutUrl = data?.data?.checkout_url;
  if (!checkoutUrl) {
    throw createError(502, "Payment provider response missing checkout URL");
  }

  return {
    checkoutUrl,
    txRef,
  };
};

const verifyChapaTransaction = async (transactionId) => {
  if (!transactionId) {
    throw createError(400, "transactionId is required");
  }

  const data = await callChapa(`/transaction/verify/${transactionId}`);

  if (data?.status !== "success") {
    throw createError(400, data?.message || "Payment verification failed");
  }

  return data;
};

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
  if (!userId) {
    throw createError(401, "Authentication required");
  }

  if (!Number.isFinite(BOOKING_PRICE) || BOOKING_PRICE <= 0) {
    throw createError(500, "Booking price is not configured");
  }

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

  const customerEmail = user.email || "no-reply@example.com";
  const { checkoutUrl, txRef } = await initializeChapaTransaction({
    userId,
    amount: BOOKING_PRICE,
    currency: BOOKING_CURRENCY,
    email: customerEmail,
    phoneNumber: user.phone || "",
    firstName: user.name || "",
    lastName: "",
  });

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
        transactionId: txRef,
        metadata: {
          paymentStatus: "pending",
          paymentAmount: BOOKING_PRICE,
          paymentCurrency: BOOKING_CURRENCY,
        },
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

  const fullBooking = await Booking.findByPk(booking.id, {
    include: includeAssociations,
  });

  return {
    booking: fullBooking,
    payment: {
      checkout_url: checkoutUrl,
      tx_ref: txRef,
      amount_charged: BOOKING_PRICE.toString(),
      currency: BOOKING_CURRENCY,
    },
  };
};

export const verifyBookingPayment = async (transactionId) => {
  const verification = await verifyChapaTransaction(transactionId);
  const paymentStatus = verification?.data?.status?.toLowerCase();

  if (paymentStatus !== "success") {
    throw createError(400, "Payment has not been completed");
  }

  const booking = await Booking.findOne({ where: { transactionId } });
  if (!booking) {
    throw createError(404, "Booking not found for this transaction");
  }

  const metadata = booking.metadata || {};
  if (metadata.paymentStatus === "paid") {
    return booking;
  }

  await booking.update({
    metadata: {
      ...metadata,
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
    },
  });

  return booking;
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

export const updateBookingStatus = async ({ bookingId, status, note, consultantId }) => {
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

    if (consultantId && booking.consultantId !== consultantId) {
      throw createError(403, "You are not authorized to update this booking");
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

      if (isGoogleCalendarConfigured()) {
        try {
          const event = await createCalendarEvent({
            summary: `Consultation with ${booking.user?.name || "client"}`,
            description:
              note || booking.notes || "Consultation scheduled via Digital Consultancy Platform",
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
        } catch (error) {
          console.error("Google Calendar event creation failed:", error?.message || error);
        }
      }

      await booking.availability.update({ status: "booked" }, { transaction });
      if (googleEventId) {
        updates.googleEventId = googleEventId;
      }
      if (meetingLink) {
        updates.meetingLink = meetingLink;
      }
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
