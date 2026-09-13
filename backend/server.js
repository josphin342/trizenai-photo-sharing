const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const photoRoutes = require("./routes/photoRoutes");
const galleryRoutes = require("./routes/galleryRoutes");

const connectDB = require("./config/db");

const app = express();

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman or server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },
  })
);

// --------------------------------------------------
// Body parsing
// --------------------------------------------------

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/galleries", galleryRoutes);

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TrizenAI Photo Sharing API is running",
  });
});

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("API error:", error);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
    });
  }

  if (error.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    "Only JPEG, PNG, and WebP images are allowed"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// --------------------------------------------------
// Export app for testing
// --------------------------------------------------

module.exports = app;

// --------------------------------------------------
// Start server only when run directly
// --------------------------------------------------

if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(
          `Server running on port ${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error(
        "Failed to connect to MongoDB:",
        error
      );
      process.exit(1);
    });
}