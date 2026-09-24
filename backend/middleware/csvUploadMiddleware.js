const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (isCsv) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

module.exports = upload;