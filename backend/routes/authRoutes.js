const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  registerUser,
  loginUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  getUserInfo,
  updateUserProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);

router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

router.get("/getUser", protect, getUserInfo);
router.put("/profile", protect, updateUserProfile);

router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.status(200).json({imageUrl});
});

module.exports = router;
