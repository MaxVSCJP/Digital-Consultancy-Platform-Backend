import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();

import User from "../Models/UserModel.js";
import { Op } from "sequelize";
import createError from "../Utils/CreateErrorsUtils.js";
import { callbackURL } from "./ProDevConfig.js";
import {
  DEFAULT_ROLE,
  VALID_ROLES,
  buildUserAuthPayload,
} from "../Services/AuthServices.js";

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
      const updatedUser = await User.update({
        where: { id: existingUser.id },
        data: {
          googleId,
          name: existingUser.name || displayName,
          profileImage: avatar || existingUser.profileImage,
        },
      });

      return buildUserAuthPayload(updatedUser);
    }

    // Create new account (Google-only users have no password)
    try {
      if (role === VALID_ROLES.admin) {
        throw createError(403, "Cannot sign up as admin via Google OAuth");
      }

      const createdUser = await User.create({
        email,
        password_hash: null,
        googleId,
        role: role,
        name: displayName,
        profileImage: avatar,
      });

      return buildUserAuthPayload(createdUser);
    } catch (e) {
      // Race-safe fallback if another request created/linked in parallel
      if (e?.code === "P2002") {
        const linked = await User.findOne({
          where: { OR: [{ googleId }, ...(email ? [{ email }] : [])] },
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
