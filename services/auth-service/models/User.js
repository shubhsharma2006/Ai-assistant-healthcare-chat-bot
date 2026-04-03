const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    index: true,
    validate: [validator.isEmail, "Invalid email"],
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    select: false,
  },

  refreshToken: {
    type: String,
    default: null,
  },

  role: {
    type: String,
    enum: ["patient", "doctor", "admin", "super_admin", "ai"],
    default: "patient",
    index: true,
  },

  // 🔐 Security fields
  isActive: {
    type: Boolean,
    default: true,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  lastLogin: {
    type: Date,
  },

}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.refreshToken;
      return ret;
    },
  },
  toObject: {
    transform: function (doc, ret) {
      delete ret.password;
      delete ret.__v;
      delete ret.refreshToken;
      return ret;
    },
  },
});


// 🔐 Hash password automatically
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ⚡ Index
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);