const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/stayease');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Do not crash the server in case MongoDB is not running locally yet,
    // allowing the user to see the UI and mock features if needed.
    console.log('Server will continue running. Ensure MongoDB is running to persist data.');
  }
};

module.exports = connectDB;
