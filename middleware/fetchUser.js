const jwt = require("jsonwebtoken");

const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  const userEmail = req.header("user-email");

  if (!token || !userEmail) {
    return res
      .status(401)
      .send({ errors: "Please authenticate using valid token" });
  }

  try {
    const decoded = jwt.verify(token, "secret_ecom");

    req.user = {
      id: decoded.id,
      email: userEmail,
    };
    next();
  } catch (error) {
    res.status(401).send({ errors: "Please authenticate using a valid token" });
  }
};

module.exports = fetchUser;
