const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const chatRoutes = require("./routes/chatRoutes");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const { protect } = require("./middlewares/authMiddleware");

const app = express();

app.set("trust proxy", 1); // for deployment behind proxy

/* ================== SECURITY ================== */
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false, // easier dev; tighten in prod
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true,
}));

/* ================== BODY PARSER ================== */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

/* ================== EXTRA SECURITY ================== */
app.use(mongoSanitize()); // prevent NoSQL injection
app.use(xss()); // prevent XSS
app.use(hpp()); // prevent HTTP param pollution

/* ================== PERFORMANCE ================== */
app.use(compression());

/* ================== RATE LIMIT ================== */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path === "/health",
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

app.use("/api/auth", limiter);
app.use("/api/chat", apiLimiter);

/* ================== LOGGER ================== */
app.use(morgan("dev"));

/* ================== ROUTES ================== */
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth Service Running 🚀",
  });
});

/* ================== PROTECTED ================== */
app.get("/api/profile", apiLimiter, protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/* ================== HEALTH CHECK ================== */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
  });
});

/* ================== 404 HANDLER ================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================== ERROR HANDLER ================== */
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";
  console.error("Error:", err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Server Error",
    ...(isProd ? {} : { stack: err.stack }),
  });
});

/* ================== DB CONNECT ================== */
const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 4000;

/* ================== START SERVER ================== */
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
  });
};

startServer();

/* ================== GRACEFUL SHUTDOWN ================== */
const shutdown = () => {
  console.log("🛑 Server shutting down...");
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);