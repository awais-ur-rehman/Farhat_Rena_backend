const mongoose = require("mongoose");

const sliderImagesSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
});

module.exports = mongoose.model("SliderImages", sliderImagesSchema);
