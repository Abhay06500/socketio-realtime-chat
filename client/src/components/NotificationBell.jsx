import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

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
      <button
        className="icon-button notification-button"
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-menu">
          <div className="notification-header">
            <div>
              <strong>Notifications</strong>
              <span>{unreadCount} unread</span>
            </div>

            {unreadCount > 0 && (
              <button className="link-button" type="button" onClick={onMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 && (
              <div className="notification-empty">No notifications yet.</div>
            )}

            {notifications.map((notification) => (
              <button
                className={`notification-item ${notification.isRead ? "" : "unread"}`}
                key={notification._id}
                type="button"
                onClick={() => onMarkRead(notification._id)}
              >
                <span className="notification-avatar">
                  {notification.sender?.name?.charAt(0)?.toUpperCase() || "?"}
                </span>

                <span className="notification-copy">
                  <strong>{notification.sender?.name || "User"}</strong>
                  <span>{notification.text}</span>
                  <small>{timeAgo(notification.createdAt)}</small>
                </span>
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <button className="clear-button" type="button" onClick={onClear}>
              Clear notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}
