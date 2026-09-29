import React from "react";
import CustomPieChart from "../Charts/CustomPieChart";

const COLORS = ["#875CF5", "#FA2C37", "#FF6900"];

const FinanceOverview = ({
  totalIncome,
  totalBalance,
  totalExpense,
  monthLabel = "Total",
  loading = false,
}) => {
  const balanceData = [
    { name: `${monthLabel} Balance`, amount: totalBalance },
    { name: `${monthLabel} Expense`, amount: totalExpense },
    { name: `${monthLabel} Income`, amount: totalIncome },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">{monthLabel} Financial Overview</h5>
      </div>

      {loading ? (
        <div className="flex h-[380px] items-center justify-center text-sm text-[#78908a]">
          Loading monthly overview...
        </div>
      ) : (
        <CustomPieChart
          data={balanceData}
          label="Monthly Balance"
          totalAmount={`₹${totalBalance}`}
          colors={COLORS}
          showTextAnchor
        />
      )}
    </div>
  );
};

export default FinanceOverview;