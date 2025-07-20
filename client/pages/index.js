import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import {
  IndianRupee,
  TrendingUp,
  Shield,
  BarChart3,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: IndianRupee,
      title: "Track Expenses & Income",
      description:"Easily log and categorize your financial transactions with our intuitive interface.",
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description:"Get insights into your spending patterns with beautiful charts and comprehensive reports.",
    },
    {
      icon: Upload,
      title: "Receipt Processing",
      description:"Upload receipts and PDFs to automatically extract transaction data using OCR technology.",
    },
    {
      icon: TrendingUp,
      title: "Spending Trends",
      description:"Monitor your financial trends over time with detailed analytics and forecasting.",
    },
    {
      icon: Users,
      title: "Multi-User Support",
      description:"Secure individual accounts with complete data isolation and privacy protection.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description:"Your financial data is encrypted and secure. We never share your information.",
    },
  ];

  const bonusFeatures = [
    {
      title: "PDF Transaction Import",
      description:"Upload bank statements and transaction history PDFs for bulk import of financial data.",
    },
    {
      title: "Advanced Pagination",
      description:"Efficiently browse through large datasets with smart pagination and filtering.",
    },
    {
      title: "Multi-User Architecture",
      description: "Complete user management system with secure authentication and data isolation.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-success-50">
      {/* Header */}
      <header className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <div className="flex items-center">
                <IndianRupee className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  MoneyMuse
                </span>
              </div>
            </div>
            <div className="md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
              <Link
                href="/login"
                className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-16 md:py-20">
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 animate-fade-in">
                Take Control of Your
                <span className="text-primary-600"> Finances</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto animate-slide-up text-balance">
                Track expenses, analyze spending patterns, upload receipts, and
                make informed financial decisions with our comprehensive
                personal finance assistant.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                <Link
                  href="/register"
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Start Tracking
                </Link>
                <Link href="/login" className="btn-secondary px-8 py-3 text-lg">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Everything you need to manage your money
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Powerful features designed to help you understand and control
                your finances.
              </p>
            </div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="text-center animate-slide-up card hover:shadow-medium transition-all duration-300"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="card-body">
                        <div className="flex justify-center">
                          <div className="p-3 bg-primary-100 rounded-lg">
                            <Icon className="h-8 w-8 text-primary-600" />
                          </div>
                        </div>
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Advanced Features
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Bonus capabilities that set us apart from other finance apps.
              </p>
            </div>

            <div className="mt-12">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {bonusFeatures.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="card hover:shadow-medium transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.15}s` }}
                  >
                    <div className="card-body">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block text-primary-200">
                Create your account today.
              </span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>
              &copy; 2025 MoneyMuse. All rights reserved. Built with ❤️ for
              better financial management.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}