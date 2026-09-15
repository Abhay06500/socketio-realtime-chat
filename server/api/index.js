import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "http";
import { connectDB } from "../src/config/db.js";
import authRoutes from "../src/routes/authRoutes.js";
import userRoutes from "../src/routes/userRoutes.js";
import messageRoutes from "../src/routes/messageRoutes.js";
import notificationRoutes from "../src/routes/notificationRoutes.js";
import { initializeSocket } from "../src/socket/index.js";

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

const io = initializeSocket(server);

app.set("io", io);

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);

  res.status(500).json({
    message: "Internal server error",
  });
});

export default server;