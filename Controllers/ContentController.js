import {
  createContent,
  getAllContent,
  updateContent,
  deleteContent,
} from "../Services/ContentService.js";

import { saveImage } from "../Utils/SaveFilesUtils.js";

export const createContentHandler = async (req, res, next) => {
  try {
    let fileUrl = null;

    if (req.file) {
      fileUrl = await saveImage(
        req.file.buffer,
        req.file.originalname,
        "Content",
        1200
      );
    }

    const content = await createContent({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      fileUrl,
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
    const { category } = req.query;
    const content = await getAllContent(category);
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
