import { body } from "express-validator";

export const postChatMessageValidator = [
  body("message")
    .isString()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("message must be between 1 and 2000 characters"),
];
