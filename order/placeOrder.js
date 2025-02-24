
const stripe = require("stripe")("your_stripe_secret_key");
const orderModel = require("../models/orderSchema/orderSchema");

// Define your placeOrder function
const placeOrder = async (req, res) => {
  try {
    // Create a new order
    const newOrder = new orderModel({
      userId: req.body.userId,
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    // Save the new order to the database
    await newOrder.save();

    // Clear the user's cart data after placing the order
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // Calculate line items for Stripe checkout
    const lineItems = req.body.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.name },
        unit_amount: item.price * 100 * 80,
      },
      quantity: item.quantity,
    }));

    // Add delivery charge as a line item
    lineItems.push({
      price_data: {
        currency: "inr",
        product_data: { name: "Delivery Charge" },
        unit_amount: 5 * 80 * 100,
      },
      quantity: 1,
    });

    // Create a checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      success_url: `http://localhost:5173/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `http://localhost:5173/verify?success=false&orderId=${newOrder._id}`,
      line_items: lineItems,
      mode: "payment",
    });

    // Return the session URL to the client
    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Define your listOrders function
const listOrders = async (req, res) => {
  try {
    // Fetch all orders from the database
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Define your userOrders function
const userOrders = async (req, res) => {
  try {
    // Fetch orders for a specific user
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Define your updateStatus function
const updateStatus = async (req, res) => {
  console.log(req.body);
  try {
    // Update the status of an order
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// Define your verifyOrder function
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    // Verify the order based on the success status
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: "Not  Verified" });
  }
};

// Define your payment endpoint
app.post("/payment", payment);

// Define your placeOrder endpoint
app.post("/placeorder", placeOrder);

// Define your listOrders endpoint
app.get("/listorders", listOrders);

// Define your userOrders endpoint
app.post("/userorders", userOrders);

// Define your updateStatus endpoint
app.post("/updatestatus", updateStatus);

// Define your verifyOrder endpoint
app.post("/verifyorder", verifyOrder);
