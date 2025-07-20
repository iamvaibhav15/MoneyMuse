import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import { transactionsAPI } from '../utils/api';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Eye,
  EyeOff,
  Zap,
  Target,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import Link from 'next/link';

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [filter, setFilter] = useState('all');
  const [showAmounts, setShowAmounts] = useState(true);
  const [activeCard, setActiveCard] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, filter, customDateRange.startDate, customDateRange.endDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      const now = new Date();
      
      if (dateRange === 'custom') {
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate);
          endDate = new Date(customDateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          setLoading(false);
          return;
        }
      } else {
        switch (dateRange) {
          case 'week':
            startDate = subDays(now, 7);
            endDate = now;
            break;
          case 'month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'quarter':
            const currentMonth = now.getMonth();
            const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
            endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
          default:
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
        }
      }

      const params = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 10
      };

      if (filter !== 'all') {
        params.type = filter;
      }

      const [transactionsRes, statsRes] = await Promise.all([
        transactionsAPI.getAll(params),
        transactionsAPI.getStats(params)
      ]);

      setTransactions(transactionsRes.data.data.transactions);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => {
      const newRange = { ...prev, [field]: value };
      
      if (newRange.startDate && newRange.endDate) {
        const start = new Date(newRange.startDate);
        const end = new Date(newRange.endDate);
        
        if (end < start) {
          return prev;
        }
      }
      
      return newRange;
    });
  };

  const getSummaryStats = () => {
    if (!stats || !stats.summary) return { income: 0, expenses: 0, balance: 0, savingsRate: 0 };
    
    const { totalIncome, totalExpenses, netIncome, savingsRate } = stats.summary;
    
    return { 
      income: totalIncome || 0, 
      expenses: totalExpenses || 0, 
      balance: netIncome || 0,
      savingsRate: savingsRate || 0
    };
  };

  const formatCurrency = (amount) => {
    if (!showAmounts) return '••••••';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const { income, expenses, balance, savingsRate } = getSummaryStats();

  const StatCard = ({ title, value, icon: Icon, color, index, badge }) => (
    <div 
      className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
        activeCard === index ? `ring-2 ring-blue-500 shadow-lg` : ''
      }`}
      onMouseEnter={() => setActiveCard(index)}
      onMouseLeave={() => setActiveCard(null)}
    >
      {badge && (
        <div className={`absolute -top-2 -right-2 bg-gradient-to-r from-${color}-500 to-${color}-600 text-black text-xs px-2 py-1 rounded-full font-medium shadow-sm`}>
          {badge}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
          <p className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-all duration-300 break-words ${
            color === 'green' ? 'text-green-600' :
            color === 'red' ? 'text-red-600' :
            color === 'blue' ? 'text-blue-600' :
            color === 'orange' ? 'text-orange-600' :
            color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
          } ${activeCard === index ? 'scale-105' : ''}`}>
            {value}
          </p>
        </div>
        <div className={`p-2 sm:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
          color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
          color === 'red' ? 'bg-red-100 group-hover:bg-red-200' :
          color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
          color === 'orange' ? 'bg-orange-100 group-hover:bg-orange-200' :
          color === 'yellow' ? 'bg-yellow-100 group-hover:bg-yellow-200' : 'bg-gray-100 group-hover:bg-gray-200'
        }`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:scale-110 ${
            color === 'green' ? 'text-green-600' :
            color === 'red' ? 'text-red-600' :
            color === 'blue' ? 'text-blue-600' :
            color === 'orange' ? 'text-orange-600' :
            color === 'yellow' ? 'text-yellow-600' : 'text-gray-600'
          }`} />
        </div>
      </div>
      
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
        color === 'green' ? 'bg-gradient-to-br from-green-500/5 to-green-600/5' :
        color === 'red' ? 'bg-gradient-to-br from-red-500/5 to-red-600/5' :
        color === 'blue' ? 'bg-gradient-to-br from-blue-500/5 to-blue-600/5' :
        color === 'orange' ? 'bg-gradient-to-br from-orange-500/5 to-orange-600/5' :
        color === 'yellow' ? 'bg-gradient-to-br from-yellow-500/5 to-yellow-600/5' : 'bg-gradient-to-br from-gray-500/5 to-gray-600/5'
      }`}></div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-48 sm:w-64 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-8 sm:h-10 w-24 sm:w-32 rounded-lg"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="animate-pulse bg-gray-200 h-16 sm:h-20 w-full rounded-lg"></div>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="animate-pulse bg-gray-200 h-48 sm:h-64 w-full rounded-lg"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const getDateRangeLabel = () => {
    if (dateRange === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      return `${format(new Date(customDateRange.startDate), 'dd MMM, yyyy')} - ${format(new Date(customDateRange.endDate), 'dd MMM, yyyy')}`;
    }
    switch (dateRange) {
      case 'week': return 'this week';
      case 'month': return 'this month';
      case 'quarter': return 'this quarter';
      case 'year': return 'this year';
      default: return 'this month';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-600 text-base sm:text-lg break-words">
              Here's your financial overview for {getDateRangeLabel()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              className="flex items-center justify-center px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            >
              {showAmounts ? <Eye className="h-4 sm:h-5 w-4 sm:w-5 mr-2" /> : <EyeOff className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />}
              <span className="whitespace-nowrap">{showAmounts ? 'Hide' : 'Show'} Amounts</span>
            </button>
            <Link href="/transactions/new" className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              <Plus className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              <span className="whitespace-nowrap">Add Transaction</span>
            </Link>
            <Link href="/import" className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md">
              <ArrowUpRight className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
              <span className="whitespace-nowrap">Import Data</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Calendar className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
              </div>
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomDateRange({ startDate: '', endDate: '' });
                  }
                }}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Filter className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600" />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label className="text-sm font-medium text-gray-600 w-full sm:w-20">From:</label>
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                  className="flex-1 w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label className="text-sm font-medium text-gray-600 w-full sm:w-20">To:</label>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                  className="flex-1 w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Income"
            value={formatCurrency(income)}
            icon={TrendingUp}
            color="green"
            index={0}
            badge={income > 0 ? "Active" : null}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(expenses)}
            icon={TrendingDown}
            color="red"
            index={1}
          />
          <StatCard
            title="Net Balance"
            value={formatCurrency(balance)}
            icon={IndianRupee}
            color={balance >= 0 ? "blue" : "orange"}
            index={2}
          />
          <StatCard
            title="Savings Rate"
            value={showAmounts ? `${savingsRate.toFixed(1)}%` : '••••'}
            icon={Target}
            color={savingsRate >= 20 ? "green" : savingsRate >= 10 ? "yellow" : "red"}
            index={3}
            badge={savingsRate >= 20 ? "Great!" : savingsRate >= 10 ? "Good" : null}
          />
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
              <Zap className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-blue-600 flex-shrink-0" />
              Recent Transactions
            </h3>
            <Link href="/transactions" className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-sm sm:text-base">
              View all
            </Link>
          </div>
          <div className="p-0">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transactions.map((transaction, index) => (
                  <div 
                    key={transaction._id} 
                    className="px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-all duration-200 group cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <div className={`p-2 sm:p-3 rounded-xl transition-all duration-200 group-hover:scale-110 flex-shrink-0 ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 group-hover:bg-green-200' 
                            : 'bg-red-100 group-hover:bg-red-200'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUpRight className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 text-sm sm:text-base truncate">
                            {transaction.category}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {transaction.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm sm:text-lg transition-all duration-200 group-hover:scale-105 ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {format(new Date(transaction.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="inline-flex items-center justify-center w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full mb-4">
                  <IndianRupee className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No transactions</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-6">Get started by adding your first transaction.</p>
                <Link href="/transactions/new" className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Plus className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                  Add Transaction
                </Link>
              </div>
            )}
          </div>
        </div>

        {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="h-5 sm:h-6 w-5 sm:w-6 mr-2 text-purple-600 flex-shrink-0" />
                Top Expense Categories
              </h3>
            </div>
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {stats.categoryBreakdown.slice(0, 5).map((category, index) => {
                const percentage = expenses > 0 ? (category.total / expenses) * 100 : 0;
                return (
                  <div key={category._id} className="group">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                      <span className="font-semibold text-gray-900 truncate flex-1 mr-2">{category._id}</span>
                      <span className="text-gray-600 font-medium whitespace-nowrap">{formatCurrency(category.total)}</span>
                    </div>
                    <div className="relative w-full bg-gray-100 rounded-full h-2 sm:h-3 overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000 ease-out group-hover:from-purple-600 group-hover:to-blue-600"
                        style={{ 
                          width: `${percentage}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="mt-1 text-xs text-gray-500 font-medium">
                      {percentage.toFixed(1)}% of total expenses
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
