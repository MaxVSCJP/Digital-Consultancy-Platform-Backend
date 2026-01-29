import * as ProfileServices from "../Services/ProfileServices.js";

/**
 * Get current user's profile
 */
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await ProfileServices.getMyProfile(req.user.id);
    res.json({ status: "success", data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Update basic profile (FR-UP-02, FR-UP-06)
 */
export const updateBasicProfile = async (req, res, next) => {
  try {
    const { user, emailChangePending } = await ProfileServices.updateBasicProfile(req.user.id, req.body, req);
    res.json({ 
        status: "success", 
        message: emailChangePending ? "Basic info updated. Please verify your new email." : "Profile updated successfully", 
        data: user,
        emailChangePending
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm email change (FR-UP-06)
 */
export const confirmEmailChange = async (req, res, next) => {
    try {
        const { token } = req.query;
        const result = await ProfileServices.confirmEmailChange(token);
        res.json({ status: "success", message: "Email updated and verified successfully", data: result });
    } catch (error) {
        next(error);
    }
};

/**
 * Change password (FR-UP-04)
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await ProfileServices.changePassword(req.user.id, currentPassword, newPassword, req);
    res.json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile picture (FR-UP-05)
 */
export const updateProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No image file provided" });
    }
    const imageUrl = await ProfileServices.updateProfilePicture(req.user.id, req.file, req);
    res.json({ status: "success", message: "Profile picture updated", data: { profilePicture: imageUrl } });
  } catch (error) {
    next(error);
  }
};
