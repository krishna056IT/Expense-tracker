import React, { useContext, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";
import InfoCard from "../../components/cards/InfoCard";
import {
  LuHandCoins,
  LuWalletMinimal,
  LuPlus,
  LuArrowUpRight,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { IoMdCard } from "react-icons/io";
import { addThousandsSeparator } from "../../utils/helper";
import RecentTransactions from "../../components/Dashboard/RecentTransactions";
import FinanceOverview from "../../components/Dashboard/FinanceOverview";
import ExpenseTransactions from "../../components/Dashboard/ExpenseTransactions";
import Last30DaysExpenses from "../../components/Dashboard/Last30DaysExpenses";
import RecentIncome from "../../components/Dashboard/RecentIncome";
import RecentIncomeWithChart from "../../components/Dashboard/RecentIncomeWithChart";
import MonthlyExpenseSummary from "../../components/Dashboard/MonthlyExpenseSummary";
import { UserContext } from "../../context/UserContext";

const Home = () => {
  useUserAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(UserContext);
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const requestedPeriod = searchParams.get("month");
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedPeriod || "") &&
      requestedPeriod <= currentPeriod
      ? requestedPeriod
      : currentPeriod;
  });
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState("");

  useEffect(() => {
    let active = true;
    const [year, month] = selectedPeriod.split("-").map(Number);

    setMonthLoading(true);
    setMonthError("");
    setMonthlyData(null);

    axiosInstance
      .get(API_PATHS.DASHBOARD.GET_DATA, { params: { month, year } })
      .then(({ data }) => {
        if (active) setMonthlyData(data);
      })
      .catch((err) => {
        if (active) {
          setMonthlyData(null);
          setMonthError(
            err.response?.data?.message || "Unable to load dashboard data for this month."
          );
        }
      })
      .finally(() => {
        if (active) setMonthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedPeriod]);

  useEffect(() => {
    setSearchParams({ month: selectedPeriod }, { replace: true });
  }, [selectedPeriod, setSearchParams]);

  useEffect(() => {
    let observedPeriod = new Date().toISOString().slice(0, 7);
    const interval = window.setInterval(() => {
      const current = new Date().toISOString().slice(0, 7);
      if (current !== observedPeriod) {
        observedPeriod = current;
        setSelectedPeriod(current);
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  const [selectedYear, selectedMonth] = selectedPeriod.split("-").map(Number);
  const selectedMonthLabel = new Date(
    Date.UTC(selectedYear, selectedMonth - 1, 1)
  ).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const incomeTransactions = monthlyData?.incomeTransactions || [];
  const expenseTransactions = monthlyData?.expenseTransactions || [];
  const monthlyIncome = monthlyData?.totalIncome || 0;
  const monthlyExpense = monthlyData?.totalExpense || 0;
  const monthlyBalance = monthlyData?.totalBalance || 0;
  const recentTransactions = monthlyData?.recentTransactions || [];

  const moveMonth = (amount) => {
    const date = new Date(Date.UTC(selectedYear, selectedMonth - 1 + amount, 1));
    setSelectedPeriod(date.toISOString().slice(0, 7));
  };

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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-8 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#172a27]">Dashboard month</h2>
            <p className="text-xs text-[#78908a] mt-1">Review income, expenses, and balance for a specific month.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="card-btn"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
              title="Previous month"
            >
              <LuChevronLeft className="text-lg" />
            </button>
            <input
              type="month"
              aria-label="Expense month and year"
              value={selectedPeriod}
              max={currentPeriod}
              onChange={(event) => {
                const nextPeriod = event.target.value;
                if (/^\d{4}-(0[1-9]|1[0-2])$/.test(nextPeriod) && nextPeriod <= currentPeriod) {
                  setSelectedPeriod(nextPeriod);
                }
              }}
              className="rounded-lg border border-[#dce6e1] bg-white px-3 py-2 text-sm font-semibold text-[#172a27] outline-none focus:border-[#0f766e]"
            />
            <button
              type="button"
              className="card-btn"
              onClick={() => moveMonth(1)}
              disabled={selectedPeriod >= currentPeriod}
              aria-label="Next month"
              title="Next month"
            >
              <LuChevronRight className="text-lg" />
            </button>
            {selectedPeriod !== currentPeriod && (
              <button
                type="button"
                className="text-xs font-bold text-[#0f766e]"
                onClick={() => setSelectedPeriod(currentPeriod)}
              >
                Current month
              </button>
            )}
          </div>
        </div>

        {monthError && (
          <p role="alert" className="mb-4 text-sm text-red-600">{monthError}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard
            icon={<IoMdCard />}
            label={`${selectedMonthLabel} Balance`}
            value={monthLoading ? "..." : addThousandsSeparator(monthlyBalance)}
            color="bg-[#0f766e]"
          />

          <InfoCard
            icon={<LuWalletMinimal />}
            label={`${selectedMonthLabel} Income`}
            value={monthLoading ? "..." : addThousandsSeparator(monthlyIncome)}
            color="bg-[#d97706]"
          />

          <InfoCard
            icon={<LuHandCoins />}
            label={`${selectedMonthLabel} Expenses`}
            value={monthLoading ? "..." : addThousandsSeparator(monthlyExpense)}
            color="bg-[#dc5a5a]"
          />
        </div>
        <div className="flex items-center justify-between mt-9 mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#172a27]">{selectedMonthLabel} overview</h2>
            <p className="text-xs text-[#78908a] mt-1">Income, expenses, and transactions for this month</p>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-xs font-bold text-[#0f766e]" onClick={() => navigate("/expense")}>
            View activity <LuArrowUpRight />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentTransactions
            transactions={recentTransactions}
            title={`${selectedMonthLabel} Transactions`}
            loading={monthLoading}
            onSeeMore={() => navigate("/expense")}
          />

          <FinanceOverview
            totalBalance={monthlyBalance}
            totalIncome={monthlyIncome}
            totalExpense={monthlyExpense}
            monthLabel={selectedMonthLabel}
            loading={monthLoading}
          />

          <ExpenseTransactions
            transactions={expenseTransactions}
            title={`${selectedMonthLabel} Transactions`}
            emptyMessage="No expenses recorded for this month."
            loading={monthLoading}
            onSeeMore={() => navigate("/expense")}
          />

          <MonthlyExpenseSummary
            transactions={expenseTransactions}
            monthLabel={selectedMonthLabel}
            loading={monthLoading}
          />

          <Last30DaysExpenses
            data={expenseTransactions}
            title={`${selectedMonthLabel} Expense Categories`}
            loading={monthLoading}
          />

          <RecentIncomeWithChart
            data={incomeTransactions}
            totalIncome={monthlyIncome}
            monthLabel={selectedMonthLabel}
            loading={monthLoading}
          />

          <RecentIncome
            transactions={incomeTransactions}
            title={`${selectedMonthLabel} Income`}
            loading={monthLoading}
            onSeeMore={() => navigate("/income")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Home;
