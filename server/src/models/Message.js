import mongoose from "mongoose";

// Define the schema for chat messages
const messageSchema = new mongoose.Schema(
  {
    // User who sends the message
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // User who receives the message
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Message content
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    // Track whether the message has been read
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Improve conversation query performance
messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export default mongoose.model("Message", messageSchema);