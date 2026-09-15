import { useEffect, useRef, useState } from "react";

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
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    setText("");
  }, [selectedUser?._id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanText = text.trim();

    if (!cleanText || sending) return;

    const sent = await onSend(cleanText);

    if (sent) {
      setText("");
    }
  }

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
      <header className="chat-header">
        <button className="back-button" type="button" onClick={onBack}>
          ←
        </button>

        <div className="avatar small">
          {selectedUser.name.charAt(0).toUpperCase()}
        </div>

        <div className="chat-user">
          <strong>{selectedUser.name}</strong>
          <span className={isOnline ? "online-text" : ""}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="conversation-start">
            <span>Start your conversation with {selectedUser.name}.</span>
          </div>
        )}

        {messages.map((message) => {
          const senderId =
            typeof message.sender === "object" ? message.sender?._id : message.sender;
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

        <div ref={endRef} />
      </div>

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
