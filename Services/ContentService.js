import Content from "../Models/ContentModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { deleteFileByUrl } from "../Utils/SaveFilesUtils.js";

export const createContent = async (data) => {
  return Content.create({
    title: data.title,
    description: data.description,
    category: data.category,
    fileUrl: data.fileUrl,
    contentType: data.fileUrl ? "file" : "article",
    createdBy: data.createdBy,
  });
};

export const getAllContent = async (category) => {
  const where = category ? { category } : {};
  return Content.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });
};

export const getContentById = async (id) => {
  const content = await Content.findByPk(id);
  if (!content) throw createError(404, "Content not found");
  return content;
};

export const updateContent = async (id, data) => {
  const content = await getContentById(id);

  if (data.fileUrl && content.fileUrl) {
    await deleteFileByUrl(content.fileUrl);
  }

  await content.update({
    title: data.title ?? content.title,
    description: data.description ?? content.description,
    category: data.category ?? content.category,
    fileUrl: data.fileUrl ?? content.fileUrl,
    contentType: data.fileUrl ? "file" : content.contentType,
  });

  return content;
};

export const deleteContent = async (id) => {
  const content = await getContentById(id);

  if (content.fileUrl) {
    await deleteFileByUrl(content.fileUrl);
  }

  await content.destroy();
};
