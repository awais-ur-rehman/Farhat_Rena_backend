const express = require("express");
const router = express.Router();
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinaryConfig");
const Product = require("../models/Product");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "products",
    format: async () => "png",
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Invalid file type"), false);
    }
    cb(null, true);
  },
});

router.post("/add", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const imageUrls = req.files.map((file) => file.path);

    const {
      name,
      category,
      new_price,
      old_price,
      tagline,
      description,
      sizes,
      fabrics,
      price,
      tags,
      combinations,
    } = req.body;

    const product = new Product({
      name,
      images: imageUrls,
      category,
      new_price: Number(new_price),
      old_price: Number(old_price),
      price: Number(price),
      tagline,
      description,
      sizes: sizes.split(",").map((s) => s.trim()),
      fabrics: fabrics.split(",").map((f) => f.trim()),
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      combinations: JSON.parse(combinations),
      available: true,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (req.files) {
      const publicIds = req.files.map((file) => {
        const parts = file.path.split("/");
        return `products/${parts[parts.length - 1].split(".")[0]}`;
      });
      await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id)));
    }
    res.status(400).json({ error: error.message });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { category, available } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (available) filter.available = available === "true";

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/getAll", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/getById/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/removeProduct", async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const deletedProduct = await Product.findOneAndDelete({ _id });
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product deleted successfully", deletedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
