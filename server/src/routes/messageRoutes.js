import express from "express";
import { getConversation, sendMessage } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, getConversation);
router.post("/", protect, sendMessage);

export default router;
