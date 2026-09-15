import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { API_URL } from "../services/api";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [connectionError, setConnectionError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setSocket(null);
      setOnlineUsers([]);
      return;
    }

    const nextSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setConnectionError("");
      nextSocket.emit("join_user", () => {});
    });

    nextSocket.on("connect_error", (error) => {
      setConnectionError(error.message || "Socket connection failed");
    });

    nextSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      nextSocket.removeAllListeners();
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated, token]);

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

export function useSocket() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket must be used inside SocketProvider");
  }

  return context;
}
