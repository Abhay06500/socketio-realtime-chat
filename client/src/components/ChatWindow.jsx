import { useEffect, useRef, useState } from "react";

// Format message timestamps into a readable time
function formatTime(dateValue) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(dateValue));
}

export default function ChatWindow({
  currentUser,
  selectedUser,
  messages,
  onSend,
  onBack,
  sending,
  isOnline
}) {
  // Store the current message input
  const [text, setText] = useState("");

  // Reference to the end of the message list
  const endRef = useRef(null);

  // Clear the input when the selected user changes
  useEffect(() => {
    setText("");
  }, [selectedUser?._id]);

  // Scroll to the latest message when messages update
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message submission
  async function handleSubmit(event) {
    event.preventDefault();

    const cleanText = text.trim();

    // Prevent empty or duplicate submissions
    if (!cleanText || sending) return;

    const sent = await onSend(cleanText);

    // Clear the input after a successful send
    if (sent) {
      setText("");
    }
  }

  // Show an empty state when no user is selected
  if (!selectedUser) {
    return (
      <section className="chat-empty">
        <div className="empty-chat-illustration">💬</div>
        <h2>Select a user to start chatting</h2>
        <p>Messages and notifications update in real time with Socket.IO.</p>
      </section>
    );
  }

  return (
    <section className="chat-panel">
      {/* Chat header with selected user information */}
      <header className="chat-header">
        <button className="back-button" type="button" onClick={onBack}>
          ←
        </button>

        <div className="avatar small">
          {selectedUser.name.charAt(0).toUpperCase()}
        </div>

        <div className="chat-user">
          <strong>{selectedUser.name}</strong>

          {/* Display the selected user's online status */}
          <span className={isOnline ? "online-text" : ""}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      {/* Conversation message list */}
      <div className="messages">
        {messages.length === 0 && (
          <div className="conversation-start">
            <span>Start your conversation with {selectedUser.name}.</span>
          </div>
        )}

        {messages.map((message) => {
          // Get the sender ID whether sender is populated or stored as an ID
          const senderId =
            typeof message.sender === "object" ? message.sender?._id : message.sender;

          // Check whether the message belongs to the current user
          const mine = senderId === currentUser._id;

          return (
            <div className={`message-row ${mine ? "mine" : ""}`} key={message._id}>
              <div className="message-bubble">
                <p>{message.text}</p>
                <span>{formatTime(message.createdAt)}</span>
              </div>
            </div>
          );
        })}

        {/* Used for automatic scrolling to the latest message */}
        <div ref={endRef} />
      </div>

      {/* Message input form */}
      <form className="message-form" onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={`Message ${selectedUser.name}`}
          maxLength={2000}
          autoComplete="off"
        />

        <button type="submit" disabled={!text.trim() || sending}>
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </section>
  );
}