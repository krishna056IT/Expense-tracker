const xlsx = require("xlsx");
const Expense = require("../models/Expense");
const getMonthDateRange = require("../utils/monthDateRange");

exports.addExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, category, amount, date } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ message: "All fileds required" });
    }

    const expenseDate = new Date(date);
    if (Number.isNaN(expenseDate.getTime()) || expenseDate > new Date()) {
      return res.status(400).json({
        message: "Expense date must be valid and cannot be in the future",
      });
    }

    const newExpense = new Expense({
      userId,
      icon,
      category,
      amount,
      date: expenseDate,
    });

    await newExpense.save();
    res.status(200).json({ newExpense: newExpense });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

exports.getAllExpense = async (req, res) => {
  const userId = req.user.id;

  try {
    const { month, year } = req.query;
    const filter = { userId };

    if (month !== undefined || year !== undefined) {
      const monthNumber = Number(month);
      const yearNumber = Number(year);
      const dateRange = getMonthDateRange(monthNumber, yearNumber);

      if (!dateRange) {
        return res.status(400).json({
          message: "A valid month and year are required",
        });
      }

      const now = new Date();
      const currentMonthStart = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
      );

      if (dateRange.start.getTime() > currentMonthStart) {
        return res.status(400).json({
          message: "Future expense periods are not available",
        });
      }

      filter.date = { $gte: dateRange.start, $lt: dateRange.end };
    }

    const expense = await Expense.find(filter).sort({ date: -1 });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: `Expense deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};

exports.downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });

    const data = expense.map((item) => ({
      category: item.category,
      Amount: item.amount,
      Date: new Date(item.date).toLocaleDateString("en-IN"),
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "expense");
    xlsx.writeFile(wb, "expense_details.xlsx");
    res.download("expense_details.xlsx");
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};
