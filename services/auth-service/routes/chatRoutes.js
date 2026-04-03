const express = require("express");
const router = express.Router();
const { sendMessage, getChat } = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");
const { validateMessage, detectSeverity } = require("../middlewares/chatMiddleware");

router.post("/send", protect, validateMessage, detectSeverity, sendMessage);
router.get("/", protect, getChat);

module.exports = router;