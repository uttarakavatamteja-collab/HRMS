require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ──────────────────────────────────────
app.use(helmet());
app.use(compression());

// ── Rate Limiting ─────────────────────────────────
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api/", limiter);

// ── CORS ──────────────────────────────────────────
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173"
).split(",");
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// ── Body Parser ───────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ── Static Uploads ────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ────────────────────────────────────────
app.use("/api", require("./routes/index"));

// ── Health Check ──────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// ── 404 ───────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

// ── Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res
    .status(err.status || 500)
    .json({ success: false, message: err.message || "Server error" });
});

// ── Start ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HRMS Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅ Set" : "⚠️  Using default"}`,
  );
  console.log(
    `🗄️  Database: ${process.env.DB_NAME || "hrms_db"} @ ${process.env.DB_HOST || "localhost"}\n`,
  );
});

module.exports = app;
