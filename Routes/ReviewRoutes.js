import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import { verifyToken } from "../Middlewares/AuthorizationMW.js";
import {
  createReview,
  deleteReview,
  getConsultantReviewSummary,
  getMyReviews,
  getReviewById,
  getReviewsForConsultant,
} from "../Controllers/ReviewControllers.js";
import {
  consultantIdParamValidator,
  createReviewValidator,
  listMyReviewsValidator,
  listReviewsValidator,
  reviewIdParamValidator,
} from "../Validators/ReviewValidators.js";

const router = express.Router();

router.post("/", verifyToken, validate(createReviewValidator), createReview);
router.get("/me", verifyToken, validate(listMyReviewsValidator), getMyReviews);
router.get(
  "/consultants/:consultantId/summary",
  validate(consultantIdParamValidator),
  getConsultantReviewSummary,
);
router.get("/", validate(listReviewsValidator), getReviewsForConsultant);
router.get("/:reviewId", validate(reviewIdParamValidator), getReviewById);
router.delete("/:reviewId", verifyToken, validate(reviewIdParamValidator), deleteReview);

export default router;
