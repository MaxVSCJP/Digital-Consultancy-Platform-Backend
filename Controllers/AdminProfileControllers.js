import { User, ConsultantProfile, VerificationDocument, ProfileVerification } from "../Models/Associations.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { logAudit } from "../Services/AuditServices.js";
import { 
  sendProfileApprovedEmail, 
  sendProfileRejectedEmail 
} from "../Services/EmailServices.js";
import { Op } from "sequelize";

/**
 * Get all profiles with filtering and pagination (FR-AP-01, FR-AP-02)
 */
export const getAllProfiles = async (req, res, next) => {
  try {
    const { role, status, completion, startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (status) where.accountStatus = status;
    
    // FR-AP-02: Advanced filters
    if (completion) {
        where.profileCompletionPercentage = { [Op.gte]: parseInt(completion) };
    }
    if (startDate && endDate) {
        where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const users = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { exclude: ["password"] },
      include: ["permissions", { 
        model: ConsultantProfile, 
        as: "consultantProfile",
        include: ["documents"] 
      }],
      order: [["createdAt", "DESC"]],
    });

    res.json({
      status: "success",
      data: {
        totalItems: users.count,
        items: users.rows,
        totalPages: Math.ceil(users.count / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or reject consultant verification (FR-AP-04, FR-PV-02)
 */
export const verifyConsultant = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { status, rejectionReason, adminNotes } = req.body;

    const profile = await ConsultantProfile.findByPk(consultantId);
    if (!profile) throw createError(404, "Consultant profile not found");

    const user = await User.findByPk(profile.userId);
    if (!user) throw createError(404, "User not found");

    // Update verification record
    await ProfileVerification.create({
      consultantProfileId: consultantId,
      status,
      rejectionReason,
      adminNotes,
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
    });

    // Update status on profile and user
    if (status === "approved") {
      await profile.update({ verifiedBadge: true });
      await user.update({ verificationStatus: "verified" });
      // FR-PV-02: Send notification
      await sendProfileApprovedEmail(user);
    } else if (status === "rejected") {
      await user.update({ 
        verificationStatus: "rejected",
        rejectionCount: (user.rejectionCount || 0) + 1
      });
      
      // FR-PV-02: Send notification
      await sendProfileRejectedEmail(user, rejectionReason);
      
      // FR-PV-04: 3-strike system
      if ((user.rejectionCount || 0) + 1 >= 3) {
        await user.update({ accountStatus: "suspended" });
        await logAudit({
            userId: req.user.id,
            action: `AUTO_SUSPENSION_3_STRIKES`,
            targetUserId: user.id,
            req,
          });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: `VERIFY_CONSULTANT_${status.toUpperCase()}`,
      targetUserId: user.id,
      changes: { status, rejectionReason },
      req,
    });

    res.json({ status: "success", message: `Consultant ${status} successfully` });
  } catch (error) {
    next(error);
  }
};

/**
 * FR-AP-06: Export profile data to CSV
 */
export const exportProfiles = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ["id", "firstName", "lastName", "email", "role", "accountStatus", "verificationStatus", "createdAt"],
            order: [["createdAt", "DESC"]],
        });

        const header = "ID,First Name,Last Name,Email,Role,Status,Verification,Joined At\n";
        const rows = users.map(u => {
            return `${u.id},"${u.firstName || ""}","${u.lastName || ""}",${u.email},${u.role},${u.accountStatus},${u.verificationStatus},${u.createdAt.toISOString()}`;
        }).join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=profiles_export.csv");
        return res.status(200).send(header + rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Suspend or activate user account (FR-AP-05)
 */
export const updateAccountStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const user = await User.findByPk(userId);
    if (!user) throw createError(404, "User not found");

    const previousStatus = user.accountStatus;
    await user.update({ accountStatus: status });

    await logAudit({
      userId: req.user.id,
      action: `UPDATE_ACCOUNT_STATUS_${status.toUpperCase()}`,
      targetUserId: userId,
      changes: { from: previousStatus, to: status, reason },
      req,
    });

    res.json({ status: "success", message: `Account status updated to ${status}` });
  } catch (error) {
    next(error);
  }
};
