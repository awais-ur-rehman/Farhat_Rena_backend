require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes.js");
const directOrderRoutes = require("./routes/directOrderRoutes");
const bannerImmageRoutes = require("./routes/bannerImageRoutes");
const categoryImmageRoutes = require("./routes/categoryImageRoutes");
const sliderImmageRoutes = require("./routes/sliderImageRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes.js");

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(cors());

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 5,
    });

    cachedDb = connection;
    console.log("Connected to MongoDB");
    return connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

connectToDatabase().catch((err) =>
  console.error("Failed to connect to MongoDB:", err)
);

app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/direct-orders", directOrderRoutes);
app.use("/api/bannerImage", bannerImmageRoutes);
app.use("/api/categoryImage", categoryImmageRoutes);
app.use("/api/sliderImage", sliderImmageRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/carts", cartRoutes);

app.get("/", (req, res) => {
  res.send("Hi, This is Server!");
});

app.listen(port, (error) => {
  if (!error) {
    console.log(`Server Running on port ${port}`);
  } else {
    console.log("Error:", error);
  }
});
