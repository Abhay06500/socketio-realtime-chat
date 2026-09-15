import mongoose from "mongoose";

// Define the schema for application users
const userSchema = new mongoose.Schema(
  {
    // User's display name
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },

    // User's unique email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Store the user's hashed password
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);