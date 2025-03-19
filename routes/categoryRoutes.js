const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinaryConfig");
const Category = require("../models/Category.js");

const router = express.Router();

const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_FORMATS.includes(file.mimetype)) {
    cb(
      new Error(
        "Invalid file format. Only JPEG, JPG, PNG and WebP are allowed."
      ),
      false
    );
    return;
  }
  cb(null, true);
};

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

const uploadToCloudinary = async (fileBuffer, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        format: "webp",
        transformation: [
          { width: 1000, height: 1000, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
          { flags: "progressive" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

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

router.post("/", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Category image is required.",
    });
  }

  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required.",
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

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "category_images"
    );

    const category = new Category({
      name: name.trim(),
      imageUrl: uploadResult.secure_url,
    });

    await category.save();

    res.status(201).json({
      success: true,
      category,
      message: "Category created successfully.",
    });
  } catch (error) {
    console.error("Category creation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add category. Please try again later.",
    });
  }
});

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

      try {
        await cloudinary.uploader.destroy(`category_images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting old image:", cloudinaryError);
      }

      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "category_images"
      );
      updateData.imageUrl = uploadResult.secure_url;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error("Category update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update category." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    const imageUrl = category.imageUrl;
    if (imageUrl) {
      const publicId = imageUrl.split("/").pop().split(".")[0];
      try {
        await cloudinary.uploader.destroy(`category_images/${publicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image:", cloudinaryError);
      }
    }

    await Category.findByIdAndDelete(id);
    res.json({ success: true, message: "Category removed successfully." });
  } catch (error) {
    console.error("Category deletion error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete category." });
  }
});

module.exports = router;
