import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_URL } from "../services/api";

// Create Socket.IO context
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  // Store the active socket connection
  const [socket, setSocket] = useState(null);

  // Store IDs of currently online users
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Store socket connection errors
  const [connectionError, setConnectionError] = useState("");

  // Create and manage the socket connection
  useEffect(() => {
    // Reset socket state when the user is not authenticated
    if (!isAuthenticated || !token) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    // Create a new Socket.IO connection
    const nextSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    setSocket(nextSocket);

    // Handle successful socket connection
    nextSocket.on("connect", () => {
      setConnectionError("");
      nextSocket.emit("join_user", () => {});
    });

    // Handle socket connection errors
    nextSocket.on("connect_error", (error) => {
      setConnectionError(error.message || "Socket connection failed");
    });

    // Update the list of online users
    nextSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    // Clean up the socket connection
    return () => {
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

  // Memoize socket values shared through context
  const value = useMemo(
    () => ({
      socket,
      onlineUsers,
      connectionError,
      connected: Boolean(socket?.connected)
    }),
    [socket, onlineUsers, connectionError, socket?.connected]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// Custom hook for accessing Socket.IO context
export function useSocket() {
  const context = useContext(SocketContext);

  // Ensure the hook is used inside SocketProvider
  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}