import {
  createAvailability,
  listAvailability,
  updateAvailability,
} from "../Services/AvailabilityServices.js";
import Availability from "../Models/AvailabilityModel.js";
import createError from "../Utils/CreateErrorsUtils.js";

export const addAvailability = async (req, res, next) => {
  try {
    const consultantId =
      req.user?.role === "consultant" ? req.user.id : req.body.consultantId;

    const availability = await createAvailability({
      ...req.body,
      consultantId,
    });
    res.status(201).json({ data: availability });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const availability = await listAvailability({
      consultantId: req.params.consultantId,
      status: req.query.status,
    });
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
};

export const modifyAvailability = async (req, res, next) => {
  try {
    const existing = await Availability.findByPk(req.params.availabilityId);
    if (!existing) {
      throw createError(404, "Availability slot not found");
    }

    if (req.user?.role === "consultant" && existing.consultantId !== req.user.id) {
      throw createError(403, "You are not authorized to update this availability slot");
    }

    const availability = await updateAvailability(req.params.availabilityId, req.body);
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
};

export const addMyAvailability = async (req, res, next) => {
  try {
    const availability = await createAvailability({
      ...req.body,
      consultantId: req.user.id,
    });
    res.status(201).json({ data: availability });
  } catch (error) {
    next(error);
  }
};

export const getMyAvailability = async (req, res, next) => {
  try {
    const availability = await listAvailability({
      consultantId: req.user.id,
      status: req.query.status,
    });
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
};
