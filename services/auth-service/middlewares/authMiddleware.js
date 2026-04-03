const jwt = require("jsonwebtoken");
const User = require("../models/User");
const mongoose = require("mongoose");

/* ================== PROTECT ROUTES ================== */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 🔐 Extract token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing",
      });
    }

    if (typeof token !== "string" || token.split(".").length !== 3) {
      return res.status(401).json({
        success: false,
        message: "Malformed token",
      });
    }

    // 🔑 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id)
      .select("name email role createdAt updatedAt");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // attach user to request
    req.user = user;

    next();

  } catch (error) {
    console.error("Auth Error:", error.message);

    let message = "Not authorized";

    if (error.name === "TokenExpiredError") {
      message = "Token expired";
    } else if (error.name === "JsonWebTokenError") {
      message = "Invalid token";
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/* ================== AUTHORIZE ROLES ================== */
exports.authorize = (...roles) => {
  return (req, res, next) => {

    // 👑 Super admin bypass
    if (req.user && req.user.role === "super_admin") {
      return next();
    }

    // ❌ No user attached
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ❌ Role not allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};
