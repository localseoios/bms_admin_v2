import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../utils/axios";

function Header() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications] = useState([
    {
      id: 1,
      text: 'New role "Manager" was created',
      time: "5m ago",
      type: "role",
    },
    {
      id: 2,
      text: "Sarah Johnson was added as Admin",
      time: "1h ago",
      type: "user",
    },
    {
      id: 3,
      text: "System permissions updated",
      time: "2h ago",
      type: "system",
    },
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get("/users/me");
        setUser(response.data); // { _id, name, email, role }
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        setUser(null);
        localStorage.removeItem("user"); // Clear if token is invalid/expired
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleNotificationClick = () => {
    setShowNotifications(false);
    navigate("/notifications");
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.get("/auth/logout");
      localStorage.removeItem("user");
      setUser(null); // Update state immediately
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 fixed w-full z-30">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                N
              </h1>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-tight">
              NEWOON
            </h1>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-gray-50 transition-all duration-200"
              placeholder="Search users, roles, or permissions..."
            />
          </div>
        </div>

        {/* Right Section */}
        {user ? (
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-gray-100 relative transition-colors duration-200"
              >
                <BellIcon className="h-6 w-6 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Recent Notifications
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                        onClick={handleNotificationClick}
                      >
                        <p className="text-sm text-gray-600">
                          {notification.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      onClick={handleNotificationClick}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl p-2 transition-colors duration-200"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${user.name}&background=0D8ABC&color=fff`}
                  alt="User"
                  className="h-8 w-8 rounded-xl ring-2 ring-white"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    showProfileMenu ? "transform rotate-180" : ""
                  }`}
                />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      Signed in as
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                      Your Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                      Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                      Help Center
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors duration-200"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
