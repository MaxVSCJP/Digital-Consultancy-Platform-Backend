import { validationResult } from "express-validator";

const validate = (validations) => {
  return async (req, res, next) => {
    console.log("Validating request body:", JSON.stringify(req.body, null, 2));
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMsgs = errors.array().map(err => err.msg);
    console.log("Validation errors:", errorMsgs);
    return res.status(400).json({ 
      status: "error", 
      message: errorMsgs.join(", "),
      errors: errors.array() 
    });
  };
};

export default validate;
