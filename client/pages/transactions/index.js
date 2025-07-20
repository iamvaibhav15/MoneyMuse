import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { transactionsAPI } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Plus,
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Transaction() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
    sortBy: "date",
    sortOrder: "desc",
  });

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = { ...filters };

      Object.keys(params).forEach((key) => {
        if (params[key] === "" || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await transactionsAPI.getAll(params);
      setTransactions(response.data.data.transactions);
      setPagination(response.data.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      await transactionsAPI.delete(id);
      toast.success("Transaction deleted successfully");
      fetchTransactions();
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const getTypeIcon = (type) => {
    return type === "income" ? (
      <ArrowUpRight className="h-4 w-4 text-success-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-error-600" />
    );
  };

  const getTypeBadge = (type) => {
    return type === "income" ? (
      <span className="badge-success">Income</span>
    ) : (
      <span className="badge-error">Expense</span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <List className="h-7 w-7 mr-2 text-primary-600" /> Transactions
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your income and expense transactions
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href="/transactions/new" className="btn-primary flex items-center justify-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Transaction
            </Link>
            <Link href="/transactions/newreceipt" className="btn-primary flex items-center justify-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Receipt
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="form-input pl-10"
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="form-select"
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                  <select
                    className="form-select"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                    <option value="createdAt">Created</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    className="form-select"
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 sm:mt-0">
                <p className="text-sm text-gray-500">
                  {pagination.total || 0} total transactions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <div className="skeleton h-10 w-10 rounded-lg"></div>
                        <div>
                          <div className="skeleton h-4 w-24 mb-2"></div>
                          <div className="skeleton h-3 w-32"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="skeleton h-4 w-20 mb-2"></div>
                        <div className="skeleton h-3 w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <div key={transaction._id} className="transaction-item group">
                    <div className="flex items-center flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          transaction.type === "income" ? "bg-success-100" : "bg-error-100"
                        }`}
                      >
                        {getTypeIcon(transaction.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.category}
                          </p>
                          {getTypeBadge(transaction.type)}
                          {transaction.receipt && (
                            <span className="badge-primary">Receipt</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {transaction.description || "No description"}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            {format(new Date(transaction.date), "MMM dd, yyyy")}
                          </p>
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {transaction.tags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="badge-gray text-xs">
                                  {tag}
                                </span>
                              ))}
                              {transaction.tags.length > 2 && (
                                <span className="text-xs text-gray-400">
                                  +{transaction.tags.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.type === "income" ? "text-success-600" : "text-error-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/transactions/edit/?id=${transaction._id}`}
                          className="p-1 text-gray-400 hover:text-warning-600"
                          title="Edit transaction"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="p-1 text-gray-400 hover:text-error-600"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No transactions found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {Object.values(filters).some((v) => v)
                    ? "Try adjusting your filters or search terms."
                    : "Get started by adding your first transaction."}
                </p>
                <div className="mt-6">
                  <Link href="/transactions/new" className="btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Transaction
                  </Link>
                </div>
              </div>
            )}
          </div>

          {pagination.pages > 1 && (
            <div className="card-footer">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}