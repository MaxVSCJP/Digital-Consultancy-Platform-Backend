import Availability from "../Models/AvailabilityModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

const parseDate = (value, field) => {
  const date = value instanceof Date ? value : new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw createError(400, `${field} must be a valid date`);
  }
  return date;
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
