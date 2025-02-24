const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  cartData: {
    type: Array,
    required: true,
  },
  deliveryFormData: {
    type: Object,
    required: true,
  },
  paymentDetails: {
    method: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ["processing", "shipped", "delivered"],
    default: "processing",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  payment: {
    type: Boolean,
    default: false,
  },
  accountInfo: {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      index: true,
    },
  },
});

orderSchema.index({ "accountInfo.email": 1, status: 1 });

module.exports = mongoose.model("Order", orderSchema);
