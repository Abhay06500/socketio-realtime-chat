import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow";
import NotificationBell from "../components/NotificationBell";
import UserList from "../components/UserList";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";

function getEntityId(value) {
  return typeof value === "object" ? value?._id : value;
}

export default function Chat() {
  const { user, logout } = useAuth();
  const { socket, onlineUsers, connectionError } = useSocket();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const selectedUserRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);

    try {
      const { data } = await api.get("/users");
      setUsers(data.users);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      setPageError(error.response?.data?.message || "Unable to load notifications");
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadNotifications();
  }, [loadUsers, loadNotifications]);

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

  const markNotificationsFromSenderRead = useCallback(async (senderId) => {
    if (!senderId) return;

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

  useEffect(() => {
    if (!socket) return;

    function handleMessage(message) {
      const senderId = getEntityId(message.sender);
      const receiverId = getEntityId(message.receiver);

      const otherUser = selectedUserRef.current;

      if (!otherUser) return;

      const belongsToOpenChat =
        [senderId, receiverId].includes(user._id) &&
        [senderId, receiverId].includes(otherUser._id);

      if (!belongsToOpenChat) return;

      setMessages((current) => {
        if (current.some((item) => item._id === message._id)) {
          return current;
        }

        return [...current, message];
      });
    }

    function handleNotification(notification) {
      const senderId = getEntityId(notification.sender);

      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }

        return [notification, ...current];
      });

      if (senderId && senderId === selectedUserRef.current?._id) {
        markNotificationsFromSenderRead(senderId);
      }
    }

    socket.on("receive_message", handleMessage);
    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("new_notification", handleNotification);
    };
  }, [socket, user._id, markNotificationsFromSenderRead]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    socket.emit("join_chat", { otherUserId: selectedUser._id });

    return () => {
      socket.emit("leave_chat");
    };
  }, [socket, selectedUser?._id]);

  async function selectUser(person) {
    setSelectedUser(person);
    setMessages([]);
    setLoadingMessages(true);
    setPageError("");
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

  function closeChat() {
    socket?.emit("leave_chat");
    setSelectedUser(null);
    setMessages([]);
  }

  async function sendMessage(text) {
    if (!selectedUser) return false;

    setSending(true);
    setPageError("");

    try {
      const { data } = await api.post("/messages", {
        receiverId: selectedUser._id,
        text
      });

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
      <header className="topbar">
        <div className="brand-row">
          <div className="brand-mark compact">RC</div>
          <div>
            <strong>Realtime Chat</strong>
          </div>
        </div>

        <div className="topbar-actions">
          {connectionError && <span className="socket-error">Socket offline</span>}

          <NotificationBell
            notifications={notifications}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllRead}
            onClear={clearNotifications}
          />

          <div className="profile-chip">
            <div className="avatar tiny">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          <button className="secondary-button" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {pageError && (
        <button className="page-error" type="button" onClick={() => setPageError("")}>
          {pageError} <span>×</span>
        </button>
      )}

      <section className="workspace">
        <UserList
          users={users}
          selectedUser={selectedUser}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          onSelectUser={selectUser}
          loading={loadingUsers}
        />

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
            isOnline={selectedUser ? onlineUsers.includes(selectedUser._id) : false}
          />
        )}
      </section>
    </main>
  );
}
