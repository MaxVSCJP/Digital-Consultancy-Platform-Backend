import { DataTypes } from "sequelize";
import { sequelize } from "../Config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    referenceName: {
      type: DataTypes.STRING,
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
      type: DataTypes.ENUM("client", "pro", "admin", "mediaManager", "superAdmin"),
      defaultValue: "client",
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    idPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceIdPhoto: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proofOfWork: {
      type: DataTypes.STRING,
      allowNull: true,
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
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referencePhone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Extended portfolio fields
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hourlyRate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    availability: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    experienceYears: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    linkedinUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Nested/complex structures as JSON
    about: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    education: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    workExperience: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    portfolioProjects: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    verificationRequested: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    indexes: [{ fields: ["email"] }, { fields: ["service"] }],
  },
  {
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
  const updates = ids.map((id) => ({
    id,
    email: `deleted:${id}:${Date.now()}@deleted.sirabizu`,
    name: "Deleted user",
    phone: null,
  }));
  // simpler: run a single update for matching ids
  await User.update(
    {
      email: sequelize.literal(`concat('deleted:', id, ':', extract(epoch FROM now())::bigint, '@deleted.sirabizu')`),
      name: "Deleted user",
      phone: null,
    },
    { where: { id: ids }, ...tx }
  );
});

export default User;
