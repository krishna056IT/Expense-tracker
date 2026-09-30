const mongoose = require("mongoose");

const PasswordResetSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    resetCodeHash: {
      type: String,
      required: true,
    },

    resetCodeExpires: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PasswordReset", PasswordResetSchema);