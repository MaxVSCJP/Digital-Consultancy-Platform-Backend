import { body, check } from "express-validator";

const imageSize = 3;


export const signupValidator = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .if(body("googleId").not().exists()) // password required if not Google signup
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["client", "consultant", "admin", "mediaManager", "superAdmin"])
    .withMessage("Role must be client, consultant, admin, mediaManager, or superAdmin"),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString(),

  check("cv")
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
        throw new Error("Only PDF, JPG, JPEG, PNG files are allowed for CV");
      }
      if (req.file.size > imageSize * 1024 * 1024) {
        throw new Error(`CV size should be less than ${imageSize}MB`);
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
