import {
  createReview as createReviewService,
  deleteReview as deleteReviewService,
  getConsultantRatingSummary,
  getReviewById as getReviewByIdService,
  listReviewsForConsultant,
  listReviewsForUser,
} from "../Services/ReviewServices.js";

export const createReview = async (req, res, next) => {
  try {
    const review = await createReviewService({
      userId: req.user?.id,
      consultantId: req.body.consultantId,
      rating: req.body.rating,
      review: req.body.review,
    });
    res.status(201).json({ data: review });
  } catch (error) {
    next(error);
  }
};

export const getReviewById = async (req, res, next) => {
  try {
    const review = await getReviewByIdService(req.params.reviewId);
    res.json({ data: review });
  } catch (error) {
    next(error);
  }
};

export const getReviewsForConsultant = async (req, res, next) => {
  try {
    const result = await listReviewsForConsultant({
      consultantId: req.query.consultantId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMyReviews = async (req, res, next) => {
  try {
    const result = await listReviewsForUser({
      userId: req.user?.id,
      consultantId: req.query.consultantId,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const review = await deleteReviewService(req.params.reviewId, req.user);
    res.json({ data: review });
  } catch (error) {
    next(error);
  }
};

export const getConsultantReviewSummary = async (req, res, next) => {
  try {
    const summary = await getConsultantRatingSummary(req.params.consultantId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
