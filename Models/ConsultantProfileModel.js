import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const ConsultantProfile = sequelize.define(
  "ConsultantProfile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    profileStatus: {
      type: DataTypes.ENUM("Available", "Busy", "Away", "On Leave"),
      defaultValue: "Available",
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verifiedBadge: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    paranoid: true,
  }
);

export default ConsultantProfile;
