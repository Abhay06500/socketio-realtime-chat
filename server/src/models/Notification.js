import mongoose from "mongoose";

// Define the schema for user notifications
const notificationSchema = new mongoose.Schema(
  {
    // User who receives the notification
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // User who triggered the notification
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Related message for the notification
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true
    },

    // Notification text
    text: {
      type: String,
      required: true
    },

    // Track whether the notification has been read
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

// Improve notification query performance
notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);