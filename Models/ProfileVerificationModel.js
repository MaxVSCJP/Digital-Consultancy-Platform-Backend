import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const ProfileVerification = sequelize.define(
  "ProfileVerification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    consultantProfileId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "additional_docs_required"
      ),
      allowNull: false,
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: false,
  }
);

export default ProfileVerification;
