import Availability from "../Models/AvailabilityModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { Op } from "sequelize";

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const parseDate = (value, field) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw createError(400, `${field} must be a valid date`);
  }
  return date;
};

export const reopenExpiredAvailabilitySlots = async (
  { consultantId } = {},
  options = {},
) => {
  if (!consultantId) {
    throw createError(400, "consultantId is required to reopen availability slots");
  }

  const expiredSlots = await Availability.findAll({
    where: {
      consultantId,
      status: {
        [Op.in]: ["pending", "booked"],
      },
      slotEnd: {
        [Op.lte]: new Date(),
      },
    },
    ...options,
  });

  const now = new Date();

  await Promise.all(
    expiredSlots.map((slot) => {
      const slotStart = slot.slotStart instanceof Date ? new Date(slot.slotStart) : new Date(slot.slotStart);
      const slotEnd = slot.slotEnd instanceof Date ? new Date(slot.slotEnd) : new Date(slot.slotEnd);

      if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) {
        return slot.update({ status: "open" }, options);
      }

      let nextStart = slotStart;
      let nextEnd = slotEnd;

      while (nextEnd <= now) {
        nextStart = new Date(nextStart.getTime() + WEEK_IN_MS);
        nextEnd = new Date(nextEnd.getTime() + WEEK_IN_MS);
      }

      return slot.update(
        {
          slotStart: nextStart,
          slotEnd: nextEnd,
          status: "open",
        },
        options,
      );
    }),
  );

  return expiredSlots;
};

export const createAvailability = async (
  { consultantId, slotStart, slotEnd, timezone, meta },
  options = {},
) => {
  const start = parseDate(slotStart, "slotStart");
  const end = parseDate(slotEnd, "slotEnd");

  if (end <= start) {
    throw createError(400, "slotEnd must be after slotStart");
  }

  return Availability.create(
    {
      consultantId,
      slotStart: start,
      slotEnd: end,
      timezone: timezone || "UTC",
      meta: meta ?? null,
    },
    options,
  );
};

export const listAvailability = async ({ consultantId, status }, options = {}) => {
  if (!consultantId) {
    throw createError(400, "consultantId is required to retrieve availability");
  }

  await reopenExpiredAvailabilitySlots({ consultantId }, options);

  const where = { consultantId };
  if (status) {
    where.status = status;
  }

  return Availability.findAll({
    where,
    order: [["slotStart", "ASC"]],
    ...options,
  });
};

export const updateAvailability = async (availabilityId, payload, options = {}) => {
  const availability = await Availability.findByPk(availabilityId);
  if (!availability) {
    throw createError(404, "Availability slot not found");
  }

  const updates = {};

  if (payload.slotStart) {
    updates.slotStart = parseDate(payload.slotStart, "slotStart");
  }

  if (payload.slotEnd) {
    updates.slotEnd = parseDate(payload.slotEnd, "slotEnd");
  }

  if (updates.slotStart && updates.slotEnd && updates.slotEnd <= updates.slotStart) {
    throw createError(400, "slotEnd must be after slotStart");
  }

  if (payload.timezone) {
    updates.timezone = payload.timezone;
  }

  if (typeof payload.meta !== "undefined") {
    updates.meta = payload.meta;
  }

  if (payload.status) {
    updates.status = payload.status;
  }

  await availability.update(updates, options);
  return availability;
};
