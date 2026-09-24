const mongoose = require("mongoose");

const connectToDb = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully");
};

module.exports = connectToDb;