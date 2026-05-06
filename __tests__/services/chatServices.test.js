import { jest } from "@jest/globals";

const ChatThread = {
  findOne: jest.fn(),
  create: jest.fn(),
};
const ChatMessage = {
  findAll: jest.fn(),
  create: jest.fn(),
};
const loadAiFileContext = jest.fn();

jest.unstable_mockModule("../../Models/ChatThreadModel.js", () => ({
  default: ChatThread,
}));
jest.unstable_mockModule("../../Models/ChatMessageModel.js", () => ({
  default: ChatMessage,
}));
jest.unstable_mockModule("../../Utils/AiFilesUtils.js", () => ({ loadAiFileContext }));

const { getOrCreateThread, listThreadMessages, sendChatMessage } = await import(
  "../../Services/ChatServices.js"
);

describe("ChatServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = "key";
  });

  afterEach(() => {
    delete global.fetch;
  });

  it("requires userId and role", async () => {
    await expect(getOrCreateThread("", "user")).rejects.toMatchObject({ status: 400 });
  });

  it("returns existing thread", async () => {
    ChatThread.findOne.mockResolvedValue({ id: "t1" });

    const result = await getOrCreateThread("u1", "user");

    expect(result).toEqual({ id: "t1" });
    expect(ChatThread.create).not.toHaveBeenCalled();
  });

  it("lists thread messages", async () => {
    ChatMessage.findAll.mockResolvedValue([]);
    await listThreadMessages("t1", 10);
    expect(ChatMessage.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { threadId: "t1" }, limit: 10 })
    );
  });

  it("rejects empty messages", async () => {
    await expect(sendChatMessage({ userId: "u1", role: "user", message: " " })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("uses fallback when no context", async () => {
    ChatThread.findOne.mockResolvedValue({ id: "t1" });
    loadAiFileContext.mockResolvedValue({ context: "" });

    const result = await sendChatMessage({ userId: "u1", role: "user", message: "help" });

    expect(ChatMessage.create).toHaveBeenCalledTimes(2);
    expect(result.reply).toContain("couldn't find information");
  });

  it("returns model reply when context exists", async () => {
    ChatThread.findOne.mockResolvedValue({ id: "t1" });
    loadAiFileContext.mockResolvedValue({ context: "docs" });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: { parts: [{ text: "Answer" }] },
          },
        ],
      }),
    });

    const result = await sendChatMessage({ userId: "u1", role: "user", message: "help" });

    expect(ChatMessage.create).toHaveBeenCalledTimes(2);
    expect(result.reply).toBe("Answer");
  });
});
