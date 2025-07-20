"use client";

import Layout from "../components/Layout";
import { useState, useEffect, useMemo } from "react";
import { transactionsAPI } from "../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { format, getYear, getMonth } from "date-fns";
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewBy, setViewBy] = useState("Month");

  const now = new Date();
  const [pickedYear, setPickedYear] = useState(now.getFullYear());
  const [pickedMonth, setPickedMonth] = useState(now.getMonth());

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear())));
    return years.sort((a, b) => b - a);
  }, [transactions]);

  useEffect(() => {
    if (availableYears.length > 0) {
      setPickedYear(cur => availableYears.includes(cur) ? cur : availableYears[0]);
    }
  }, [loading, availableYears]);

  const toCurrency = n =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const pad = n => n.toString().padStart(2, "0");

  const monthSummary = useMemo(() => {
    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return getYear(d) === pickedYear && getMonth(d) === pickedMonth;
    });
    const income = filtered.filter(t => t.type.toLowerCase() === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filtered.filter(t => t.type.toLowerCase() === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const net = income - expense;
    return { income, expense, net, transactions: filtered.length };
  }, [transactions, pickedYear, pickedMonth]);

  const monthsBreakdown = useMemo(() => {
    if (!pickedYear) return [];
    return Array.from({ length: 12 }).map((_, m) => {
      const label = format(new Date(pickedYear, m, 1), "MMM");
      const filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return getYear(d) === pickedYear && getMonth(d) === m;
      });
      const income = filtered.filter(t => t.type.toLowerCase() === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = filtered.filter(t => t.type.toLowerCase() === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { label, income, expense };
    });
  }, [transactions, pickedYear]);

  const yearlyTotals = useMemo(() => {
    const years = Array.from(new Set(transactions.map(t => getYear(new Date(t.date)))));
    return years.sort((a, b) => b - a).map(yr => {
      const filtered = transactions.filter(t => getYear(new Date(t.date)) === yr);
      const income = filtered.filter(t => t.type.toLowerCase() === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = filtered.filter(t => t.type.toLowerCase() === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { year: yr, income, expense, net: income - expense };
    });
  }, [transactions]);

  const dailyBreakdownSorted = useMemo(() => {
    const byDay = transactions
      .filter(t => {
        const d = new Date(t.date);
        return getYear(d) === pickedYear && getMonth(d) === pickedMonth;
      })
      .reduce((acc, t) => {
        const day = format(new Date(t.date), "dd");
        if (!acc[day]) acc[day] = { date: day, income: 0, expense: 0 };
        if (t.type.toLowerCase() === "income") acc[day].income += Number(t.amount);
        else acc[day].expense += Number(t.amount);
        return acc;
      }, {});
    return Object.values(byDay).sort((a, b) => Number(a.date) - Number(b.date));
  }, [transactions, pickedYear, pickedMonth]);

  const getCategoryBreakdown = useMemo(() => {
    const getBreakdownForTransactions = (filteredTransactions) => {
      const expensesByCategory = filteredTransactions
        .filter(t => t.type.toLowerCase() === "expense")
        .reduce((acc, t) => {
          const category = t.category || "Other";
          acc[category] = (acc[category] || 0) + Number(t.amount);
          return acc;
        }, {});

      return Object.entries(expensesByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
    };

    const monthly = transactions.filter(t => {
      const d = new Date(t.date);
      return getYear(d) === pickedYear && getMonth(d) === pickedMonth;
    });

    const yearly = transactions.filter(t => {
      const d = new Date(t.date);
      return getYear(d) === pickedYear;
    });

    return {
      monthly: getBreakdownForTransactions(monthly),
      yearly: getBreakdownForTransactions(yearly),
      allTime: getBreakdownForTransactions(transactions),
    };
  }, [transactions, pickedYear, pickedMonth]);

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const first = await transactionsAPI.getAll({ page: 1, limit: 1 });
        const total = first.data.data.pagination.total;
        const all = await transactionsAPI.getAll({ page: 1, limit: total });
        setTransactions(all.data.data.transactions || []);
      } catch (err) {
        console.error("Error loading transactions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!transactions.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center p-8 bg-white rounded-3xl shadow-2xl">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Available</h2>
            <p className="text-gray-600">Add some transactions to see analytics.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const StatsCard = ({ title, amount, icon: Icon, trend, color = "blue", isCount = false }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50",
      green: "from-green-500 to-green-600 text-green-600 bg-green-50",
      red: "from-red-500 to-red-600 text-red-600 bg-red-50",
      purple: "from-purple-500 to-purple-600 text-purple-600 bg-purple-50",
    };

    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {isCount ? amount : toCurrency(amount)}
            </p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const chartStyle = {
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="p-6 space-y-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">Financial Analytics</h1>
              <p className="text-lg text-gray-600">Track your financial performance with detailed insights</p>
            </div>
            
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-lg">
              {["Month", "Months", "Years"].map((view) => (
                <button
                  key={view}
                  onClick={() => setViewBy(view)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    viewBy === view
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {view === "Month" ? "Daily" : view === "Months" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>

          {viewBy === "Month" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-gray-700">Select Month:</span>
                <input
                  type="month"
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={`${pickedYear}-${pad(pickedMonth + 1)}`}
                  onChange={e => {
                    const [y, m] = e.target.value.split("-");
                    setPickedYear(Number(y));
                    setPickedMonth(Number(m) - 1);
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <StatsCard title="Total Income" amount={monthSummary.income} icon={TrendingUp} color="green" />
                <StatsCard title="Total Expense" amount={monthSummary.expense} icon={TrendingDown} color="red" />
                <StatsCard title="Transactions" amount={monthSummary.transactions} icon={BarChart3} color="purple" isCount={true} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">
                    Daily Breakdown - {format(new Date(pickedYear, pickedMonth, 1), "MMMM yyyy")}
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyBreakdownSorted}>
                        <defs>
                          <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <YAxis tickFormatter={v => `₹${v/1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                        <Tooltip formatter={(val, name) => [toCurrency(val), name]} contentStyle={chartStyle} />
                        <Legend />
                        <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#income)" name="Income" />
                        <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#expense)" name="Expense" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Expense by Category</h3>
                  <div className="h-80">
                    {getCategoryBreakdown.monthly.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryBreakdown.monthly}
                            cx="50%" cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {getCategoryBreakdown.monthly.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val) => [toCurrency(val), "Amount"]} labelFormatter={(label) => `Category: ${label}`} contentStyle={chartStyle} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p>No expense data for this month</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewBy === "Months" && (
            <div className="space-y-8">
              <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-gray-700">Select Year:</span>
                <select
                  className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={pickedYear}
                  onChange={e => setPickedYear(Number(e.target.value))}
                >
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Monthly Overview - {pickedYear}</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthsBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tickFormatter={v => `₹${v/1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip formatter={(val, name) => [toCurrency(val), name]} contentStyle={chartStyle} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Yearly Expense by Category - {pickedYear}</h3>
                <div className="h-96">
                  {getCategoryBreakdown.yearly.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryBreakdown.yearly}
                          cx="50%" cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {getCategoryBreakdown.yearly.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => [toCurrency(val), "Amount"]} labelFormatter={(label) => `Category: ${label}`} contentStyle={chartStyle} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No expense data for {pickedYear}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewBy === "Years" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Best Year (Income)" amount={Math.max(...yearlyTotals.map(y => y.income))} icon={TrendingUp} color="green" />
                <StatsCard title="Highest Expense Year" amount={Math.max(...yearlyTotals.map(y => y.expense))} icon={TrendingDown} color="red" />
                <StatsCard title="Best Net Year" amount={Math.max(...yearlyTotals.map(y => y.net))} icon={Wallet} color="blue" />
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Yearly Financial Summary</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={yearlyTotals.map(({ year, income, expense }) => ({ label: year.toString(), income, expense }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis tickFormatter={v => `₹${v/1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <Tooltip formatter={(val, name) => [toCurrency(val), name]} contentStyle={chartStyle} />
                      <Legend />
                      <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">All Time Expense by Category</h3>
                <div className="h-96">
                  {getCategoryBreakdown.allTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getCategoryBreakdown.allTime}
                          cx="50%" cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={120}
                          dataKey="value"
                        >
                          {getCategoryBreakdown.allTime.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val) => [toCurrency(val), "Amount"]} labelFormatter={(label) => `Category: ${label}`} contentStyle={chartStyle} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <PieChartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                        <p>No expense data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
