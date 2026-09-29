import React from "react";
import CustomPieChart from "../Charts/CustomPieChart";

const COLORS = ["#875CF5", "#FA2C37", "#FF6900", "#4f39f6"];

const RecentIncomeWithChart = ({
  data,
  totalIncome,
  monthLabel = "Recent",
  loading = false,
}) => {
  const chartData = (data || []).map((item) => ({
    name: item?.source,
    amount: Number(item?.amount) || 0,
  }));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h5 className="text-lg">{monthLabel} Income by Source</h5>
      </div>
      {loading ? (
        <div className="flex h-[380px] items-center justify-center text-sm text-[#78908a]">
          Loading monthly income...
        </div>
      ) : (
        <CustomPieChart
          data={chartData}
          label="Monthly Income"
          totalAmount={`₹${totalIncome}`}
          showTextAnchor
          colors={COLORS}
        />
      )}
    </div>
  );
};
export default RecentIncomeWithChart;
