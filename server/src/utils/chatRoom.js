// Create a unique chat room ID for two users
export function createChatRoom(userA, userB) {
  return `chat:${[userA.toString(), userB.toString()].sort().join(":")}`;
}

// Create a private room ID for a specific user
export function createUserRoom(userId) {
  return `user:${userId.toString()}`;
}