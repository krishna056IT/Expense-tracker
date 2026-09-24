const express = require("express");
const { analyzeImage } = require("../controllers/ocrController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/analyze", protect, upload.single("image"), analyzeImage);

module.exports = router;
