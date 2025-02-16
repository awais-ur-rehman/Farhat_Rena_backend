const jwt = require("jsonwebtoken");

const fetchUser = async (req, res, next) => {
  console.log("verifying");
  const token = req.header("auth-token");
  const userEmail = req.header("user-email");
  console.log("Token:", token);
  console.log("Email:", userEmail);

  if (!token || !userEmail) {
    console.log("Missing token or email");
    return res
      .status(401)
      .send({ errors: "Please authenticate using valid token" });
  }

  try {
    const decoded = jwt.verify(token, "secret_ecom");
    console.log("Decoded token:", decoded);

    req.user = {
      id: decoded.id,
      email: userEmail,
    };

    console.log("User data set:", req.user);
    next();
  } catch (error) {
    console.log("Token verification error:", error);
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

module.exports = fetchUser;
