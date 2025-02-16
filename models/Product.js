const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  images: { type: [String], required: true },
  category: { type: String, required: true },
  tagline: { type: String },
  description: { type: String, required: true },
  tags: { type: [String] },
  combinations: {
    type: [
      {
        sizes: [String],
        fabrics: [String],
        price: Number,
      },
    ],
    default: [],
  },
  old_price: { type: Number },
  new_price: { type: Number, required: true },
  combinations: {
    type: [
      {
        sizes: { type: String, required: true },
        fabrics: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
    default: [],
  },
  available: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Product", productSchema);
