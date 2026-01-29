import {
  ConsultantProfile,
  Expertise,
  Qualification,
  Availability,
  VerificationDocument,
  ProfileVerification,
  User,
} from "../Models/Associations.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { logAudit } from "./AuditServices.js";
import { saveCVImage } from "../Utils/SaveFilesUtils.js";
import { sendVerificationSubmittedEmail } from "./EmailServices.js";

/**
 * Calculate and update profile completion percentage (FR-CP-06)
 */
const updateCompletionStatus = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{
      model: ConsultantProfile,
      as: "consultantProfile",
      include: ["expertise", "qualifications", "documents"]
    }]
  });

  if (!user || user.role !== 'consultant') return;

  const profile = user.consultantProfile;
  let points = 0;
  const totalPoints = 100;

  // Basic Info (already mostly there if account exists)
  if (user.firstName && user.lastName) points += 10;
  if (user.profilePicture) points += 10;
  if (user.phone) points += 5;

  // Consultant Profile Info
  if (profile) {
    if (profile.bio && profile.bio.length > 50) points += 20;
    if (profile.yearsOfExperience !== null) points += 10;
    if (profile.hourlyRate !== null) points += 10;
    if (profile.expertise && profile.expertise.length > 0) points += 10;
    if (profile.qualifications && profile.qualifications.length > 0) points += 10;
    if (profile.documents && profile.documents.length > 0) points += 15;
  }

  const percentage = Math.min(Math.round((points / totalPoints) * 100), 100);
  await user.update({ profileCompletionPercentage: percentage });
  return percentage;
};

/**
 * Get or create consultant profile
 */
export const getOrCreateConsultantProfile = async (userId) => {
  let [profile, created] = await ConsultantProfile.findOrCreate({
    where: { userId },
    include: ["expertise", "qualifications", "availability", "documents"],
  });

  if (created) {
    await logAudit({
      userId,
      action: "CREATE_CONSULTANT_PROFILE_DRAFT",
      targetResource: "ConsultantProfile",
    });
    await updateCompletionStatus(userId);
  }

  return profile;
};

/**
 * Update consultant profile details
 */
export const updateConsultantProfile = async (userId, updateData, req) => {
  const profile = await getOrCreateConsultantProfile(userId);
  
  const { bio, yearsOfExperience, hourlyRate, consultationFee } = updateData;

  const previousData = {
    bio: profile.bio,
    yearsOfExperience: profile.yearsOfExperience,
    hourlyRate: profile.hourlyRate,
    consultationFee: profile.consultationFee,
  };

  await profile.update({
    bio: bio !== undefined ? bio : profile.bio,
    yearsOfExperience: (yearsOfExperience !== undefined && yearsOfExperience !== "") ? yearsOfExperience : profile.yearsOfExperience,
    hourlyRate: (hourlyRate !== undefined && hourlyRate !== "") ? hourlyRate : profile.hourlyRate,
    consultationFee: (consultationFee !== undefined && consultationFee !== "") ? consultationFee : profile.consultationFee,
  });

  await updateCompletionStatus(userId);

  await logAudit({
    userId,
    action: "UPDATE_CONSULTANT_PROFILE",
    targetResource: "ConsultantProfile",
    changes: { from: previousData, to: updateData },
    req,
  });

  return profile;
};

/**
 * Update consultant profile status (FR-CP-04)
 */
export const updateConsultantStatus = async (userId, status) => {
  const profile = await getOrCreateConsultantProfile(userId);

  await profile.update({ profileStatus: status });
};

/**
 * Update expertise tags (FR-CP-01b)
 */
export const updateExpertise = async (userId, category, tags) => {
  const profile = await getOrCreateConsultantProfile(userId);

  // Remove existing tags for this category?
  // Or just add new one? Usually update implies sync.
  // Requirement FR-CP-01b says manage expertise tags.
  
  // Implementation: clear tags for this category and add new ones
  await Expertise.destroy({ where: { consultantProfileId: profile.id, category } });

  if (Array.isArray(tags)) {
    for (const tag of tags) {
      await Expertise.create({
        consultantProfileId: profile.id,
        category,
        tag
      });
    }
  } else if (tags) {
    await Expertise.create({
      consultantProfileId: profile.id,
      category,
      tag: tags
    });
  }

  await updateCompletionStatus(userId);
};

/**
 * Manage expertise tags (FR-CP-01b)
 */
export const addExpertise = async (userId, expertiseData) => {
  const profile = await getOrCreateConsultantProfile(userId);

  const { category, tag } = expertiseData;
  const entry = await Expertise.create({
    consultantProfileId: profile.id,
    category,
    tag
  });

  await updateCompletionStatus(userId);
  return entry;
};

/**
 * Upload verification document (FR-CP-02, FR-CP-03)
 */
export const uploadVerificationDocument = async (userId, file, documentType) => {
  if (!documentType) {
    throw createError(400, "documentType is required for verification documents");
  }
  const profile = await getOrCreateConsultantProfile(userId);

  // Use the CV save utility for documents (handles PDF/images + FR-CP-03 scanning)
  const fileUrl = await saveCVImage(file.buffer, file.originalname);

  const doc = await VerificationDocument.create({
    consultantProfileId: profile.id,
    documentType,
    fileName: file.originalname,
    fileUrl,
    fileSize: file.size,
    mimeType: file.mimetype,
    virusScanStatus: "clean", // saveCVImage would throw if infected
    virusScanDate: new Date(),
  });

  // FR-CP-01: Update User.cv if file is likely a CV (we can still use extension check or just update if it's the first document)
  if (['pdf', 'docx', 'doc'].includes(documentType)) {
    const user = await User.findByPk(userId);
    await user.update({ cv: fileUrl });
  }

  await updateCompletionStatus(userId);
  return doc;
};

/**
 * Submit profile for admin verification (FR-PV-01, FR-PV-02)
 */
export const submitForVerification = async (userId) => {
  const profile = await ConsultantProfile.findOne({ 
    where: { userId },
    include: ["expertise", "qualifications", "documents"]
  });
  
  if (!profile) throw createError(404, "Profile not found");

  if (!profile.bio || profile.bio.length < 100) {
    throw createError(400, "Bio is too short (min 100 chars required for verification)");
  }
  
  // Requirement: Must have at least one document
  if (!profile.documents || profile.documents.length === 0) {
    throw createError(400, "At least one document is required before submission");
  }

  // FR-PV-01: Start as Pending
  await ProfileVerification.create({
    consultantProfileId: profile.id,
    status: "pending"
  });

  const user = await User.findByPk(userId);
  await user.update({ verificationStatus: "pending" });

  // FR-PV-02: Send notification
  await sendVerificationSubmittedEmail(user);

  await logAudit({
    userId,
    action: "SUBMIT_VERIFICATION",
    targetResource: "ProfileVerification",
  });
};
