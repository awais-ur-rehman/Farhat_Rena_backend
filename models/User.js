const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: { type: String, unique: true },
  password: { type: String },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
  otp: { type: String },
  otpExpiration: { type: Date },
});

module.exports = mongoose.model("Users", userSchema);
