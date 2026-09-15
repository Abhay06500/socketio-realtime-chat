import User from "../models/User.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

// Get all users except the currently authenticated user
export async function getUsers(req, res) {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const [users, activity] = await Promise.all([
      User.find({ _id: { $ne: req.userId } })
        .select("_id name email createdAt")
        .lean(),
      Message.aggregate([
        { $match: { $or: [{ sender: currentUserId }, { receiver: currentUserId }] } },
        {
          $group: {
            _id: {
              $cond: [{ $eq: ["$sender", currentUserId] }, "$receiver", "$sender"]
            },
            lastMessageAt: { $max: "$createdAt" }
          }
        }
      ])
    ]);

    const lastMessageByUser = new Map(
      activity.map((item) => [item._id.toString(), item.lastMessageAt])
    );

    for (const person of users) {
      person.lastMessageAt = lastMessageByUser.get(person._id.toString()) || null;
    }

    users.sort((a, b) =>
      (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0) ||
      a.name.localeCompare(b.name)
    );

    return res.json({ users });
  } catch (error) {
    // Handle user fetch errors
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Unable to fetch users" });
  }
}
