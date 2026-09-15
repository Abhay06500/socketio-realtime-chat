import express from "express";
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationsFromSenderRead
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications for the authenticated user
router.get("/", protect, getNotifications);

// Mark all notifications as read
router.patch("/read-all", protect, markAllNotificationsRead);

// Mark notifications from a specific sender as read
router.patch("/read-from/:senderId", protect, markNotificationsFromSenderRead);

// Mark a specific notification as read
router.patch("/:id/read", protect, markNotificationRead);

// Clear all notifications
router.delete("/", protect, clearNotifications);

export default router;