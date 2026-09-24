const express = require("express");
const { importCSV } = require("../controllers/csvController");
const { protect } = require("../middleware/authMiddleware");
const uploadCSV = require("../middleware/csvUploadMiddleware");

const router = express.Router();

router.post(
  "/import",
  protect,
  uploadCSV.single("file"),
  importCSV
);

module.exports = router;