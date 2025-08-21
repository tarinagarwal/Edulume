import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.js";
import pdfRoutes from "./routes/pdfs.js";
import ebookRoutes from "./routes/ebooks.js";
import uploadRoutes from "./routes/upload.js";
import discussionRoutes from "./routes/discussions.js";
import imageRoutes from "./routes/images.js";
import { setupSocketHandlers } from "./socket/socketHandlers.js";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Determine allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [];

  // Always allow localhost for development
  origins.push("http://localhost:5173");

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

// Make io available to routes
app.set("io", io);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pdfs", pdfRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/images", imageRoutes);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AlienVault server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    allowedOrigins: getAllowedOrigins(),
  });
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
  console.log(`🚀 AlienVault server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Allowed origins: ${getAllowedOrigins().join(", ")}`);
  console.log(`🔐 Make sure to set your environment variables in server/.env`);
});

export default app;
export { io };
