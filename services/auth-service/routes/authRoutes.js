const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");

const { protect, authorize } = require("../middlewares/authMiddleware");

/* ================== ROUTES ================== */

// 🔐 Register
router.post("/register", register);

// 🔓 Login
router.post("/login", login);

// 🔁 Refresh Token
router.post("/refresh", refreshToken);

// 🚪 Logout
router.post("/logout", protect, logout);

/* ================== USER PROFILE ================== */
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/* ================== PATIENT ROUTE ================== */
router.get("/patient", protect, authorize("patient", "doctor", "admin", "super_admin"), (req, res) => {
  res.json({
    success: true,
    message: "Patient access granted",
  });
});

// 👑 Admin Route
router.get("/admin", protect, authorize("admin", "super_admin"), (req, res) => {
  res.json({
    success: true,
    message: "Admin access granted",
  });
});

/* ================== DOCTOR ROUTE ================== */
router.get("/doctor", protect, authorize("doctor", "admin", "super_admin"), (req, res) => {
  res.json({
    success: true,
    message: "Doctor access granted",
  });
});

/* ================== AI SERVICE ROUTE ================== */
router.get("/ai", protect, authorize("ai", "admin", "super_admin"), (req, res) => {
  res.json({
    success: true,
    message: "AI service access granted",
  });
});

module.exports = router;