const mongoose = require("mongoose");

const directOrderSchema = new mongoose.Schema({
  buyNowData: { type: Object, required: true },
  deliveryFormData: { type: Object, required: true },
  paymentDetails: { type: Object, required: true },
  status: { type: String, default: "processing" },
});

module.exports = mongoose.model("DirectOrder", directOrderSchema);
