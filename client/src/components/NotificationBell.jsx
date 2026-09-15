import { useEffect, useRef, useState } from "react";

// Convert a date into a simple relative time format
function timeAgo(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClear
}) {
  // Control notification dropdown visibility
  const [open, setOpen] = useState(false);

  // Reference to detect clicks outside the notification menu
  const wrapperRef = useRef(null);

  // Count unread notifications
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  // Close the notification menu when clicking outside
  useEffect(() => {
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      {/* Notification bell button */}
      <button
        className="icon-button notification-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
      >
        <span aria-hidden="true">🔔</span>

        {/* Display unread notification count */}
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {/* Notification dropdown menu */}
      {open && (
        <div className="notification-menu">
          <div className="notification-header">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>

            {/* Mark all unread notifications as read */}
            {unreadCount > 0 && (
              <button
                className="link-button"
                type="button"
                onClick={onMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="notification-list">
            {notifications.length === 0 && (
              <div className="notification-empty">
                No notifications yet.
              </div>
            )}

            {notifications.map((notification) => (
              <button
                className={`notification-item ${
                  notification.isRead ? "" : "unread"
                }`}
                key={notification._id}
                type="button"
                onClick={() => onMarkRead(notification._id)}
              >
                {/* Display sender's initial */}
                <span className="notification-avatar">
                  {notification.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>

                {/* Display notification details */}
                <span className="notification-copy">
                  <strong>{notification.sender?.name || "User"}</strong>
                  <span>{notification.text}</span>
                  <small>{timeAgo(notification.createdAt)}</small>
                </span>
              </button>
            ))}
          </div>

          {/* Clear all notifications */}
          {notifications.length > 0 && (
            <button
              className="clear-button"
              type="button"
              onClick={onClear}
            >
              Clear notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}