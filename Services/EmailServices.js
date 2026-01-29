import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Standard SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a generic email
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"SiraBizu Platform" <${process.env.SMTP_FROM || "no-reply@sirabizu.com"}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Email send error:", error);
    // We don't throw here to avoid breaking the main flow, 
    // but in production, you might want to retry.
  }
};

/**
 * Send Verification Email for Consultant Signup
 */
export const sendVerificationSubmittedEmail = async (user) => {
  const subject = "Your Consultant Profile has been Submitted for Verification";
  const html = `
    <h1>Hello ${user.firstName},</h1>
    <p>Thank you for submitting your consultant profile on SiraBizu. Our team is currently reviewing your documents and bio.</p>
    <p>You will receive an update once the review is complete.</p>
    <br/>
    <p>Best Regards,<br/>SiraBizu Management Team</p>
  `;
  return sendEmail(user.email, subject, html);
};

/**
 * Send Profile Approved Email
 */
export const sendProfileApprovedEmail = async (user) => {
  const subject = "Congratulations! Your Profile has been Verified";
  const html = `
    <h1>Welcome, Verified Expert!</h1>
    <p>Hello ${user.firstName}, your consultant profile on SiraBizu has been approved. You now have a <b>Verified Badge</b> and can start accepting projects.</p>
    <p>Happy Consulting!</p>
  `;
  return sendEmail(user.email, subject, html);
};

/**
 * Send Profile Rejected Email
 */
export const sendProfileRejectedEmail = async (user, reason) => {
  const subject = "Update regarding your SiraBizu Verification";
  const html = `
    <h1>Verification Update</h1>
    <p>Hello ${user.firstName}, unfortunately, your profile could not be verified at this time.</p>
    <p><b>Reason:</b> ${reason}</p>
    <p>Please update your profile information and re-submit for verification.</p>
  `;
  return sendEmail(user.email, subject, html);
};

/**
 * Send Email Change Confirmation
 */
export const sendEmailChangeVerification = async (user, newEmail, token) => {
    const verificationUrl = `${process.env.DEVELOPMENT_FRONTEND_URL}/verify-email?token=${token}`;
    const subject = "Confirm your new email address";
    const html = `
        <h1>Email Change Requested</h1>
        <p>You requested to change your email to ${newEmail}. Please click the link below to verify this change:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>If you did not request this, please secure your account immediately.</p>
    `;
    return sendEmail(newEmail, subject, html);
};
