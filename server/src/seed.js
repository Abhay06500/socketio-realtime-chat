import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

if (!process.env.MONGO_URI) {
  console.error("Missing MONGO_URI in server/.env");
  process.exit(1);
}

await connectDB();

const demoUsers = [
  {
    name: "Demo User One",
    email: "demo1@example.com",
    password: "Demo123!"
  },
  {
    name: "Demo User Two",
    email: "demo2@example.com",
    password: "Demo123!"
  }
];

for (const demo of demoUsers) {
  const hashedPassword = await bcrypt.hash(demo.password, 12);

  await User.findOneAndUpdate(
    { email: demo.email },
    {
      name: demo.name,
      email: demo.email,
      password: hashedPassword
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

console.log("Demo users created/updated:");
for (const demo of demoUsers) {
  console.log(`${demo.email} / ${demo.password}`);
}

await mongoose.disconnect();
