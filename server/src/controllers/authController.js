import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate a JWT token for the authenticated user
function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Format the authentication response
function authResponse(user, token) {
  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email
    }
  };
}

// Register a new user
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Normalize email before saving or checking it
    const normalizedEmail = email.trim().toLowerCase();

    // Check whether the email is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    // Generate token and return registered user details
    const token = signToken(user._id.toString());
    return res.status(201).json(authResponse(user, token));
  } catch (error) {
    // Handle unexpected registration errors
    console.error("Register error:", error);
    return res.status(500).json({ message: "Unable to register user" });
  }
}

// Login an existing user
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user and include the password field for verification
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token and return authenticated user details
    const token = signToken(user._id.toString());
    return res.json(authResponse(user, token));
  } catch (error) {
    // Handle unexpected login errors
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}

// Return the currently authenticated user
export async function getMe(req, res) {
  return res.json({ user: req.user });
}