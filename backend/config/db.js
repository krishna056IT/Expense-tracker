const mongoose = require("mongoose");

const connectToDb = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("MongoDB connected");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("MONGODB_CONNECTION_FAILED", {
      message: error.message,
    });
    throw error;
  }
};

module.exports = connectToDb;