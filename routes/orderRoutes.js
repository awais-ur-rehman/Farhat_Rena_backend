const express = require("express");
const Order = require("../models/Order");
const router = express.Router();
const fetchUser = require("../middleware/fetchUser");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendOrderConfirmationEmail = async (order) => {
  try {
    // Generate order items HTML
    const orderItemsHtml = order.cartData
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.name
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.fabric || ""
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.size || ""
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${
          item.quantity
        }</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">Rs. ${
          item.price
        }</td>
      </tr>
    `
      )
      .join("");

    // Calculate total amount
    const totalAmount = order.cartData.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Set up email options
    const mailOptions = {
      from: '"Farhat Rena" <info@farhatrena.com>',
      to: order.accountInfo.email,
      subject: `Order Confirmation - #${order._id.toString().slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #333;">Order Confirmation</h1>
            <p style="font-size: 16px; color: #666;">Thank you for your purchase!</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Order #${order._id
              .toString()
              .slice(-6)}</h2>
            <p>We're getting your order ready to be shipped. We will notify you when it has been sent.</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #333; font-size: 18px;">Order Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f3f3;">
                  <th style="padding: 10px; text-align: left;">Product</th>
                  <th style="padding: 10px; text-align: left;">Fabric</th>
                  <th style="padding: 10px; text-align: left;">Size</th>
                  <th style="padding: 10px; text-align: left;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">Rs. ${totalAmount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="width: 48%;">
              <h3 style="color: #333; font-size: 16px;">Shipping Address</h3>
              <p style="color: #666; line-height: 1.5;">
                ${order.deliveryFormData.firstName} ${
        order.deliveryFormData.lastName
      }<br>
                ${order.deliveryFormData.street}<br>
                ${order.deliveryFormData.city}, ${
        order.deliveryFormData.state
      } ${order.deliveryFormData.zipcode}<br>
                ${order.deliveryFormData.country}
              </p>
            </div>
            <div style="width: 48%;">
              <h3 style="color: #333; font-size: 16px;">Payment Method</h3>
              <p style="color: #666; line-height: 1.5;">
                ${
                  order.paymentDetails.method === "bank_transfer"
                    ? "Bank Transfer"
                    : order.paymentDetails.method
                }
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 14px;">
              If you have any questions, contact us at <a href="mailto:info@farhatrena.com" style="color: #4A90E2;">info@farhatrena.com</a>
            </p>
            <p style="color: #999; font-size: 14px;">
              &copy; ${new Date().getFullYear()} Farhat Rena. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${order.accountInfo.email}`);
    return true;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
};

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

    // Send order confirmation email
    let emailSent = false;
    if (verifyOrder) {
      emailSent = await sendOrderConfirmationEmail(verifyOrder);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: savedOrder._id,
      emailSent,
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
