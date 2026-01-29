import User from "./UserModel.js";
import Permission from "./PermissionModel.js";
import ConsultantProfile from "./ConsultantProfileModel.js";
import Expertise from "./ExpertiseModel.js";
import Qualification from "./QualificationModel.js";
import Availability from "./AvailabilityModel.js";
import VerificationDocument from "./VerificationDocumentModel.js";
import ProfileVerification from "./ProfileVerificationModel.js";
import Review from "./ReviewModel.js";

// --- User & Permission ---
User.hasOne(Permission, {
  foreignKey: "userId",
  as: "permissions",
  onDelete: "CASCADE",
});
Permission.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// --- User & ConsultantProfile ---
User.hasOne(ConsultantProfile, {
  foreignKey: "userId",
  as: "consultantProfile",
  onDelete: "CASCADE",
});
ConsultantProfile.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// --- ConsultantProfile & Related Tables ---
ConsultantProfile.hasMany(Expertise, {
  foreignKey: "consultantProfileId",
  as: "expertise",
  onDelete: "CASCADE",
});
Expertise.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

ConsultantProfile.hasMany(Qualification, {
  foreignKey: "consultantProfileId",
  as: "qualifications",
  onDelete: "CASCADE",
});
Qualification.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

ConsultantProfile.hasMany(Availability, {
  foreignKey: "consultantProfileId",
  as: "availability",
  onDelete: "CASCADE",
});
Availability.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

ConsultantProfile.hasMany(VerificationDocument, {
  foreignKey: "consultantProfileId",
  as: "documents",
  onDelete: "CASCADE",
});
VerificationDocument.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

ConsultantProfile.hasMany(ProfileVerification, {
  foreignKey: "consultantProfileId",
  as: "verificationHistory",
  onDelete: "CASCADE",
});
ProfileVerification.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

ConsultantProfile.hasMany(Review, {
  foreignKey: "consultantProfileId",
  as: "reviews",
  onDelete: "CASCADE",
});
Review.belongsTo(ConsultantProfile, {
  foreignKey: "consultantProfileId",
  as: "profile",
});

// --- Review & User (Reviewer) ---
User.hasMany(Review, {
  foreignKey: "userId",
  as: "submittedReviews",
});
Review.belongsTo(User, {
  foreignKey: "userId",
  as: "reviewer",
});

export {
  User,
  Permission,
  ConsultantProfile,
  Expertise,
  Qualification,
  Availability,
  VerificationDocument,
  ProfileVerification,
  Review,
};
