// Establishes a Mongoose connection to MongoDB Atlas.
// Called once at server startup; the app will not start if connection fails.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit the process so the platform (Render, PM2, etc.) can restart it
    process.exit(1);
  }
};

module.exports = connectDB;
