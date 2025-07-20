import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../hooks/useAuth";
import {
  Home,
  PlusCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
  IndianRupee,
  Upload,
  List,
  Receipt,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Transactions", href: "/transactions", icon: List },
    { name: "Add Transaction", href: "/transactions/new", icon: PlusCircle },
    { name: "Add Receipt", href: "/transactions/newreceipt", icon: Receipt },
    { name: "Import Data", href: "/import", icon: Upload },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const isActiveRoute = (item) => {
    const currentPath = router.pathname;
    if (item.href === "/transactions/new" || item.href === "/transactions/newreceipt") {
      return currentPath === item.href;
    }
    return currentPath === item.href || 
           (currentPath.startsWith(item.href) && 
            currentPath !== "/transactions/new" && 
            currentPath !== "/transactions/newreceipt");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col max-w-xs w-full h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center">
                <IndianRupee className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MoneyMuse</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? "bg-primary-100 text-primary-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      className={`mr-3 h-6 w-6 ${
                        isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center">
                <img
                  className="h-10 w-10 rounded-full"
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=3b82f6&color=fff`}
                  alt={user?.name}
                />
                <div className="ml-3 flex-1">
                  <p className="text-base font-medium text-gray-700 truncate">{user?.name}</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="mr-1 h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <IndianRupee className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MoneyMuse</span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-primary-100 text-primary-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-6 w-6 ${
                        isActive ? "text-primary-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <img
                className="h-9 w-9 rounded-full"
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}&background=3b82f6&color=fff`}
                alt={user?.name}
              />
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700 truncate">{user?.name}</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="mr-1 h-3 w-3" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {!sidebarOpen && (
          <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
            <button
              className="h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        )}

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
