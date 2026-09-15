import mongoose from "mongoose";

// Connect to the MongoDB database
export async function connectDB() {
  try {
    // Establish connection using the MongoDB URI from environment variables
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log the connected database host
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error and stop the application if the connection fails
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}