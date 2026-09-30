const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    profilePicUrl: {
      type: String,
      default: null,
    },

    verificationCodeHash: {
      type: String,
      required: true,
    },

    verificationCodeExpires: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingUser", PendingUserSchema);