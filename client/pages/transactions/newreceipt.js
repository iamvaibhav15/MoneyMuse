import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Buffer } from "buffer";
import Layout from "../../components/Layout";
import { transactionsAPI, categoriesAPI } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Save,
  Upload,
  X,
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  Image,
  Receipt,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export default function NewReceipt() {
  const { user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
  });
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [processingReceipt, setProcessingReceipt] = useState(false);

  useEffect(() => {
    categoriesAPI
      .getAll({ type: "expense" })
      .then((r) => setCategories(r.data.data))
      .catch(console.error);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      const file = files[0];
      if (!file) return;
      setReceipt(file);
      processReceipt(file);
    },
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".gif"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  async function processReceipt(file) {
    setProcessingReceipt(true);
    try {
      const data = await scanReceipt(file);

      setFormData((f) => ({
        ...f,
        amount: data.amount || 0,
        category: data.category || "Other",
        description: `Purchased { ${data.description} } from {${data.merchantName || "Unknown"}}`,
        date: data.date,
        type: "expense",
      }));

      toast.success("Receipt processed successfully!");
    } catch (err) {
      toast.error("Could not process receipt—please fill manually.");
    } finally {
      setProcessingReceipt(false);
    }
  }

  async function scanReceipt(file) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const buf = await file.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: Groceries,Dining Out,Rent, Utilities, Subscriptions, Shopping, Transportation, Entertainment, Healthcare, Education, Gifts, Travel, Food, Other)
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }
      if anything is not in specific format correct it.

      If its not a receipt, return an empty object
    `;
    const res = await model.generateContent([
      { inlineData: { data: base64, mimeType: file.type } },
      prompt,
    ]);
    const txt = await res.response.text();
    const json = txt.replace(/```(?:json)?\n?/g, "").trim();
    const d = JSON.parse(json);
    return {
      amount: parseFloat(d.amount),
      date: d.date,
      description: d.description,
      merchantName: d.merchantName,
      category: d.category || "",
    };
  }

  const validateForm = () => {
    const errs = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      errs.amount = "Amount must be > 0";
    if (!formData.category) errs.category = "Category is required";
    if (!formData.date) errs.date = "Date is required";
    if (!receipt) errs.receipt = "Receipt image is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      await transactionsAPI.create(submitData);
      toast.success("Transaction created!");
      router.push("/transactions");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const t = tagInput.trim().toLowerCase();
    if (t && !formData.tags.includes(t)) {
      setFormData((f) => ({ ...f, tags: [...f.tags, t] }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) =>
    setFormData((f) => ({
      ...f,
      tags: f.tags.filter((t) => t !== tag),
    }));

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Receipt className="h-7 w-7 mr-2 text-primary-600" /> Add New Receipt
          </h1>
          <p className="text-sm text-gray-500">
            Upload your receipt image and we'll extract details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="card-body">
              {!receipt ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    isDragActive
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 hover:border-gray-400"
                  } ${errors.receipt ? "border-error-500 bg-error-50" : ""}`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">
                    {isDragActive
                      ? "Drop the image here…"
                      : "Drag & drop a receipt image, or click to select"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG or GIF — max 10 MB
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded">
                        <Image className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">{receipt.name}</p>
                        <p className="text-xs text-gray-500">
                          {(receipt.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceipt(null)}
                      className="text-gray-400 hover:text-error-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {processingReceipt && (
                    <div className="mt-3 p-3 bg-blue-50 rounded">
                      <div className="flex space-x-2">
                        <div className="loading-spinner h-4 w-4 text-blue-600" />
                        <p className="text-blue-700 text-sm">Processing Receipt…</p>
                      </div>
                    </div>
                  )}

                  {errors.receipt && (
                    <p className="text-error-600 mt-2">{errors.receipt}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {receipt && (
            <div className="card">
              <div className="card-body">
                <h3 className="font-medium mb-4">Transaction Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-1">Amount *</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className={`form-input pl-10 ${
                          errors.amount ? "border-error-500" : ""
                        }`}
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-error-600 mt-1">{errors.amount}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Category *</label>
                    <select
                      name="category"
                      required
                      className={`form-select ${
                        errors.category ? "border-error-500" : ""
                      }`}
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-error-600 mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        name="date"
                        type="date"
                        required
                        className={`form-input pl-10 ${
                          errors.date ? "border-error-500" : ""
                        }`}
                        value={formData.date}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-error-600 mt-1">{errors.date}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm mb-1">Description</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        name="description"
                        rows={3}
                        className="form-textarea pl-10"
                        placeholder="Optional description…"
                        value={formData.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-primary-100"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 h-4 w-4 flex items-center justify-center"
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
          )}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || processingReceipt}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? (
                <span>Saving…</span>
              ) : (
                <span className="flex items-center">
                  <Save className="mr-2 h-4 w-4" />
                  Create Transaction
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
