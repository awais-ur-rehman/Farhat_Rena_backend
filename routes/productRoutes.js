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
    fileSize: 25 * 1024 * 1024,
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

    // Basic validation
    if (!name || !category || !description) {
      throw new Error("Missing required fields");
    }

    // Handle arrays that might come as strings or arrays
    const parsedSizes = Array.isArray(sizes)
      ? sizes
      : sizes.split(",").map((s) => s.trim());
    const parsedFabrics = Array.isArray(fabrics)
      ? fabrics
      : fabrics.split(",").map((f) => f.trim());
    const parsedTags = tags
      ? Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim())
      : [];

    // Safely parse combinations
    let parsedCombinations = [];
    if (combinations) {
      try {
        parsedCombinations =
          typeof combinations === "string"
            ? JSON.parse(combinations)
            : combinations;
      } catch (e) {
        throw new Error("Invalid combinations format");
      }
    }

    const product = new Product({
      name,
      images: imageUrls,
      category,
      new_price: new_price ? Number(new_price) : undefined,
      old_price: old_price ? Number(old_price) : undefined,
      price: price ? Number(price) : undefined,
      tagline,
      description,
      sizes: parsedSizes,
      fabrics: parsedFabrics,
      tags: parsedTags,
      combinations: parsedCombinations,
      available: true,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      try {
        const publicIds = req.files.map((file) => {
          const path = file.path;
          const splitPath = path.split("/");
          const filenameWithExtension = splitPath[splitPath.length - 1];
          const filename = filenameWithExtension.split(".")[0];
          return `products/${filename}`;
        });

        await Promise.all(
          publicIds.map((id) => cloudinary.uploader.destroy(id))
        );
      } catch (cleanupError) {
        console.error("Error cleaning up images:", cleanupError);
      }
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

router.put("/update/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { id } = req.params;

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
      available,
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (tagline) updateData.tagline = tagline;
    if (description) updateData.description = description;
    if (new_price) updateData.new_price = Number(new_price);
    if (old_price) updateData.old_price = Number(old_price);
    if (price) updateData.price = Number(price);
    if (available !== undefined) updateData.available = available === "true";

    if (sizes) {
      updateData.sizes = Array.isArray(sizes)
        ? sizes
        : sizes.split(",").map((s) => s.trim());
    }

    if (fabrics) {
      updateData.fabrics = Array.isArray(fabrics)
        ? fabrics
        : fabrics.split(",").map((f) => f.trim());
    }

    if (tags) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags.split(",").map((t) => t.trim());
    }

    if (combinations) {
      try {
        updateData.combinations =
          typeof combinations === "string"
            ? JSON.parse(combinations)
            : combinations;
      } catch (e) {
        throw new Error("Invalid combinations format");
      }
    }

    if (req.files && req.files.length > 0) {
      const product = await Product.findById(id);

      if (product && product.images && product.images.length > 0) {
        try {
          const publicIds = product.images.map((path) => {
            const splitPath = path.split("/");
            const filenameWithExtension = splitPath[splitPath.length - 1];
            const filename = filenameWithExtension.split(".")[0];
            return `products/${filename}`;
          });

          await Promise.all(
            publicIds.map((id) => cloudinary.uploader.destroy(id))
          );
        } catch (cleanupError) {
          console.error("Error cleaning up old images:", cleanupError);
        }
      }

      updateData.images = req.files.map((file) => file.path);
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    if (req.files && req.files.length > 0) {
      try {
        const publicIds = req.files.map((file) => {
          const path = file.path;
          const splitPath = path.split("/");
          const filenameWithExtension = splitPath[splitPath.length - 1];
          const filename = filenameWithExtension.split(".")[0];
          return `products/${filename}`;
        });

        await Promise.all(
          publicIds.map((id) => cloudinary.uploader.destroy(id))
        );
      } catch (cleanupError) {
        console.error("Error cleaning up images:", cleanupError);
      }
    }
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
