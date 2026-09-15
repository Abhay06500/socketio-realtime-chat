import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect private routes using JWT authentication
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Check that the authorization header contains a Bearer token
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    // Extract and verify the JWT token
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the authenticated user
    const user = await User.findById(decoded.userId).select("_id name email");

    // Reject the request if the user no longer exists
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Attach user information to the request
    req.user = user;
    req.userId = user._id.toString();

    // Continue to the next middleware or controller
    next();
  } catch (error) {
    // Handle invalid or expired tokens
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}