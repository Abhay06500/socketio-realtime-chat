import { connectDB } from "../config/db.js";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/User.js";
import { createChatRoom, createUserRoom } from "../utils/chatRoom.js";

// Initialize the Socket.IO server
export function initializeSocket(httpServer) {
  // Read and format allowed frontend origins
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  // Create Socket.IO server with CORS configuration
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true
    }
  });

  // Store connected socket IDs for each user
  const userSockets = new Map();

  // Add a socket connection for a user
  function addUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId) || new Set();
    sockets.add(socketId);
    userSockets.set(userId, sockets);
  }

  // Remove a socket connection for a user
  function removeUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId);

    if (!sockets) return;

    sockets.delete(socketId);

    // Remove the user when no active sockets remain
    if (sockets.size === 0) {
      userSockets.delete(userId);
    } else {
      userSockets.set(userId, sockets);
    }
  }

  // Send the list of online users to all connected clients
  function emitOnlineUsers() {
    io.emit("online_users", Array.from(userSockets.keys()));
  }

  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      await connectDB();
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      // Verify the token and find the authenticated user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id name email");

      if (!user) {
        return next(new Error("User not found"));
      }

      // Attach user information to the socket
      socket.userId = user._id.toString();
      socket.user = user;

      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  // Handle new socket connections
  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Join the user's private room
    socket.join(createUserRoom(userId));

    // Track the connected socket
    addUserSocket(userId, socket.id);

    // Update all clients with the latest online users
    emitOnlineUsers();

    console.log(`Socket connected: ${socket.id} (${socket.user.email})`);

    // Join the user's private room manually
    socket.on("join_user", (ack) => {
      socket.join(createUserRoom(userId));

      if (typeof ack === "function") {
        ack({ ok: true, room: createUserRoom(userId) });
      }
    });

    // Join a private chat room with another user
    socket.on("join_chat", ({ otherUserId }, ack) => {
      try {
        if (!otherUserId) {
          if (typeof ack === "function") ack({ ok: false, message: "otherUserId is required" });
          return;
        }

        // Leave the previously active chat room
        if (socket.currentChatRoom) {
          socket.leave(socket.currentChatRoom);
        }

        // Create and join the chat room
        const room = createChatRoom(userId, otherUserId);
        socket.join(room);
        socket.currentChatRoom = room;

        if (typeof ack === "function") {
          ack({ ok: true, room });
        }
      } catch {
        if (typeof ack === "function") ack({ ok: false, message: "Unable to join chat" });
      }
    });

    // Leave the currently active chat room
    socket.on("leave_chat", () => {
      if (socket.currentChatRoom) {
        socket.leave(socket.currentChatRoom);
        socket.currentChatRoom = null;
      }
    });

    // Handle socket disconnection
    socket.on("disconnect", (reason) => {
      removeUserSocket(userId, socket.id);
      emitOnlineUsers();

      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  // Return the initialized Socket.IO instance
  return io;
}