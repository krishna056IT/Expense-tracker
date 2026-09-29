import React from "react";
import { addThousandsSeparator } from "../../utils/helper";

const MonthlyExpenseSummary = ({ transactions, monthLabel, loading }) => {
  const categoryTotals = Object.values(
    transactions.reduce((totals, transaction) => {
      const category = transaction.category || "Uncategorized";
      totals[category] ??= { category, amount: 0 };
      totals[category].amount += Number(transaction.amount || 0);
      return totals;
    }, {})
  ).sort((first, second) => second.amount - first.amount);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h5 className="text-lg">{monthLabel} by category</h5>
          <p className="mt-1 text-xs text-[#78908a]">
            {transactions.length} {transactions.length === 1 ? "transaction" : "transactions"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[250px] items-center justify-center text-sm text-[#78908a]">
          Loading monthly expenses...
        </div>
      ) : categoryTotals.length ? (
        <div className="mt-5 divide-y divide-[#edf1ee]">
          {categoryTotals.map(({ category, amount }) => (
            <div key={category} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="truncate text-[#45635d]">{category}</span>
              <span className="shrink-0 font-semibold text-[#172a27]">
                ₹{addThousandsSeparator(amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[250px] items-center justify-center text-center text-sm text-[#78908a]">
          No expenses recorded for this month.
        </div>
      )}
    </div>
  );
};

export default MonthlyExpenseSummary;