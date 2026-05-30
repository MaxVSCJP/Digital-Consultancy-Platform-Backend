import { Op } from "sequelize";
import Review from "../Models/ReviewModel.js";
import Booking from "../Models/BookingModel.js";
import User from "../Models/UserModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { sequelize } from "../Configs/DatabaseConfig.js";

const MAX_PAGE_SIZE = 100;
const REVIEW_MAX_LENGTH = 2000;

const normalizePageParams = ({ page, limit }) => {
  const safePage = Number(page) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) && Number(limit) > 0 ? Number(limit) : 20;
  return {
    page: safePage,
    limit: Math.min(safeLimit, MAX_PAGE_SIZE),
  };
};

const reviewerAttributes = [
  "id",
  "name",
  "businessName",
  "businessType",
  "businessArea",
  "profileImage",
];

const buildReviewerInclude = () => [
  {
    model: User,
    as: "reviewer",
    attributes: reviewerAttributes,
  },
];

const ensureConsultant = async (consultantId) => {
  if (!consultantId) {
    throw createError(400, "consultantId is required");
  }

  const consultant = await User.findByPk(consultantId, {
    attributes: ["id", "role", "name"],
  });

  if (!consultant) {
    throw createError(404, "Consultant not found");
  }

  if (consultant.role !== "consultant") {
    throw createError(400, "Target user is not a consultant");
  }

  return consultant;
};

const validateReviewInput = (rating, reviewText) => {
  const normalizedRating = Number(rating);
  if (!Number.isInteger(normalizedRating) || normalizedRating < 0 || normalizedRating > 5) {
    throw createError(400, "Rating must be an integer between 0 and 5");
  }

  const normalizedReview = typeof reviewText === "string" ? reviewText.trim() : "";
  if (!normalizedReview) {
    throw createError(400, "Review text is required");
  }

  if (normalizedReview.length > REVIEW_MAX_LENGTH) {
    throw createError(400, "Review must be at most 2000 characters");
  }

  return { normalizedRating, normalizedReview };
};

const ensureEligibleBooking = async ({ userId, consultantId }) => {
  if (!userId) {
    throw createError(401, "Authentication required");
  }

  await ensureConsultant(consultantId);

  const now = new Date();
  const booking = await Booking.findOne({
    where: {
      userId,
      consultantId,
      status: {
        [Op.in]: ["accepted", "completed"],
      },
      [Op.or]: [
        { slotEnd: { [Op.lte]: now } },
        {
          slotEnd: { [Op.is]: null },
          appointmentDate: { [Op.lte]: now },
        },
      ],
    },
    order: [["slotEnd", "DESC"], ["appointmentDate", "DESC"]],
  });

  if (!booking) {
    throw createError(403, "You are not eligible to review this consultant");
  }

  return booking;
};

export const createReview = async ({ userId, consultantId, rating, review }) => {
  if (!userId) {
    throw createError(401, "Authentication required");
  }

  const { normalizedRating, normalizedReview } = validateReviewInput(rating, review);

  await ensureEligibleBooking({ userId, consultantId });

  const existingReview = await Review.findOne({
    where: { userId, consultantId },
  });

  if (existingReview) {
    throw createError(409, "You have already reviewed this consultant");
  }

  const created = await Review.create({
    userId,
    consultantId,
    rating: normalizedRating,
    review: normalizedReview,
  });

  return Review.findByPk(created.id, { include: buildReviewerInclude() });
};

export const getReviewById = async (reviewId) => {
  if (!reviewId) {
    throw createError(400, "reviewId is required");
  }

  const review = await Review.findByPk(reviewId, { include: buildReviewerInclude() });
  if (!review) {
    throw createError(404, "Review not found");
  }

  return review;
};

export const listReviewsForConsultant = async ({ consultantId, page, limit } = {}) => {
  if (!consultantId) {
    throw createError(400, "consultantId is required");
  }

  await ensureConsultant(consultantId);

  const normalized = normalizePageParams({ page, limit });

  const where = { consultantId };
  const [total, reviews] = await Promise.all([
    Review.count({ where }),
    Review.findAll({
      where,
      include: buildReviewerInclude(),
      order: [["createdAt", "DESC"]],
      limit: normalized.limit,
      offset: (normalized.page - 1) * normalized.limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / normalized.limit));

  return {
    data: reviews,
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total,
      totalPages,
    },
  };
};

export const listReviewsForUser = async ({ userId, consultantId, page, limit } = {}) => {
  if (!userId) {
    throw createError(401, "Authentication required");
  }

  const normalized = normalizePageParams({ page, limit });
  const where = { userId };
  if (consultantId) {
    where.consultantId = consultantId;
  }

  const [total, reviews] = await Promise.all([
    Review.count({ where }),
    Review.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: normalized.limit,
      offset: (normalized.page - 1) * normalized.limit,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / normalized.limit));

  return {
    data: reviews,
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total,
      totalPages,
    },
  };
};

export const deleteReview = async (reviewId, requester) => {
  if (!reviewId) {
    throw createError(400, "reviewId is required");
  }

  if (!requester?.id) {
    throw createError(401, "Authentication required");
  }

  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw createError(404, "Review not found");
  }

  const isOwner = review.userId === requester.id;
  const isAdmin = requester.role === "admin";

  if (!isOwner && !isAdmin) {
    throw createError(403, "You are not authorized to delete this review");
  }

  await review.destroy();
  return review;
};

export const getConsultantRatingSummary = async (consultantId) => {
  await ensureConsultant(consultantId);

  const [result] = await Review.findAll({
    where: { consultantId },
    attributes: [
      [sequelize.fn("AVG", sequelize.col("rating")), "averageRating"],
      [sequelize.fn("COUNT", sequelize.col("id")), "reviewCount"],
    ],
    raw: true,
  });

  const averageRating = Number(result?.averageRating ?? 0);
  const reviewCount = Number(result?.reviewCount ?? 0);

  return {
    averageRating: Number.isFinite(averageRating) ? averageRating : 0,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : 0,
  };
};
