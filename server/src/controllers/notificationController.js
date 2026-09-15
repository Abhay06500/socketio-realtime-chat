import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// Get all notifications for the authenticated user
export async function getNotifications(req, res) {
  try {
    // Fetch notifications with related sender and message details
    const notifications = await Notification.find({ user: req.userId })
      .populate("sender", "_id name email")
      .populate("message", "_id text sender receiver createdAt")
      .sort({ createdAt: -1 });

    return res.json({ notifications });
  } catch (error) {
    // Handle notification fetch errors
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Unable to fetch notifications" });
  }
}

// Mark a single notification as read
export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;

    // Validate notification ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    // Update the notification and return its latest data
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.userId },
      { isRead: true },
      { new: true }
    )
      .populate("sender", "_id name email")
      .populate("message", "_id text sender receiver createdAt");

    // Return an error if the notification does not exist
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification });
  } catch (error) {
    // Handle notification update errors
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Unable to update notification" });
  }
}

// Mark all notifications from a specific sender as read
export async function markNotificationsFromSenderRead(req, res) {
  try {
    const { senderId } = req.params;

    // Validate sender ID
    if (!mongoose.isValidObjectId(senderId)) {
      return res.status(400).json({ message: "Invalid sender id" });
    }

    // Update all unread notifications from the selected sender
    const result = await Notification.updateMany(
      { user: req.userId, sender: senderId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({
      message: "Sender notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    // Handle bulk notification update errors
    console.error("Mark sender notifications read error:", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
}

// Mark all notifications as read
export async function markAllNotificationsRead(req, res) {
  try {
    // Update all unread notifications for the authenticated user
    await Notification.updateMany(
      { user: req.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    // Handle notification update errors
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({ message: "Unable to update notifications" });
  }
}

// Delete all notifications for the authenticated user
export async function clearNotifications(req, res) {
  try {
    // Remove all notifications belonging to the user
    await Notification.deleteMany({ user: req.userId });

    return res.json({ message: "Notifications cleared" });
  } catch (error) {
    // Handle notification deletion errors
    console.error("Clear notifications error:", error);
    return res.status(500).json({ message: "Unable to clear notifications" });
  }
}