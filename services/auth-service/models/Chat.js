const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["patient", "ai", "doctor"],
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  metadata: {
    type: Object,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  // index for sender-level queries
});

// Note: MongoDB doesn't index inside arrays per subdocument easily; use parent indexes for queries

const chatSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    enum: ["active", "closed", "escalated"],
    default: "active",
    index: true,
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low",
    index: true,
  },
  messages: [messageSchema],
  lastMessage: {
    type: String,
    default: "",
    trim: true,
    maxlength: 1000,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  deleted: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

// Tip: consider archiving old chats instead of deleting; avoid TTL on medical data

chatSchema.index({ patient: 1, status: 1, deleted: 1 });
chatSchema.index({ doctor: 1, status: 1, deleted: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ createdAt: -1 });

// inbox query optimization
chatSchema.index({ patient: 1, lastMessageAt: -1 });
chatSchema.index({ doctor: 1, lastMessageAt: -1 });

// Virtual for message count
chatSchema.virtual("messageCount").get(function () {
  return Array.isArray(this.messages) ? this.messages.length : 0;
});

chatSchema.set("toJSON", { virtuals: true });
chatSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Chat", chatSchema);