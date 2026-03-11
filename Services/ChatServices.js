import path from "path";

import ChatThread from "../Models/ChatThreadModel.js";
import ChatMessage from "../Models/ChatMessageModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { loadAiFileContext } from "../Utils/AiFilesUtils.js";

const AI_FILES_DIR = process.env.AI_FILES_DIR || path.join(process.cwd(), "AI files");

const FALLBACK_RESPONSE =
  "I couldn't find information about that in the system documentation.";

const buildPrompt = (context, question) => {
  return [
    "You are a support assistant for users and consultants.",
    "Answer strictly using the provided documentation context.",
    "Do not mention internal system details or implementation.",
    "If the answer is not in the context, reply with:",
    `"${FALLBACK_RESPONSE}"`,
    "",
    "Documentation context:",
    context || "(no relevant context found)",
    "",
    "User question:",
    question,
  ].join("\n");
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw createError(500, "Gemini API key is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 400,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Gemini request failed";
    throw createError(response.status, message);
  }

  const text =
    payload?.candidates?.[0]?.content?.parts?.[0]?.text ||
    payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join(" ") ||
    "";

  return text.trim();
};

export const getOrCreateThread = async (userId, role) => {
  if (!userId || !role) {
    throw createError(400, "userId and role are required");
  }

  let thread = await ChatThread.findOne({ where: { userId, role } });
  if (!thread) {
    thread = await ChatThread.create({ userId, role });
  }

  return thread;
};

export const listThreadMessages = async (threadId, limit = 50) => {
  return ChatMessage.findAll({
    where: { threadId },
    order: [["createdAt", "ASC"]],
    limit,
  });
};

export const sendChatMessage = async ({ userId, role, message }) => {
  if (!message || !message.trim()) {
    throw createError(400, "Message is required");
  }

  const thread = await getOrCreateThread(userId, role);

  await ChatMessage.create({
    threadId: thread.id,
    sender: "user",
    message,
  });

  const { context } = await loadAiFileContext(AI_FILES_DIR, message);
  if (!context) {
    const fallback = FALLBACK_RESPONSE;
    await ChatMessage.create({
      threadId: thread.id,
      sender: "ai",
      message: fallback,
    });

    return { reply: fallback, threadId: thread.id };
  }

  const prompt = buildPrompt(context, message);
  const reply = await callGemini(prompt);
  const finalReply = reply || FALLBACK_RESPONSE;

  await ChatMessage.create({
    threadId: thread.id,
    sender: "ai",
    message: finalReply,
  });

  return { reply: finalReply, threadId: thread.id };
};
