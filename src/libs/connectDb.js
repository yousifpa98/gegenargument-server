// connectDb.js
import mongoose from "mongoose";

/**
 * Connects to MongoDB using environment variables
 * Includes reconnection logic, error handling, and connection monitoring
 *
 * @param {number} retryAttempt - Current retry attempt (internal use)
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
export const connectDb = async (retryAttempt = 0, maxRetries = 5) => {
  try {
    // Check if MongoDB URI is set in environment variables
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    // Connection options for MongoDB
    const options = {
      // Max number of reconnect attempts
      serverSelectionTimeoutMS: 30000,
      // Maintain up to 10 socket connections
      maxPoolSize: 10,
      // Set connection timeout to 30 seconds
      connectTimeoutMS: 30000,
      // Set socket timeout to 45 seconds
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    const connection = await mongoose.connect(mongoUri, options);

    // Set up connection event listeners
    mongoose.connection.on("connected", () => {
      console.log("MongoDB connection established successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
      // Don't exit process, let reconnection logic handle it
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB connection disconnected");
    });

    // Handle application termination and close the connection properly
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to application termination");
      process.exit(0);
    });

    // Extract host and database name for logging (without credentials)
    const dbInfo = mongoUri.split("@").pop();
    console.log(`Connected to MongoDB at ${dbInfo}`);
    return connection;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    // If this is a critical failure that should stop the application
    if (
      error.message.includes("MONGODB_URI environment variable is not defined")
    ) {
      throw error; // Rethrow critical configuration errors
    }

    // For other errors, we can implement a basic retry mechanism
    // Implement exponential backoff with maximum retry attempts
    if (retryAttempt < maxRetries) {
      const backoffTime = Math.min(1000 * Math.pow(2, retryAttempt), 30000); // Exponential backoff with 30s cap
      console.log(
        `Attempting to reconnect in ${backoffTime / 1000} seconds... (Attempt ${retryAttempt + 1}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffTime));
      return connectDb(retryAttempt + 1, maxRetries); // Recursive retry with backoff
    } else {
      console.error(
        `Failed to connect to MongoDB after ${maxRetries} attempts.`,
      );
      throw new Error(
        `MongoDB connection failed after ${maxRetries} attempts: ${error.message}`,
      );
    }
  }
};
