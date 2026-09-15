import mongoose from "mongoose";

let connectionPromise = null;

export async function connectDB() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  // Reuse the same pending connection
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        maxIdleTimeMS: 60000
      })
      .then((mongooseInstance) => {
        console.log(
          `MongoDB connected: ${mongooseInstance.connection.host}`
        );

        return mongooseInstance.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}