import express from "express";
import { getConversation, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get conversation with a specific user
router.get("/:userId", protect, getConversation);

// Send a new message
router.post("/", protect, sendMessage);

export default router;