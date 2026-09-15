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

// Ensure required environment variables are available
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("Missing MONGO_URI or JWT_SECRET in server/.env");
  process.exit(1);
}

// Connect to MongoDB before starting the server
await connectDB();

// Create the Express application and HTTP server
const app = express();
const server = http.createServer(app);

// Read and format allowed frontend origins
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

// Enable CORS for allowed frontend origins
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "1mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "realtime-chat-server" });
});

// Register application routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Handle unexpected server errors
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ message: "Internal server error" });
});

// Initialize Socket.IO with the HTTP server
const io = initializeSocket(server);

// Make the Socket.IO instance available inside controllers
app.set("io", io);

// Set the server port
const PORT = process.env.PORT || 5000;

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});