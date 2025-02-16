const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const BannerImage = require("../models/BannerImage");
const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "banner_images",
    format: async () => "png",
  },
});
const upload = multer({ storage });

router.post("/images", upload.single("image"), async (req, res) => {
  try {
    const { category } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const newImage = new BannerImage({
      category,
      imageUrl: req.file.path,
    });

    await newImage.save();
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: newImage.imageUrl,
    });
  } catch (error) {
    res.status(500).json({ message: "Error uploading image.", error });
  }
});

// Fetch all images
router.get("/images", async (req, res) => {
  try {
    const images = await BannerImage.find({});
    const formattedImages = images.reduce((acc, image) => {
      acc[image.category] = image.imageUrl;
      return acc;
    }, {});
    res.status(200).json({ images: formattedImages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching images.", error });
  }
});

// Fetch images by category
router.get("/images/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const images = await BannerImage.find({ category });
    if (!images.length) {
      return res
        .status(404)
        .json({ message: "No images found for this category." });
    }
    res.status(200).json({ images: images.map((image) => image.imageUrl) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching images.", error });
  }
});

module.exports = router;
