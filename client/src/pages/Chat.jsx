import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import NotificationBell from "../components/NotificationBell";
import UserList from "../components/UserList";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { mergeChatUsers, updateChatUsersFromMessage } from "../utils/chatUsers";

// Return the ID from either a populated object or direct ID value
function getEntityId(value) {
  return typeof value === "object" ? value?._id : value;
}

export default function Chat() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers, connectionError } = useSocket();

  // Store available users and the currently selected chat user
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);

  // Store chat messages and notifications
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Track loading and sending states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Store page-level error messages
  const [pageError, setPageError] = useState("");

  // Keep the selected user reference updated for socket events
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch all available users
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const { data } = await api.get("/users");
      setUsers((current) => mergeChatUsers(current, data.users));
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch notifications for the current user
  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to load notifications");
    }
  }, []);

  // Load initial users and notifications
  useEffect(() => {
    loadUsers();
    loadNotifications();
  }, [loadUsers, loadNotifications]);

  // Calculate unread notification counts for each sender
  const unreadCounts = useMemo(
    () =>
      notifications.reduce((counts, notification) => {
        if (notification.isRead) return counts;

        const senderId = getEntityId(notification.sender);

        if (senderId) {
          counts[senderId] = (counts[senderId] || 0) + 1;
        }

        return counts;
      }, {}),
    [notifications]
  );

  // Mark all notifications from a specific sender as read
  const markNotificationsFromSenderRead = useCallback(async (senderId) => {
    if (!senderId) return;

    // Update notification state immediately
    setNotifications((current) =>
      current.map((item) =>
        !item.isRead && getEntityId(item.sender) === senderId
          ? { ...item, isRead: true }
          : item
      )
    );

    try {
      await api.patch(`/notifications/read-from/${senderId}`);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to update notifications");
      loadNotifications();
    }
  }, [loadNotifications]);

  // Listen for real-time messages and notifications
  useEffect(() => {
    if (!socket) return;

    // Handle incoming chat messages
    function handleMessage(message) {
      // Update the sidebar even when no conversation is open.
      setUsers((current) => updateChatUsersFromMessage(current, message, user._id));

      const senderId = getEntityId(message.sender);
      const receiverId = getEntityId(message.receiver);

      const otherUser = selectedUserRef.current;

      if (!otherUser) return;

      // Check whether the message belongs to the currently open chat
      const belongsToOpenChat =
        [senderId, receiverId].includes(user._id) &&
        [senderId, receiverId].includes(otherUser._id);

      if (!belongsToOpenChat) return;

      // Add the message only if it does not already exist
      setMessages((current) => {
        if (current.some((item) => item._id === message._id)) {
          return current;
        }

        return [...current, message];
      });
    }

    // Handle incoming notifications
    function handleNotification(notification) {
      const senderId = getEntityId(notification.sender);

      if (notification.message) {
        setUsers((current) => updateChatUsersFromMessage(current, {
          ...notification.message,
          sender: notification.sender
        }, user._id));
      }

      // Add the notification only if it does not already exist
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }

        return [notification, ...current];
      });

      // Mark notification as read when that sender's chat is already open
      if (senderId && senderId === selectedUserRef.current?._id) {
        markNotificationsFromSenderRead(senderId);
      }
    }

    socket.on("receive_message", handleMessage);
    socket.on("new_notification", handleNotification);

    // Remove socket event listeners on cleanup
    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("new_notification", handleNotification);
    };
  }, [socket, user._id, markNotificationsFromSenderRead]);

  // Join the selected user's chat room
  useEffect(() => {
    if (!socket || !selectedUser) return;

    socket.emit("join_chat", { otherUserId: selectedUser._id });

    // Leave the chat room when the selected user changes
    return () => {
      socket.emit("leave_chat");
    };
  }, [socket, selectedUser?._id]);

  // Select a user and load the conversation
  async function selectUser(person) {
    setSelectedUser(person);
    setMessages([]);
    setLoadingMessages(true);
    setPageError("");

    // Mark notifications from the selected user as read
    markNotificationsFromSenderRead(person._id);

    try {
      const { data } = await api.get(`/messages/${person._id}`);
      setMessages(data.messages);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to load conversation");
    } finally {
      setLoadingMessages(false);
    }
  }

  // Close the current chat
  function closeChat() {
    socket?.emit("leave_chat");
    setSelectedUser(null);
    setMessages([]);
  }

  // Send a message to the selected user
  async function sendMessage(text) {
    if (!selectedUser) return false;

    setSending(true);
    setPageError("");

    try {
      const { data } = await api.post("/messages", {
        receiverId: selectedUser._id,
        text
      });

      setUsers((current) => updateChatUsersFromMessage(current, data.message, user._id));

      // Add the sent message if it does not already exist
      setMessages((current) => {
        if (current.some((item) => item._id === data.message._id)) {
          return current;
        }

        return [...current, data.message];
      });

      return true;
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to send message");
      return false;
    } finally {
      setSending(false);
    }
  }

  // Mark a single notification as read
  async function markNotificationRead(id) {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);

      setNotifications((current) =>
        current.map((item) => (item._id === id ? data.notification : item))
      );
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to update notification");
    }
  }

  // Mark all notifications as read
  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true
        }))
      );
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to update notifications");
    }
  }

  // Delete all notifications
  async function clearNotifications() {
    try {
      await api.delete("/notifications");
      setNotifications([]);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to clear notifications");
    }
  }

  return (
    <main className="app-shell">
      {/* Application top navigation */}
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark compact">RC</div>
          <div>
            <strong>Realtime Chat</strong>
          </div>
        </div>

        <div className="topbar-actions">
          {/* Display socket connection status */}
          {connectionError && <span className="socket-error">Socket offline</span>}

          {/* Notification menu */}
          <NotificationBell
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllRead}
            onClear={clearNotifications}
          />

          {/* Current user information */}
          <div className="profile-chip">
            <div className="avatar tiny">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          {/* Logout button */}
          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* Display page-level errors */}
      {pageError && (
        <button
          className="page-error"
          type="button"
          onClick={() => setPageError("")}
        >
          {pageError} <span>×</span>
        </button>
      )}

      {/* Main chat workspace */}
      <section className="workspace">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          onSelectUser={selectUser}
          loading={loadingUsers}
        />

        {/* Show loading state while fetching conversation */}
        {loadingMessages && selectedUser ? (
          <section className="chat-empty">
            <p>Loading conversation...</p>
          </section>
        ) : (
          <ChatWindow
            currentUser={user}
            selectedUser={selectedUser}
            messages={messages}
            onSend={sendMessage}
            onBack={closeChat}
            sending={sending}
            isOnline={
              selectedUser ? onlineUsers.includes(selectedUser._id) : false
            }
          />
        )}
      </section>
    </main>
  );
}
