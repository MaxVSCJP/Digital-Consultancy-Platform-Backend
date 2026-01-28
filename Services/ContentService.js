import Content from "../Models/ContentModel.js";
import createError from "../Utils/CreateErrorsUtils.js";
import { deleteFileByUrl } from "../Utils/SaveFilesUtils.js";
import { Op } from "sequelize";

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

export const getAllContent = async (params = {}) => {
  // 1. Destructure carefully with default empty values
  const { category, search } = params;
  
  // DEBUG: Check your terminal after you send the request
  console.log("--- SEARCH DEBUG ---");
  console.log("Category Received:", category);
  console.log("Search Received:", search);

  const where = {};

  // 2. Filter by category (Exact Match)
  if (category && category.trim() !== "") {
    where.category = category.trim();
  }

  // 3. Search by title OR description (Partial Match)
  // Use Op.like for MySQL (Postgres needs Op.iLike)
  if (search && search.trim() !== "") {
    const queryTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: queryTerm } },
      { description: { [Op.like]: queryTerm } }
    ];
  }

  console.log("Generated Where Clause:", JSON.stringify(where, null, 2));

  return await Content.findAll({
    where,
    order: [["createdAt", "DESC"]],
    // This logs the actual SQL query to your terminal
    logging: console.log 
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
