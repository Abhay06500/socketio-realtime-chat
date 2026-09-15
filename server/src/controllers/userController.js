import User from "../models/User.js";

// Get all users except the currently authenticated user
export async function getUsers(req, res) {
  try {
    // Fetch users and return only required fields
    const users = await User.find({ _id: { $ne: req.userId } })
      .select("_id name email createdAt")
      .sort({ name: 1 });

    return res.json({ users });
  } catch (error) {
    // Handle user fetch errors
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Unable to fetch users" });
  }
}