import { body, check } from "express-validator";

const imageSize = 3;

export const signupValidator = [
  body("userName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .if(body("googleId").not().exists())
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("ConformPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("role")
    .optional()
    .isIn(["user", "admin", "consultant"])
    .withMessage("Role must be user, admin, or consultant"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),

  body("BusinessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required"),

  body("BusinessAddress")
    .trim()
    .notEmpty()
    .withMessage("Business address is required"),

  body("BusinessType")
    .trim()
    .notEmpty()
    .withMessage("Business type is required"),

  body("Business")
    .trim()
    .notEmpty()
    .withMessage("Business area is required"),

  body("TIN")
    .trim()
    .notEmpty()
    .withMessage("Tax identification number is required"),

  body("agreedToTerms")
    .custom((value) => {
      if (value === true || value === "true") {
        return true;
      }
      throw new Error("You must accept the terms and conditions");
    }),

  check("nationalIdFile")
    .optional()
    .custom((value, { req }) => {
      if (!req.file) return true;
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error("Only PDF, JPG, JPEG, PNG files are allowed for National ID");
      }
      if (req.file.size > imageSize * 1024 * 1024) {
        throw new Error(`National ID size should be less than ${imageSize}MB`);
      }
      return true;
    }),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];
