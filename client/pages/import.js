import { useState } from 'react';
import Layout from '../components/Layout';
import { transactionsAPI } from '../utils/api';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Download,
  Info
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function Import() {
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  });

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a PDF file first');
      return;
    }

    setLoading(true);

    try {
      const response = await transactionsAPI.importPDF(selectedFile);
      setImportResult(response.data.data);
      toast.success(`Successfully imported ${response.data.data.imported} transactions!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadSamplePDF = () => {
    const sampleData = `Date,Description,Amount,Type
      2024-01-15,Grocery Store,85.50,expense
      2024-01-14,Salary Deposit,3000.00,income
      2024-01-13,Gas Station,45.20,expense
      2024-01-12,Coffee Shop,12.75,expense
      2024-01-11,Freelance Payment,500.00,income`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Upload className="h-7 w-7 mr-2 text-primary-600"/> Import Transaction Data
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload PDF files containing transaction history for bulk import
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              How to Import Transactions
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Prepare Your PDF</h4>
                  <p className="text-sm text-gray-500">
                    Ensure your PDF contains transaction data in a tabular format with columns for Date, Description, and Amount.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Upload PDF File</h4>
                  <p className="text-sm text-gray-500">
                    Drag and drop your PDF file or click to select. Maximum file size is 10MB.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Review and Import</h4>
                  <p className="text-sm text-gray-500">
                    Our system will automatically parse the PDF and extract transaction data for import.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button onClick={downloadSamplePDF} className="btn-secondary">
                <Download className="h-4 w-4 mr-2" />
                Download Sample Format (CSV)
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Download a sample CSV file to see the expected format. You can convert this to PDF for testing.
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload PDF File</h3>
            
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <FileText className="mx-auto h-16 w-16 text-gray-400" />
                <p className="mt-4 text-lg text-gray-600">
                  {isDragActive
                    ? 'Drop the PDF file here...'
                    : 'Drag & drop a PDF file, or click to select'
                  }
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports PDF files up to 10MB containing transaction data
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <FileText className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setImportResult(null);
                      }}
                      className="text-gray-400 hover:text-error-600"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setImportResult(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="loading-spinner h-4 w-4 mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Transactions
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {importResult && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-success-600" />
                Import Results
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{importResult.imported}</div>
                  <div className="text-sm text-gray-500">Transactions Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {(importResult.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Confidence Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">PDF</div>
                  <div className="text-sm text-gray-500">Source Format</div>
                </div>
              </div>

              {importResult.transactions && importResult.transactions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Imported Transactions Preview</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResult.transactions.slice(0, 10).map((transaction, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900">{transaction.description}</td>
                              <td className="px-4 py-2 text-sm text-gray-500">{transaction.category}</td>
                              <td className="px-4 py-2 text-sm font-medium">
                                <span className={transaction.type === 'income' ? 'text-success-600' : 'text-error-600'}>
                                  {transaction.type === 'income' ? '+' : '-'}
                                  ${transaction.amount.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`badge ${transaction.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                                  {transaction.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importResult.transactions.length > 10 && (
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-500 text-center">
                        Showing first 10 of {importResult.transactions.length} transactions
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setImportResult(null);
                  }}
                  className="btn-primary"
                >
                  Import More Files
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tips for Better Import Results</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                <p className="text-sm text-gray-600">Use high-quality PDF files with clear, readable text</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                <p className="text-sm text-gray-600">Ensure your PDF has a tabular format with clear column headers</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                <p className="text-sm text-gray-600">Include Date, Description, and Amount columns for best results</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-success-600 mt-0.5" />
                <p className="text-sm text-gray-600">Review imported transactions and make adjustments as needed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
