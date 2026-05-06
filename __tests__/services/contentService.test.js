import { jest } from "@jest/globals";
import { Op } from "sequelize";

const Content = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByPk: jest.fn(),
};
const deleteFileByUrl = jest.fn();

jest.unstable_mockModule("../../Models/ContentModel.js", () => ({
  default: Content,
}));
jest.unstable_mockModule("../../Utils/SaveFilesUtils.js", () => ({ deleteFileByUrl }));

const {
  createContent,
  getAllContent,
  getContentById,
  updateContent,
  deleteContent,
} = await import("../../Services/ContentService.js");

describe("ContentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates content with file type when fileUrl exists", async () => {
    Content.create.mockResolvedValue({ id: "c1" });
    await createContent({ title: "T", category: "C", fileUrl: "http://file" });
    expect(Content.create).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "file" })
    );
  });

  it("lists content with filters", async () => {
    Content.findAll.mockResolvedValue([]);
    await getAllContent({ category: "Finance", search: "budget" });
    const call = Content.findAll.mock.calls[0][0];
    expect(call.where.category).toBe("Finance");
    expect(call.where[Op.or]).toBeDefined();
  });

  it("rejects missing content", async () => {
    Content.findByPk.mockResolvedValue(null);
    await expect(getContentById("missing")).rejects.toMatchObject({ status: 404 });
  });

  it("updates content and removes old file", async () => {
    const content = {
      fileUrl: "http://old",
      update: jest.fn(),
    };
    Content.findByPk.mockResolvedValue(content);

    await updateContent("c1", { title: "New", fileUrl: "http://new" });

    expect(deleteFileByUrl).toHaveBeenCalledWith("http://old");
    expect(content.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New", contentType: "file" })
    );
  });

  it("deletes content and linked file", async () => {
    const content = { fileUrl: "http://old", destroy: jest.fn() };
    Content.findByPk.mockResolvedValue(content);

    await deleteContent("c1");

    expect(deleteFileByUrl).toHaveBeenCalledWith("http://old");
    expect(content.destroy).toHaveBeenCalled();
  });
});
