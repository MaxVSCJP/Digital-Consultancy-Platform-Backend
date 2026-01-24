export const DEFAULT_ROLE = "user";

export const VALID_ROLES = {
  user: "user",
  admin: "admin",
  consultant: "consultant",
};

export const isAdminPanelRole = (role) => ADMIN_PANEL_ROLES.has(role);

export const buildUserAuthPayload = (user) => {
  const profile = user?.profile || {};
  const fullName = profile.full_name?.trim();
  const splitName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const resolvedName = fullName || splitName || user.email;

  return {
    id: user.id,
    email: user.email,
    name: resolvedName,
    avatar: profile.avatar_url || null,
    role: user.role || DEFAULT_ROLE,
  };
};

export const loginService = async (email, password) => {
  const user = await User.findOne({
    where: { email: email },
    attributes: ["id", "name", "password", "role", "profileImage"],
  });
  if (!user) throw createError(404, "User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw createError(400, "Incorrect password");

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
  );

  return { user, token };
};

export const signupService = async (userData) => {
  const { name, email, password, role, phone } = userData;

  let cvImage = null;

  // Handle CV image
  if (userData) {
    try {
      cvImage = await saveCVImage(userData.buffer, userData.originalname);
    } catch (error) {
      return next(createError(500, "Could not upload CV image"));
    }
  }

  try {
    const existingUser = await User.findOne({
      where: { email },
      attributes: ["id"],
    });
    if (existingUser) {
      return next(createError(409, "Email already in use"));
    }

    const hashed = password ? await bcrypt.hash(password, 13) : null;

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role: role === VALID_ROLES.admin ? VALID_ROLES.user : role,
      phone,
      cvImage,
    });

    const { password, ...safeUser } = newUser;
    return safeUser;
  } catch (error) {
    console.error("Error during signup:", error);
    throw createError(500, "Error during signup");
  }
};
