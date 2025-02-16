const express = require("express");
const DirectOrder = require("../models/DirectOrder");
const router = express.Router();

// Place a direct order
router.post("/placeDirectOrder", async (req, res) => {
  try {
    const { buyNowData, deliveryFormData, paymentDetails, status } = req.body;

    const directOrder = new DirectOrder({
      buyNowData,
      deliveryFormData,
      paymentDetails,
      status,
    });
    await directOrder.save();

    res
      .status(201)
      .json({ success: true, message: "Direct order placed successfully" });
  } catch (error) {
    console.error("Error placing direct order:", error);
    res
      .status(500)
      .json({ success: false, message: "Error placing direct order" });
  }
});

// Get all direct orders
router.get("/directOrders", async (req, res) => {
  try {
    const directOrders = await DirectOrder.find();
    res.status(200).json(directOrders);
  } catch (error) {
    console.error("Error fetching Direct orders:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching Direct orders" });
  }
});

// Cancel a direct order
router.delete("/cancelDirectOrder/:orderId", async (req, res) => {
  try {
    const orderId = req.params.orderId;

    await DirectOrder.findByIdAndDelete(orderId);
    res.json({ success: true, message: "Direct order canceled successfully" });
  } catch (error) {
    console.error("Error canceling direct order:", error);
    res
      .status(500)
      .json({ success: false, message: "Error canceling direct order" });
  }
});

module.exports = router;
