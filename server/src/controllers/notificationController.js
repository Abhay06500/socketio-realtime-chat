import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .populate("sender", "_id name email")
      .populate("message", "_id text sender receiver createdAt")
      .sort({ createdAt: -1 });

    return res.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Unable to fetch notifications" });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.userId },
      { isRead: true },
      { new: true }
    )
      .populate("sender", "_id name email")
      .populate("message", "_id text sender receiver createdAt");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Unable to update notification" });
  }
}

export async function markNotificationsFromSenderRead(req, res) {
  try {
    const { senderId } = req.params;

    if (!mongoose.isValidObjectId(senderId)) {
      return res.status(400).json({ message: "Invalid sender id" });
    }

    const result = await Notification.updateMany(
      { user: req.userId, sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      message: "Sender notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Mark sender notifications read error:", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    await Notification.updateMany(
      { user: req.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
}

export async function clearNotifications(req, res) {
  try {
    await Notification.deleteMany({ user: req.userId });
    return res.json({ message: "Notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    return res.status(500).json({ message: "Unable to clear notifications" });
  }
}
