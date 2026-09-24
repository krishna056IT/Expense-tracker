const xlsx = require("xlsx");
const Expense = require("../models/Expense");
const Income = require("../models/Income");

exports.importCSV = async (req, res) => {
  const userId = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload a CSV file",
      });
    }

    // Read CSV directly from memory
    const workbook = xlsx.read(req.file.buffer, {
      type: "buffer",
    });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    if (!rows.length) {
      return res.status(400).json({
        message: "CSV file is empty",
      });
    }

    const expenses = [];
    const incomes = [];
    const errors = [];

    rows.forEach((row, index) => {
      const rowNumber = index + 2;

      const date = row.Date;
      const type = String(row.Type || "").trim().toLowerCase();
      const amount = Number(row.Amount);
      const category = String(row.Category || "").trim();
      const source = String(row.Source || "").trim();

      // Validate date
      if (!date || isNaN(new Date(date).getTime())) {
        errors.push(`Row ${rowNumber}: Invalid date`);
        return;
      }

      // Validate type
      if (type !== "income" && type !== "expense") {
        errors.push(
          `Row ${rowNumber}: Type must be Income or Expense`
        );
        return;
      }

      // Validate amount
      if (!amount || amount <= 0 || isNaN(amount)) {
        errors.push(
          `Row ${rowNumber}: Amount must be greater than 0`
        );
        return;
      }

      // Expense
      if (type === "expense") {
        if (!category) {
          errors.push(
            `Row ${rowNumber}: Category is required for expense`
          );
          return;
        }

        expenses.push({
          userId,
          category,
          amount,
          date: new Date(date),
        });
      }

      // Income
      if (type === "income") {
        if (!source) {
          errors.push(
            `Row ${rowNumber}: Source is required for income`
          );
          return;
        }

        incomes.push({
          userId,
          source,
          amount,
          date: new Date(date),
        });
      }
    });

    // If every row is invalid
    if (!expenses.length && !incomes.length) {
      return res.status(400).json({
        message: "No valid transactions found",
        errors,
      });
    }

    // Save valid transactions
    if (expenses.length) {
      await Expense.insertMany(expenses);
    }

    if (incomes.length) {
      await Income.insertMany(incomes);
    }

    res.status(200).json({
      message: "CSV imported successfully",
      imported: expenses.length + incomes.length,
      expenses: expenses.length,
      incomes: incomes.length,
      errors,
    });
  } catch (err) {
    console.error("CSV import error:", err);

    res.status(500).json({
      message: "Failed to import CSV",
      error: err.message,
    });
  }
};