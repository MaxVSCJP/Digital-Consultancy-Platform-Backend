import express from "express";

import validate from "../Middlewares/ValidateMW.js";
import { verifyToken, authorizeRoles } from "../Middlewares/AuthorizationMW.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { getChatThread, postChatMessage } from "../Controllers/ChatControllers.js";
import { postChatMessageValidator } from "../Validators/ChatValidators.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("user", "consultant"));
router.use((req, res, next) => {
	if (req.user?.role === "admin") {
		return next(createError(403, "Admins are not allowed to access chat"));
	}
	next();
});

router.get("/thread", getChatThread);
router.post("/messages", validate(postChatMessageValidator), postChatMessage);

export default router;
