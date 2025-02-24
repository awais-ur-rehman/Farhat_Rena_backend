const express = require("express");
const Order = require("../models/Order");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");

router.post("/placeOrder", fetchUser, async (req, res) => {
  try {
    const {
      cartData,
      deliveryFormData,
      paymentDetails,
      status,
      payment,
      accountInfo,
    } = req.body;

    if (!cartData) {
      return res.status(400).json({
        success: false,
        message: "Cart data is missing",
        debug: { received: req.body },
      });
    }

    if (!deliveryFormData) {
      return res.status(400).json({
        success: false,
        message: "Delivery form data is missing",
        debug: { received: req.body },
      });
    }

    if (!accountInfo) {
      return res.status(400).json({
        success: false,
        message: "Account info is missing",
        debug: { received: req.body },
      });
    }

    const newOrder = new Order({
      userId: req.user.id,
      userEmail: req.user.email,
      cartData,
      deliveryFormData,
      paymentDetails,
      status: status || "processing",
      payment: payment || false,
      accountInfo,
    });

    const savedOrder = await newOrder.save();

    // Verify the order was saved
    const verifyOrder = await Order.findById(savedOrder._id);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id,
      debug: {
        userEmail: req.user.email,
        orderSaved: !!verifyOrder,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
});

router.get("/orders", fetchUser, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const orders = await Order.find({
      "accountInfo.email": userEmail,
    }).sort({ createdAt: -1 });

    if (orders.length === 0) {
      const allOrders = await Order.find({});
    }

    res.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

router.delete("/cancelOrder/:orderId", fetchUser, async (req, res) => {
  try {
    const { orderId } = req.params;

    const deletedOrder = await Order.findOneAndDelete({
      _id: orderId,
      "accountInfo.email": req.user.email,
    });

    if (!deletedOrder) {
      return res.status(404).json({
        success: false,
        error: "Order not found or you're not authorized to cancel it",
      });
    }

    res.json({
      success: true,
      message: "Order canceled successfully",
      orderId: orderId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to cancel order",
      message: error.message,
    });
  }
});

router.post("/updateOrderStatus/:id", fetchUser, async (req, res) => {
  try {
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: req.params.id, userEmail: req.user.email },
      { status: req.body.status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/allOrders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

router.get("/admin/directOrders", async (req, res) => {
  try {
    const directOrders = await DirectOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, orders: directOrders });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching Direct orders" });
  }
});

router.post("/admin/updateOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating order" });
  }
});

router.delete("/admin/deleteOrder/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting order" });
  }
});

module.exports = router;
