const xlsx = require('xlsx')
const Income = require("../models/Income");
const getMonthDateRange = require("../utils/monthDateRange");

exports.addIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { icon, source, amount, date } = req.body;

    if (!source || !amount || !date) {
      return res.status(400).json({ message: "All fileds required" });
    }

    const newIncome = new Income({
      userId,
      icon,
      source,
      amount,
      date: new Date(date),
    });

    await newIncome.save();
    res.status(200).json({ newIncome: newIncome });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

exports.getAllIncome = async (req, res) => {
  const userId = req.user.id;

  try {
    const { month, year } = req.query;
    const filter = { userId };

    if (month !== undefined || year !== undefined) {
      const dateRange = getMonthDateRange(Number(month), Number(year));

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
          message: "Future income periods are not available",
        });
      }

      filter.date = { $gte: dateRange.start, $lt: dateRange.end };
    }

    const income = await Income.find(filter).sort({ date: -1 });
    res.json(income);
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};

exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: `Income deleted successfully` });
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};

exports.downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  try {
    const income = await Income.find({ userId }).sort({ date: -1 });

    const data = income.map((item) => ({
      Source: item.source,
      Amount: item.amount,
      Date: new Date(item.date).toLocaleString("en-IN")
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "income");
    xlsx.writeFile(wb, "income_details.xlsx");
    res.download("income_details.xlsx");
  } catch (err) {
    res.status(500).json({ message: `Internal server Error`, error: err });
  }
};
