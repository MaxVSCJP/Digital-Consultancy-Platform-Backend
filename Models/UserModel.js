import { DataTypes } from "sequelize";
import { sequelize } from "../Configs/DatabaseConfig.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("client", "consultant", "admin", "mediaManager", "superAdmin"),
      defaultValue: "client",
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: "UTC",
    },
    accountStatus: {
      type: DataTypes.ENUM("active", "suspended", "pending", "inactive", "banned"),
      defaultValue: "active",
    },
    profileCompletionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verificationStatus: {
      type: DataTypes.ENUM("unverified", "pending", "verified", "rejected"),
      defaultValue: "unverified",
    },
    rejectionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastProfileUpdate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    cv: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    service: {
      type: DataTypes.ENUM(
        "PHOTOGRAPHY & VIDEOGRAPHY",
        "EVENT ORGANIZING & CONFERENCE MANAGEMENT",
        "PODCAST MANAGEMENT",
        "SOCIAL MEDIA MANAGEMENT",
        "DIGITAL MARKETING",
        "MARKET ANALYSIS & BUSINESS INTELLIGENCE",
        "BOOSTING (BOASTING) SERVICES",
        "WEBSITE DEVELOPMENT",
        "CONSULTANCY SERVICES",
        "TRAINING & CAPACITY BUILDING",
        "HUMAN RESOURCE (HR) SERVICES"
      ),
      allowNull: true,
    },
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ["service"] }],
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    paranoid: true,
    deletedAt: "deletedAt",
  }
);

// anonymize email and sensitive fields when soft-deleting
User.addHook("beforeDestroy", async (userInstance, options) => {
  const tx = options && options.transaction ? { transaction: options.transaction } : {};
  const anonEmail = `deleted:${userInstance.id}:${Date.now()}@deleted.sirabizu`;
  
  await User.update(
    {
      email: anonEmail,
      googleId: null,
    },
    { where: { id: userInstance.id }, ...tx }
  );
});

// handle bulk destroy similarly
User.addHook("beforeBulkDestroy", async (options) => {
  const tx = options && options.transaction ? { transaction: options.transaction } : {};
  if (!options || !options.where || !options.where.id) return;
  const ids = Array.isArray(options.where.id) ? options.where.id : [options.where.id];
  
  await User.update(
    {
      email: sequelize.literal(`concat('deleted:', id, ':', extract(epoch FROM now())::bigint, '@deleted.sirabizu')`),
      phone: null,
    },
    { where: { id: ids }, ...tx }
  );
});

export default User;
