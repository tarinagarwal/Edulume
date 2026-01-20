import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdfs.js";
import ebookRoutes from "./routes/ebooks.js";
import uploadRoutes from "./routes/upload.js";
import discussionRoutes from "./routes/discussions.js";
import imageRoutes from "./routes/images.js";
import notificationRoutes from "./routes/notifications.js";
import courseRoutes from "./routes/courses.js";
import roadmapRoutes from "./routes/roadmaps.js";
import feedbackRoutes from "./routes/feedback.js";
import pdfChatRoutes from "./routes/pdfChat.js";
import sitemapRoutes from "./routes/sitemap.js";
import vaultRoutes from "./routes/vault.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js";
import initRedis from "./utils/redis.js";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Load environment variables
dotenv.config();

// Initialize Redis (optional - will work without it)
initRedis().catch((err) => {
  console.log(
    "⚠️  Redis not available, continuing without cache:",
    err.message
  );
});

const app = express();
const server = createServer(app);

// Determine allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [];

  // Always allow localhost for development
  origins.push("http://localhost:5173");
  origins.push("https://edulumeai.vercel.app");
  origins.push("https://edulume.site");
  // Add production client origin if specified
  if (process.env.CLIENT_ORIGIN) {
    origins.push(process.env.CLIENT_ORIGIN);
  }

  return origins;
};

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: getAllowedOrigins(),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Passport
app.use(passport.initialize());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`);
  next();
});

// Make io available to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/pdf-chat", pdfChatRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/", sitemapRoutes);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    const { default: prisma } = await import("./db.js");
    await prisma.$connect();

    // Test a simple query
    const userCount = await prisma.user.count();

    res.json({
      status: "OK",
      message: "Edulume server is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      allowedOrigins: getAllowedOrigins(),
      database: "Connected",
      userCount,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Server health check failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      database: "Disconnected",
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Edulume server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Allowed origins: ${getAllowedOrigins().join(", ")}`);
  console.log(`🔐 Make sure to set your environment variables in server/.env`);
});

export default app;
export { io };
