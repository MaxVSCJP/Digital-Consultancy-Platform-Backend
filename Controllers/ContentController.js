import {
  createContent,
  getAllContent,
  updateContent,
  deleteContent,
} from "../Services/ContentService.js";
import { saveImage } from "../Utils/SaveFilesUtils.js";

export const createContentHandler = async (req, res, next) => {
  try {
    const { title, description, category, contentType } = req.body;

    if (!title || !category || !contentType) {
      return res.status(400).json({
        message: "title, category and contentType are required",
      });
    }

    if (!["file", "article"].includes(contentType)) {
      return res.status(400).json({
        message: "contentType must be 'file' or 'article'",
      });
    }

    let fileUrl = null;

    if (contentType === "file") {
      if (!req.file) {
        return res.status(400).json({
          message: "File is required when contentType is 'file'",
        });
      }

      fileUrl = await saveImage(
        req.file.buffer,
        req.file.originalname,
        "Content",
        1200
      );
    }

    if (contentType === "article" && !description?.trim()) {
      return res.status(400).json({
        message: "Description is required for article content",
      });
    }

    const content = await createContent({
      title,
      description: contentType === "article" ? description : null,
      category,
      fileUrl,
      contentType,
      createdBy: req.user.id,
    });

    res.status(201).json({
      message: "Content created successfully",
      content,
    });
  } catch (err) {
    next(err);
  }
};


export const getContentHandler = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const content = await getAllContent({
      category,
      search,
    });

    res.status(200).json(content);
  } catch (err) {
    next(err);
  }
};

export const updateContentHandler = async (req, res, next) => {
  try {
    let fileUrl;

    if (req.file) {
      fileUrl = await saveImage(
        req.file.buffer,
        req.file.originalname,
        "Content",
        1200
      );
    }

    const content = await updateContent(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      fileUrl,
    });

    res.status(200).json({
      message: "Content updated successfully",
      content,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteContentHandler = async (req, res, next) => {
  try {
    await deleteContent(req.params.id);
    res.status(200).json({ message: "Content deleted successfully" });
  } catch (err) {
    next(err);
  }
};