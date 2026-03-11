import {
  getOrCreateThread,
  listThreadMessages,
  sendChatMessage,
} from "../Services/ChatServices.js";

export const getChatThread = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const thread = await getOrCreateThread(userId, role);
    const messages = await listThreadMessages(thread.id);

    res.json({ data: { threadId: thread.id, messages } });
  } catch (error) {
    next(error);
  }
};

export const postChatMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { message } = req.body;

    const result = await sendChatMessage({ userId, role, message });

    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
};
