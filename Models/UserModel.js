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
      type: DataTypes.ENUM("user", "consultant", "admin"),
      defaultValue: "user",
      allowNull: false,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cv: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    indexes: [{ fields: ["email"] }],
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
  const anonEmail = `deleted:${userInstance.id}:${Date.now()}@deleted.digitalconsultancy`;
  
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
    email: `deleted:${id}:${Date.now()}@deleted.digitalconsultancy`,
    name: "Deleted user",
    phone: null,
  }));
  // simpler: run a single update for matching ids
  await User.update(
    {
      email: sequelize.literal(`concat('deleted:', id, ':', extract(epoch FROM now())::bigint, '@deleted.digitalconsultancy')`),
      name: "Deleted user",
      phone: null,
    },
    { where: { id: ids }, ...tx }
  );
});

export default User;
