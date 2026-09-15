export default function UserList({
  users,
  selectedUser,
  onlineUsers,
  unreadCounts,
  onSelectUser,
  loading
}) {
  return (
    <aside className={`sidebar ${selectedUser ? "sidebar-mobile-hidden" : ""}`}>
      {/* Sidebar heading */}
      <div className="sidebar-heading">
        <div>
          <p className="eyebrow">People</p>
          <h2>Chats</h2>
        </div>

        {/* Display total number of users */}
        <span className="user-count">{users.length}</span>
      </div>

      {/* User list */}
      <div className="user-list">
        {/* Show loading state while users are being fetched */}
        {loading && <p className="muted padded">Loading users...</p>}

        {/* Show empty state when no other users are available */}
        {!loading && users.length === 0 && (
          <div className="empty-card">
            <strong>No other users yet</strong>
            <span>Create another account to test one-to-one chat.</span>
          </div>
        )}

        {users.map((person) => {
          // Check online, selected, and unread message states
          const isOnline = onlineUsers.includes(person._id);
          const isSelected = selectedUser?._id === person._id;
          const unreadCount = unreadCounts[person._id] || 0;

          return (
            <button
              className={`user-row ${isSelected ? "selected" : ""} ${
                unreadCount > 0 ? "has-unread" : ""
              }`}
              key={person._id}
              onClick={() => onSelectUser(person)}
              type="button"
            >
              {/* Display user's initial */}
              <div className="avatar">
                {person.name.charAt(0).toUpperCase()}
              </div>

              {/* Display user information */}
              <div className="user-meta">
                <strong>{person.name}</strong>
                <span>{person.email}</span>
              </div>

              <div className="user-row-actions">
                {/* Display unread message count */}
                {unreadCount > 0 && (
                  <span
                    className="unread-message-count"
                    aria-label={`${unreadCount} unread ${
                      unreadCount === 1 ? "message" : "messages"
                    }`}
                    title={`${unreadCount} unread ${
                      unreadCount === 1 ? "message" : "messages"
                    }`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

                {/* Display online or offline status */}
                <span
                  className={`status-dot ${isOnline ? "online" : ""}`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}