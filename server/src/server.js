import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initializeSocket } from "./socket/index.js";

const app = express();
const server = http.createServer(app);

const allowedOrigins = (
  process.env.CLIENT_URL || "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

app.use(express.json({ limit: "1mb" }));

// This route does NOT require MongoDB.
// It lets us verify that the backend itself is running.
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "realtime-chat-server"
  });
});

// Connect to MongoDB only for routes that actually need it.
async function ensureDatabase(req, res, next) {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return res.status(503).json({
      message: "Database unavailable"
    });
  }
}

app.use("/api/auth", ensureDatabase, authRoutes);
app.use("/api/users", ensureDatabase, userRoutes);
app.use("/api/messages", ensureDatabase, messageRoutes);
app.use("/api/notifications", ensureDatabase, notificationRoutes);

// Socket.IO
const io = initializeSocket(server);
app.set("io", io);

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    message: "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});