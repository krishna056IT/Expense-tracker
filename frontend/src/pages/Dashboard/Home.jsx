import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";
import InfoCard from "../../components/cards/InfoCard";
import { LuHandCoins, LuWalletMinimal, LuPlus, LuArrowUpRight } from "react-icons/lu";
import { IoMdCard } from "react-icons/io";
import { addThousandsSeparator } from "../../utils/helper";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import { UserContext } from "../../context/UserContext";

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await axiosInstance.get(
        `${API_PATHS.DASHBOARD.GET_DATA}`
      );

      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.log(`Something went wrong. Please try again`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    return () => {};
  }, []);

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout activeMenu="Dashboard">
      <div className="max-w-[1240px] my-6 sm:my-8 mx-auto">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-7">
          <div>
            <p className="text-sm font-semibold text-[#0f766e] mb-2">{greeting}, {firstName}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#172a27]">Your money at a glance</h1>
            <p className="text-sm text-[#78908a] mt-2">Stay close to your spending, income, and balance.</p>
          </div>
          <div className="flex gap-2">
            <button className="add-btn" onClick={() => navigate("/income")}>
              <LuPlus className="text-base" /> Income
            </button>
            <button className="add-btn add-btn-fill" onClick={() => navigate("/expense")}>
              <LuPlus className="text-base" /> Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label="Total Balance"
            value={addThousandsSeparator(dashboardData?.totalBalance || 0)}
            color="bg-[#0f766e]"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label="Total Income"
            value={addThousandsSeparator(dashboardData?.totalIncome || 0)}
            color="bg-[#d97706]"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label="Total Expense"
            value={addThousandsSeparator(dashboardData?.totalExpense || 0)}
            color="bg-[#dc5a5a]"
          />
        </div>
        <div className="flex items-center justify-between mt-9 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#172a27]">Your overview</h2>
            <p className="text-xs text-[#78908a] mt-1">A closer look at your recent activity</p>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#0f766e]" onClick={() => navigate("/expense")}>
            View activity <LuArrowUpRight />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentTransactions
            transactions={dashboardData?.recentTransactions}
            onSeeMore={() => navigate("/expense")}
          />

          <FinanceOverview
            totalBalance={dashboardData?.totalBalance || 0}
            totalIncome={dashboardData?.totalIncome || 0}
            totalExpense={dashboardData?.totalExpense || 0}
          />

          <ExpenseTransactions
            transactions={dashboardData?.last30DaysExpenses?.transactions || []}
            onSeeMore={() => navigate("/expense")}
          />

          <Last30DaysExpenses
            data={dashboardData?.last30DaysExpenses?.transactions || []}
          />

          <RecentIncomeWithChart
            data={
              dashboardData?.last60DaysIncome?.transactions?.slice(0, 4) || []
            }
            totalIncome={dashboardData?.totalIncome || 0}
          />

          <RecentIncome
            transactions={dashboardData?.last60DaysIncome?.transactions || []}
            onSeeMore={() => navigate("/income")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
