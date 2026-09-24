require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectToDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const csvRoutes = require("./routes/csvRoutes");
const ocrRoutes = require("./routes/ocrRoutes");

const app = express();
app.use(express.json());
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://expense-tracker-smar.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (req, res) => {
  res.send("This is Home Route");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/csv", csvRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const port = process.env.PORT || 8000;

const startServer = async () => {
  await connectToDb();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});


