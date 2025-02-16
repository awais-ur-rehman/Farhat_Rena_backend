const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const Category = require("../models/Category.js");

const router = express.Router();

const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_FORMATS.includes(file.mimetype)) {
    cb(
      new Error("Invalid file format. Only JPEG, PNG and WebP are allowed."),
      false
    );
    return;
  }
  cb(null, true);
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "category_images",
    format: async (req, file) => {
      return "webp";
    },
    transformation: [
      { width: 1000, height: 1000, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
      { flags: "progressive" },
    ],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ success: true, categories });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch categories." });
  }
});

router.post("/", async (req, res) => {
  let uploadMiddleware = upload.single("image");

  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Category image is required.",
      });
    }

    try {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "Category with this name already exists.",
        });
      }

      const category = new Category({
        name: name.trim(),
        imageUrl: req.file.path,
      });

      await category.save();

      res.status(201).json({
        success: true,
        category,
        message: "Category created successfully.",
      });
    } catch (error) {
      if (req.file && req.file.path) {
        try {
          const publicId = req.file.path.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`category_images/${publicId}`);
        } catch (cloudinaryError) {
          console.error("Error deleting image:", cloudinaryError);
        }
      }

      console.error("Category creation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add category. Please try again later.",
      });
    }
  });
});

// Update a category
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const updateData = { name };

    if (req.file) {
      const oldImageUrl = existingCategory.imageUrl;
      const publicId = oldImageUrl.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`category_images/${publicId}`);
      updateData.imageUrl = req.file.path;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update category." });
  }
});

// Delete a category
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
    res.json({ success: true, message: "Category removed successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete category." });
  }
});

module.exports = router;
