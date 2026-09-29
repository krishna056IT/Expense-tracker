const Income = require("../models/Income");
const Expense = require("../models/Expense");
const getMonthDateRange = require("../utils/monthDateRange");

const { isValidObjectId, Types } = require("mongoose");

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const userObjectId = new Types.ObjectId(String(userId));

    if (req.query.month !== undefined || req.query.year !== undefined) {
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      const dateRange = getMonthDateRange(month, year);

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
          message: "Future dashboard periods are not available",
        });
      }

      const dateFilter = {
        userId,
        date: { $gte: dateRange.start, $lt: dateRange.end },
      };
      const [incomeTransactions, expenseTransactions] = await Promise.all([
        Income.find(dateFilter).sort({ date: -1 }),
        Expense.find(dateFilter).sort({ date: -1 }),
      ]);
      const totalIncome = incomeTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
      const totalExpense = expenseTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0
      );
      const recentTransactions = [
        ...incomeTransactions.map((transaction) => ({
          ...transaction.toObject(),
          type: "income",
        })),
        ...expenseTransactions.map((transaction) => ({
          ...transaction.toObject(),
          type: "expense",
        })),
      ].sort((first, second) => second.date - first.date);

      return res.json({
        month,
        year,
        totalIncome,
        totalExpense,
        totalBalance: totalIncome - totalExpense,
        incomeTransactions,
        expenseTransactions,
        recentTransactions,
      });
    }

    const totalIncome = await Income.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    console.log("totalIncome", {
      totalIncome,
      userId: isValidObjectId(userId),  
    });

    const totalExpense = await Expense.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const last60DaysIncomeTransactions = await Income.find({
      userId,
      date: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    const incomeLast60Days = last60DaysIncomeTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const last30DaysExpenseTransactions = await Expense.find({
      userId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ date: -1 });

    const expenseLast30Days = last30DaysExpenseTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    const lastTransactions = [
      ...(await Income.find({ userId }).sort({ date: -1 }).limit(5)).map(
        (txn) => ({
          ...txn.toObject(),
          type: "income",
        })
      ),
      ...(await Expense.find({ userId }).sort({ date: -1 }).limit(5)).map(
        (txn) => ({
          ...txn.toObject(),
          type: "expense",
        })
      ),
    ].sort((a, b) => b.date - a.date);

    res.json({
      totalBalance:
        (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        totalIncome: totalIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
      last30DaysExpenses: {
        total: expenseLast30Days,
        transactions: last30DaysExpenseTransactions,
      },
      last60DaysIncome: {
        total: incomeLast60Days,
        transactions: last60DaysIncomeTransactions,
      },
      recentTransactions: lastTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: `Internal serverError`, err });
  }
};

exports.getMonthlyComparison = async (req, res) => {
  try {
    const year = Number(req.query.year);
    const currentYear = new Date().getUTCFullYear();

    if (!Number.isInteger(year) || year < 1000 || year > currentYear) {
      return res.status(400).json({ message: "A valid year is required" });
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const userObjectId = new Types.ObjectId(String(req.user.id));
    const match = {
      userId: userObjectId,
      date: { $gte: start, $lt: end },
    };

    const [income, expenses] = await Promise.all([
      Income.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $month: "$date" },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Expense.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $month: "$date" },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const incomeByMonth = new Map(income.map((entry) => [entry._id, entry.total]));
    const expensesByMonth = new Map(
      expenses.map((entry) => [entry._id, entry.total])
    );

    res.json(
      Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        income: incomeByMonth.get(index + 1) || 0,
        expense: expensesByMonth.get(index + 1) || 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
