import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import User from "../models/User.js";
import { createChatRoom, createUserRoom } from "../utils/chatRoom.js";

export function initializeSocket(httpServer) {
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim());

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true
    }
  });

  const userSockets = new Map();

  function addUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId) || new Set();
    sockets.add(socketId);
    userSockets.set(userId, sockets);
  }

  function removeUserSocket(userId, socketId) {
    const sockets = userSockets.get(userId);

    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
      userSockets.delete(userId);
    } else {
      userSockets.set(userId, sockets);
    }
  }

  function emitOnlineUsers() {
    io.emit("online_users", Array.from(userSockets.keys()));
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id name email");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    socket.join(createUserRoom(userId));
    addUserSocket(userId, socket.id);
    emitOnlineUsers();

    console.log(`Socket connected: ${socket.id} (${socket.user.email})`);

    socket.on("join_user", (ack) => {
      socket.join(createUserRoom(userId));

      if (typeof ack === "function") {
        ack({ ok: true, room: createUserRoom(userId) });
      }
    });

    socket.on("join_chat", ({ otherUserId }, ack) => {
      try {
        if (!otherUserId) {
          if (typeof ack === "function") ack({ ok: false, message: "otherUserId is required" });
          return;
        }

        if (socket.currentChatRoom) {
          socket.leave(socket.currentChatRoom);
        }

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

    socket.on("leave_chat", () => {
      if (socket.currentChatRoom) {
        socket.leave(socket.currentChatRoom);
        socket.currentChatRoom = null;
      }
    });

    socket.on("disconnect", (reason) => {
      removeUserSocket(userId, socket.id);
      emitOnlineUsers();
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
