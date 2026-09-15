export function createChatRoom(userA, userB) {
  return `chat:${[userA.toString(), userB.toString()].sort().join(":")}`;
}

export function createUserRoom(userId) {
  return `user:${userId.toString()}`;
}
