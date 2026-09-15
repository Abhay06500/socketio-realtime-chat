import assert from "node:assert/strict";
import test from "node:test";
import { mergeChatUsers, updateChatUsersFromMessage } from "./chatUsers.js";

const me = { _id: "me", name: "Me" };
const amy = { _id: "amy", name: "Amy", email: "amy@example.com" };
const zoe = { _id: "zoe", name: "Zoe", email: "zoe@example.com" };
const earlier = "2026-09-16T09:00:00.000Z";
const later = "2026-09-16T10:00:00.000Z";
const incoming = { sender: zoe, receiver: me, createdAt: later };

test("an incoming message moves an existing sender to the top", () => {
  const original = [amy, zoe];
  const result = updateChatUsersFromMessage(original, incoming, me._id);
  assert.deepEqual(result.map((person) => person._id), ["zoe", "amy"]);
  assert.deepEqual(original, [amy, zoe]);
});

test("a first message adds a new sender with their profile immediately", () => {
  const result = updateChatUsersFromMessage([amy], incoming, me._id);
  assert.equal(result[0].name, "Zoe");
  assert.equal(result[0].email, zoe.email);
  assert.equal(result.length, 2);
});

test("repeated events do not duplicate users or move older activity above newer activity", () => {
  let result = updateChatUsersFromMessage([amy], incoming, me._id);
  result = updateChatUsersFromMessage(result, incoming, me._id);
  result = updateChatUsersFromMessage(result, {
    sender: amy, receiver: me, createdAt: earlier
  }, me._id);
  assert.deepEqual(result.map((person) => person._id), ["zoe", "amy"]);
});

test("a fetch completing after a live message preserves its sender and timestamp", () => {
  const live = updateChatUsersFromMessage([amy], incoming, me._id);
  assert.equal(mergeChatUsers(live, [amy])[0]._id, "zoe");
  const result = mergeChatUsers(live, [amy, { ...zoe, lastMessageAt: earlier }]);
  assert.equal(result[0]._id, "zoe");
  assert.equal(result[0].lastMessageAt, later);
});

test("sent messages move the recipient up and ID-only events retain profile details", () => {
  const result = updateChatUsersFromMessage([amy, zoe], {
    sender: me._id, receiver: zoe._id, createdAt: later
  }, me._id);
  assert.equal(result[0]._id, "zoe");
  assert.equal(result[0].name, "Zoe");
});

test("messages from unrelated conversations do not change the list", () => {
  const users = [amy, zoe];
  assert.equal(updateChatUsersFromMessage(users, {
    sender: amy, receiver: zoe, createdAt: later
  }, me._id), users);
});

test("initial loading sorts conversations by activity and other users by name", () => {
  const result = mergeChatUsers([], [
    { _id: "ben", name: "Ben" },
    amy,
    { ...zoe, lastMessageAt: later }
  ]);
  assert.deepEqual(result.map((person) => person._id), ["zoe", "amy", "ben"]);
});
