import {
  createAvailability,
  listAvailability,
  updateAvailability,
} from "../Services/AvailabilityServices.js";

export const addAvailability = async (req, res, next) => {
  try {
    const availability = await createAvailability(req.body);
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
    const availability = await updateAvailability(req.params.availabilityId, req.body);
    res.json({ data: availability });
  } catch (error) {
    next(error);
  }
};
