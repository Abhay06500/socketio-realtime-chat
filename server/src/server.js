import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initializeSocket } from "./socket/index.js";

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  throw new Error("Missing MONGO_URI or JWT_SECRET");
}

await connectDB();

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
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// Root route - opening backend URL will now show this
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Realtime Chat Backend is running",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "realtime-chat-server",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Socket.IO
const io = initializeSocket(server);
app.set("io", io);

// 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

// Only listen manually when running locally.
// Vercel manages the server in production.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Vercel uses this HTTP server for Express + Socket.IO
export default server;