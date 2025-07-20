import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/Layout";
import { transactionsAPI, categoriesAPI } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Save,
  X,
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  PlusCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function NewTransaction() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, [formData.type]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll({ type: formData.type });
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, type, category: "" }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = { ...formData, amount: parseFloat(formData.amount) };
      await transactionsAPI.create(submitData);
      toast.success("Transaction created successfully!");
      router.push("/transactions");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <PlusCircle className="h-7 w-7 mr-2 text-primary-600" /> New Transaction
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Record your income or expense with optional receipt upload
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`p-4 border-2 rounded-lg ${
                    formData.type === "expense"
                      ? "border-error-500 bg-error-50 text-error-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="mx-auto w-8 h-8 bg-error-100 rounded-lg flex items-center justify-center mb-2">
                      <IndianRupee className="h-5 w-5 text-error-600" />
                    </div>
                    <span className="font-medium">Expense</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`p-4 border-2 rounded-lg ${
                    formData.type === "income"
                      ? "border-success-500 bg-success-50 text-success-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="mx-auto w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center mb-2">
                      <IndianRupee className="h-5 w-5 text-success-600" />
                    </div>
                    <span className="font-medium">Income</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      step="0.01"
                      min="0"
                      required
                      className={`form-input pl-10 ${errors.amount ? "border-error-500" : ""}`}
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-error-600">{errors.amount}</p>
                  )}
                  {formData.amount && (
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(parseFloat(formData.amount))}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    className={`form-select ${errors.category ? "border-error-500" : ""}`}
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-error-600">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      required
                      className={`form-input pl-10 ${errors.date ? "border-error-500" : ""}`}
                      value={formData.date}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-error-600">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="form-textarea pl-10"
                      placeholder="Optional description..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="form-input pl-10"
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                    />
                  </div>
                  <button type="button" onClick={handleAddTag} className="btn-secondary">
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  Create Transaction
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
