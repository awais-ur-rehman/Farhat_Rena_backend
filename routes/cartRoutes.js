const express = require("express");
const router = express.Router();
const User = require("../models/User");

const verifyToken = require("../middleware/fetchUser");

router.get("/getcart", verifyToken, async (req, res) => {
  console.log("start");
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
    console.error("Error fetching cart data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add item to cart
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
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove item from cart
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
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
