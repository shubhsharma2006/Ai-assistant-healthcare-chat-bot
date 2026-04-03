

const Chat = require("../models/Chat");

/* ================== VALIDATE MESSAGE ================== */
exports.validateMessage = (req, res, next) => {
  const { message } = req.body;

  if (!message || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message cannot be empty",
    });
  }

  if (message.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Message too long (max 500 characters)",
    });
  }

  next();
};

/* ================== CHECK CHAT ACCESS ================== */
exports.checkChatAccess = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // 👤 Patient access
    if (
      req.user.role === "patient" &&
      chat.patient.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this chat",
      });
    }

    // 🩺 Doctor access
    if (
      req.user.role === "doctor" &&
      chat.doctor &&
      chat.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Doctor not assigned to this chat",
      });
    }

    // 👑 Admin / Super Admin → always allowed
    if (["admin", "super_admin"].includes(req.user.role)) {
      req.chat = chat;
      return next();
    }

    req.chat = chat;
    next();

  } catch (error) {
    console.error("Chat Access Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Chat access error",
    });
  }
};

/* ================== DETECT SEVERITY ================== */
exports.detectSeverity = (req, res, next) => {
  const { message } = req.body;

  const highRiskKeywords = [
    "chest pain",
    "breathing problem",
    "heart attack",
    "stroke",
    "unconscious",
    "severe bleeding",
  ];

  const mediumRiskKeywords = [
    "fever",
    "infection",
    "pain",
    "vomiting",
  ];

  let severity = "low";

  if (
    highRiskKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    )
  ) {
    severity = "high";
  } else if (
    mediumRiskKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    )
  ) {
    severity = "medium";
  }

  req.severity = severity;

  next();
};