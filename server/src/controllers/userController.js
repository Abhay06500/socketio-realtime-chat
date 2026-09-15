import User from "../models/User.js";

export async function getUsers(req, res) {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select("_id name email createdAt")
      .sort({ name: 1 });

    return res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Unable to fetch users" });
  }
}
