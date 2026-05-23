import {
  createContent,
  getAllContent,
  updateContent,
  deleteContent,
} from "../Services/ContentService.js";
import { saveContentFile, saveImage } from "../Utils/SaveFilesUtils.js";

export const createContentHandler = async (req, res, next) => {
  try {
    const { title, description, category, contentType } = req.body;
    const fileUpload = req.files?.file?.[0];
    const imageUpload = req.files?.image?.[0];

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
    let imageUrl = null;

    if (contentType === "file") {
      if (!fileUpload) {
        return res.status(400).json({
          message: "File is required when contentType is 'file'",
        });
      }

      fileUrl = await saveContentFile(
        fileUpload.buffer,
        fileUpload.originalname
      );
    } else if (fileUpload) {
      return res.status(400).json({
        message: "File is not allowed when contentType is 'article'",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    if (!imageUpload) {
      return res.status(400).json({
        message: "Cover image is required",
      });
    }

    imageUrl = await saveImage(
      imageUpload.buffer,
      imageUpload.originalname,
      "ContentImages",
      800,
      80
    );

    const content = await createContent({
      title,
      description,
      category,
      fileUrl,
      imageUrl,
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
    const fileUpload = req.files?.file?.[0];
    const imageUpload = req.files?.image?.[0];
    let fileUrl;
    let imageUrl;

    if (fileUpload) {
      fileUrl = await saveContentFile(
        fileUpload.buffer,
        fileUpload.originalname
      );
    }

    if (imageUpload) {
      imageUrl = await saveImage(
        imageUpload.buffer,
        imageUpload.originalname,
        "ContentImages",
        800,
        80
      );
    }

    const content = await updateContent(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      fileUrl,
      imageUrl,
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