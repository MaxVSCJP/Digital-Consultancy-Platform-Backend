import * as ConsultantServices from "../Services/ConsultantServices.js";
import { detectFileFormat } from "../Utils/DocumentUtils.js";

/**
 * Get current consultant's profile
 */
export const getMyConsultantProfile = async (req, res, next) => {
  try {
    const profile = await ConsultantServices.getOrCreateConsultantProfile(req.user.id);
    res.json({ status: "success", data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Update consultant profile details
 */
export const updateConsultantProfile = async (req, res, next) => {
  try {
    const updated = await ConsultantServices.updateConsultantProfile(req.user.id, req.body, req);
    res.json({ status: "success", message: "Consultant profile updated", data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Update availability status
 */
export const updateStatus = async (req, res, next) => {
  try {
    await ConsultantServices.updateConsultantStatus(req.user.id, req.body.status);
    res.json({ status: "success", message: "Status updated" });
  } catch (error) {
    next(error);
  }
};

/**
 * Add expertise tags
 */
export const addExpertise = async (req, res, next) => {
  try {
    const { category, tags } = req.body;
    await ConsultantServices.updateExpertise(req.user.id, category, tags);
    res.json({ status: "success", message: "Expertise updated" });
  } catch (error) {
    next(error);
  }
};


/**
 * Upload verification document
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file provided" });
    }

    // Automatically detect format as the documentType
    const documentType = detectFileFormat(req.file.originalname);

    const doc = await ConsultantServices.uploadVerificationDocument(req.user.id, req.file, documentType);
    res.json({ status: "success", message: "Document uploaded successfully", data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit for verification
 */
export const submitVerification = async (req, res, next) => {
  try {
    await ConsultantServices.submitForVerification(req.user.id);
    res.json({ status: "success", message: "Profile submitted for verification" });
  } catch (error) {
    next(error);
  }
};
