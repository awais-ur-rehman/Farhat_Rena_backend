const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

// Place an order
router.post("/placeOrder", async (req, res) => {
  try {
    const {
      cartData,
      deliveryFormData,
      paymentDetails,
      status,
      payment,
      accountInfo,
    } = req.body;

    const newOrder = new Order({
      cartData,
      deliveryFormData,
      paymentDetails,
      status,
      payment,
      accountInfo,
    });

    await newOrder.save();

    res
      .status(201)
      .json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, message: "Error placing order" });
  }
});

// Get all orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find({});
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

// Cancel an order by ID
router.delete("/cancelOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.json({ success: true, message: "Order canceled successfully" });
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel order. Please try again later.",
    });
  }
});

// Update order status
router.post("/updateOrderStatus/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
