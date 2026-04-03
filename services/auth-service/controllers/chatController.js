const Chat = require("../models/Chat");
const axios = require("axios");

/* ================== AI ML SERVICE ================== */
const getAIResponse = async (message) => {
  try {
    const response = await axios.post(
      process.env.ML_SERVICE_URL || "http://localhost:5001/predict",
      {
        symptoms: message,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 5000, // prevent hanging requests
      }
    );

    // safe access
    if (response.data && response.data.prediction) {
      return response.data.prediction;
    }

    return "AI could not generate a response.";

  } catch (error) {
    console.error("ML Error:", error.response?.data || error.message);

    if (error.code === "ECONNABORTED") {
      return "AI service timeout. Try again.";
    }

    if (error.response) {
      return "AI service error. Please try later.";
    }

    return "AI service unavailable. Please try again.";
  }
};

/* ================== SEND MESSAGE ================== */
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    // find existing chat or create new
    let chat = await Chat.findOne({ patient: userId, deleted: false });

    if (!chat) {
      chat = await Chat.create({
        patient: userId,
        messages: [],
      });
    }

    // push patient message
    chat.messages.push({
      sender: "patient",
      text: message,
      isRead: true,
    });

    // call ML service
    const aiResponse = await getAIResponse(message);

    // push AI response
    chat.messages.push({
      sender: "ai",
      text: aiResponse,
      isRead: false,
    });

    // update chat metadata
    chat.lastMessage = aiResponse;
    chat.lastMessageAt = new Date();
    chat.unreadCount += 1;

    // severity from middleware
    if (req.severity) {
      chat.severity = req.severity;

      // auto escalation
      if (req.severity === "high") {
        chat.status = "escalated";
      }
    }

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Message processed",
      reply: aiResponse,
      chat,
    });

  } catch (error) {
    console.error("Send Message Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

/* ================== GET CHAT ================== */
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      patient: req.user._id,
      deleted: false,
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "No chat found",
      });
    }

    return res.status(200).json({
      success: true,
      chat,
    });

  } catch (error) {
    console.error("Get Chat Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
    });
  }
};