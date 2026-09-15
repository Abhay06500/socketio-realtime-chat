import mongoose from "mongoose";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { createUserRoom } from "../utils/chatRoom.js";

// Return the message history between the authenticated user and another user.
export async function getConversation(req, res) {
  try {
    const otherUserId = req.params.userId;

    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    // Include both directions of the conversation, ordered oldest first.
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: req.userId }
      ]
    })
      .populate("sender", "_id name email")
      .populate("receiver", "_id name email")
      .sort({ createdAt: 1 });

    return res.json({ messages });
  } catch (error) {
    console.error("Get conversation error:", error);
    return res.status(500).json({ message: "Unable to fetch messages" });
  }
}

// Save a message and notify the recipient in real time.
export async function sendMessage(req, res) {
  try {
    const { receiverId, text } = req.body;
    const cleanText = text?.trim();

    // Validate the recipient and message before writing to the database.
    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver" });
    }

    if (receiverId === req.userId) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    if (!cleanText) {
      return res.status(400).json({ message: "Message text is required" });
    }

    if (cleanText.length > 2000) {
      return res.status(400).json({ message: "Message must be 2000 characters or less" });
    }

    const receiver = await User.findById(receiverId).select("_id name email");

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    let message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      text: cleanText
    });

    // Include user details for the response and real-time message event.
    message = await Message.findById(message._id)
      .populate("sender", "_id name email")
      .populate("receiver", "_id name email");

    // Store the notification so it remains available when the recipient reconnects.
    let notification = await Notification.create({
      user: receiverId,
      sender: req.userId,
      message: message._id,
      text: `${req.user.name} sent you a message`
    });

    notification = await Notification.findById(notification._id)
      .populate("sender", "_id name email")
      .populate("message", "_id text sender receiver createdAt");

    const io = req.app.get("io");
    // Deliver messages to both participants, including those viewing another chat.
    io.to(createUserRoom(req.userId))
      .to(createUserRoom(receiverId))
      .emit("receive_message", message);
    io.to(createUserRoom(receiverId)).emit("new_notification", notification);

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Unable to send message" });
  }
}
