const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyToken = require("../middleware/fetchUser");

router.get("/getcart", verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, cartData: user.cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/addtocart", verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const {
      itemId,
      selectedSize,
      selectedFabric,
      selectedQuantity,
      selectedPrice,
      product,
      fitStyleSelection,
    } = req.body;

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        $addToSet: {
          "cartData.items": {
            itemId,
            selectedSize,
            selectedFabric,
            selectedQuantity,
            selectedPrice,
            product,
            fitStyleSelection,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, cartData: user.cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/removefromcart", verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { itemId, selectedSize, selectedFabric } = req.body;

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      {
        $pull: {
          "cartData.items": {
            itemId,
            selectedSize,
            selectedFabric,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, cartData: user.cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// New endpoint to clear the entire cart
router.delete("/clearcart", verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { "cartData.items": [] } },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Cart cleared successfully",
      cartData: user.cartData,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
