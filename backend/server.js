const ocrRoutes = require("./routes/ocrRoutes");
require("dotenv").config();


const express = require("express");
const cors = require("cors");
const path = require("path");
const connectToDb = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();
app.use("/api/ocr", ocrRoutes);
app.use(express.json());
const Port = process.env.PORT || 8000;
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

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
  res.send(`This is Home Route`);
});

app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);

connectToDb();

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(Port, () => {
  console.log(`server is running on Port http://localhost:${Port}`);
});


const csvRoutes = require("./routes/csvRoutes");
app.use("/api/csv", csvRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/expense", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/csv", csvRoutes);


