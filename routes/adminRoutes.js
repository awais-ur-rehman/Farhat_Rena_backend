const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const router = express.Router();

// Admin login
router.post("/adminlogin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      return res.status(200).json({
        message: "Login successful",
        name: admin.name,
      });
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Forgot password
router.post("/forgotpassword", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(400).json({ message: "Email not found" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpire = Date.now() + 300000; // 5 minutes

    admin.resetPasswordToken = otp;
    admin.resetPasswordExpire = otpExpire;
    await admin.save();

    res.status(200).json({ otp }); // Optional: remove this in production
  } catch (error) {
    console.error("Error handling forgot password:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Verify OTP
router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const admin = await Admin.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "OTP is invalid or expired" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset password
router.put("/resetpassword/:email", async (req, res) => {
  const { email } = req.params;
  const { password } = req.body;

  try {
    const admin = await Admin.findOne({
      email,
      resetPasswordToken: { $ne: null },
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid request" });
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add admin
router.post("/addadmin", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });
    await newAdmin.save();
    res.status(201).json({ message: "Admin added successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error adding admin" });
  }
});

// Fetch all admins
router.get("/alladmins", async (req, res) => {
  try {
    const admins = await Admin.find({}, "-password"); // exclude passwords
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: "Error fetching admins" });
  }
});

// Remove admin
router.post("/removeadmin", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const admin = await Admin.findOne({ email });
    if (admin && (await bcrypt.compare(password, admin.password))) {
      await Admin.deleteOne({ email });
      res.json({ message: "Admin removed successfully!" });
    } else {
      res.status(400).json({ error: "Incorrect password" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error removing admin" });
  }
});

module.exports = router;
