import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useUserAuth } from "../../hooks/useUserAuth";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/ApiPaths";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatCurrency = (amount) =>
  `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;

const MonthlyComparison = () => {
  useUserAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setMonths([]);

    axiosInstance
      .get(API_PATHS.DASHBOARD.MONTHLY_COMPARISON, { params: { year } })
      .then(({ data }) => {
        if (active) {
          setMonths(
            data.map((entry) => ({
              ...entry,
              name: MONTH_NAMES[entry.month - 1],
              balance: entry.income - entry.expense,
            }))
          );
        }
      })
      .catch((err) => {
        if (active) {
          setMonths([]);
          setError(
            err.response?.data?.message || "Unable to load monthly comparison."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [year]);

  return (
    <DashboardLayout activeMenu="Monthly Comparison">
      <div className="mx-auto my-6 max-w-[1240px] sm:my-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#172a27]">
              Monthly Comparison
            </h1>
            <p className="mt-2 text-sm text-[#78908a]">
              Compare income, expenses, and balance across the year.
            </p>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-[#45635d]">
            Year
            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded-lg border border-[#dce6e1] bg-white px-3 py-2 text-sm text-[#172a27] outline-none focus:border-[#0f766e]"
            >
              {Array.from({ length: currentYear - 1999 }, (_, index) => currentYear - index).map(
                (optionYear) => (
                  <option key={optionYear} value={optionYear}>
                    {optionYear}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

        <section className="card mb-6" aria-label={`${year} income and expense chart`}>
          <h2 className="mb-4 text-lg font-bold text-[#172a27]">Income vs expenses</h2>
          {loading ? (
            <div className="flex h-[340px] items-center justify-center text-sm text-[#78908a]">
              Loading comparison...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={months} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="#e8eeea" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#45635d" }} />
                <YAxis tick={{ fontSize: 11, fill: "#45635d" }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="#0f766e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#dc5a5a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-[#e6ece8] px-5 py-4">
            <h2 className="text-lg font-bold text-[#172a27]">{year} monthly summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f7f9f7] text-xs uppercase text-[#78908a]">
                <tr>
                  <th className="px-5 py-3 font-bold">Month</th>
                  <th className="px-5 py-3 text-right font-bold">Total Income</th>
                  <th className="px-5 py-3 text-right font-bold">Total Expense</th>
                  <th className="px-5 py-3 text-right font-bold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1ee]">
                {loading && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-[#78908a]">
                      Loading monthly summary...
                    </td>
                  </tr>
                )}
                {months.map((entry) => (
                  <tr key={entry.month} className="hover:bg-[#f7f9f7]">
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        className="font-semibold text-[#0f766e] hover:underline"
                        onClick={() =>
                          navigate(`/dashboard?month=${year}-${String(entry.month).padStart(2, "0")}`)
                        }
                      >
                        {entry.name} {year}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right text-[#172a27]">{formatCurrency(entry.income)}</td>
                    <td className="px-5 py-3 text-right text-[#172a27]">{formatCurrency(entry.expense)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#172a27]">{formatCurrency(entry.balance)}</td>
                  </tr>
                ))}
                {!loading && months.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-8 text-center text-[#78908a]">
                      No monthly data available for {year}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MonthlyComparison;