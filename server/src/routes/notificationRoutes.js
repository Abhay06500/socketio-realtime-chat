import express from "express";
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationsFromSenderRead,
  markNotificationRead
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllNotificationsRead);
router.patch("/read-from/:senderId", protect, markNotificationsFromSenderRead);
router.patch("/:id/read", protect, markNotificationRead);
router.delete("/", protect, clearNotifications);

export default router;
