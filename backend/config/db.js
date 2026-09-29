const mongoose = require("mongoose");

const connectToDb = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    console.log(`Database: ${mongoose.connection.name}`);
};

module.exports = connectToDb;