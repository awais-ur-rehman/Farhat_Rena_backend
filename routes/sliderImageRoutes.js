const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const SliderImage = require("../models/SliderImages");

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "slider_images",
    resource_type: "image",
    transformation: [{ quality: "auto:best" }],
  },
});

const upload = multer({ storage });

router.post("/images", upload.single("image"), async (req, res) => {
  console.log("starting");
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }

    const newImage = new SliderImage({ imageUrl: req.file.path });
    await newImage.save();

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      imageUrl: newImage.imageUrl,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading image.", error: error.message });
  }
});

// Fetch all images
router.get("/images", async (req, res) => {
  try {
    const images = await SliderImage.find({});
    res.status(200).json({ images: images.map((image) => image.imageUrl) });
  } catch (error) {
    res.status(500).json({ message: "Error fetching images.", error });
  }
});

// Delete an image by its URL
router.delete("/delete", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res
        .status(400)
        .json({ message: "Image URL is required for deletion." });
    }

    const deletedImage = await SliderImage.findOneAndDelete({ imageUrl });
    if (deletedImage) {
      res
        .status(200)
        .json({ success: true, message: "Image deleted successfully." });
    } else {
      res.status(404).json({ success: false, message: "Image not found." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting image.", error });
  }
});

module.exports = router;
