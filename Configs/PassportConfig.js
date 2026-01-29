import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();

import User from "../Models/UserModel.js";
import Permission from "../Models/PermissionModel.js";
import { Op } from "sequelize";
import createError from "../Utils/CreateErrorsUtils.js";
import { callbackURL } from "./ProDevConfig.js";
import {
  DEFAULT_ROLE,
  VALID_ROLES,
  buildUserAuthPayload,
} from "../Services/AuthServices.js";
import { getDefaultPermissions } from "./PermissionsConfig.js";

const findOrCreateUser = async (profile, role = DEFAULT_ROLE) => {
  const googleId = profile.id;
  if (!googleId) {
    throw createError(400, "Google profile is missing an id");
  }

  const email = profile.emails?.[0]?.value?.toLowerCase() || null;
  const displayName = profile.displayName || email || "Google User";
  const avatar = profile.photos?.[0]?.value || null;

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ googleId }, ...(email ? [{ email }] : [])],
      },
    });

    // Already linked to this Google account
    if (existingUser && existingUser.googleId === googleId) {
      return buildUserAuthPayload(existingUser);
    }

    // Conflict: same email already linked to a different Google account
    if (
      existingUser &&
      email &&
      existingUser.email === email &&
      existingUser.googleId &&
      existingUser.googleId !== googleId
    ) {
      throw createError(409, "Email already linked to another Google account");
    }

    // Link first-time Google to existing email account
    if (
      existingUser &&
      !existingUser.googleId &&
      email &&
      existingUser.email === email
    ) {
      await existingUser.update({
        googleId,
        firstName: existingUser.firstName || profile.name?.givenName || displayName,
        lastName: existingUser.lastName || profile.name?.familyName || null,
        profilePicture: avatar || existingUser.profilePicture,
      });

      return buildUserAuthPayload(existingUser);
    }

    // Create new account (Google-only users have no password)
    try {
      if (role === VALID_ROLES.admin) {
        throw createError(403, "Cannot sign up as admin via Google OAuth");
      }

      const createdUser = await User.create({
        email,
        password: null,
        googleId,
        role: role,
        firstName: profile.name?.givenName || displayName,
        lastName: profile.name?.familyName || null,
        profilePicture: avatar,
      });

      // Create default permissions for the user
      const defaultPermissions = getDefaultPermissions(role);
      await Permission.create({
        userId: createdUser.id,
        ...defaultPermissions,
      });

      return buildUserAuthPayload(createdUser);
    } catch (e) {
      // Race-safe fallback if another request created/linked in parallel
      if (e?.name === "SequelizeUniqueConstraintError") {
        const linked = await User.findOne({
          where: {
            [Op.or]: [{ googleId }, ...(email ? [{ email }] : [])],
          },
        });
        if (linked) return buildUserAuthPayload(linked);
      }
      throw e;
    }
  } catch (error) {
    console.error("Error finding or creating user:", error);
    throw createError(500, "Error finding or creating user");
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state || DEFAULT_ROLE;
        const user = await findOrCreateUser(profile, role);
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export default passport;
