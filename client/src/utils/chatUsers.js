function activityTime(person) {
  return Date.parse(person.lastMessageAt) || 0;
}

// Merge fetched users with live updates without losing newer message activity.
export function mergeChatUsers(current, incoming) {
  const users = new Map(current.map((person) => [person._id, person]));

  for (const person of incoming) {
    if (!person?._id) continue;

    const existing = users.get(person._id);
    users.set(person._id, {
      ...existing,
      ...person,
      lastMessageAt: activityTime(existing || {}) > activityTime(person)
        ? existing.lastMessageAt
        : person.lastMessageAt
    });
  }

  return [...users.values()].sort((a, b) =>
    activityTime(b) - activityTime(a) || a.name.localeCompare(b.name)
  );
}

export function updateChatUsersFromMessage(users, message, currentUserId) {
  const senderId = message.sender?._id || message.sender;
  const receiverId = message.receiver?._id || message.receiver;
  if (senderId !== currentUserId && receiverId !== currentUserId) return users;

  const participant = senderId === currentUserId ? message.receiver : message.sender;
  const person = typeof participant === "object"
    ? participant
    : users.find((item) => item._id === participant);

  if (!person?._id || person._id === currentUserId) return users;

  return mergeChatUsers(users, [{ ...person, lastMessageAt: message.createdAt }]);
}
