import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import NotificationBadge from "../pages/Notifications/NotificationBadge";
import axiosInstance from "../utils/axios";

function Header() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get("/users/me");
        setUser(response.data); 
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch (error) {
        setUser(null);
        localStorage.removeItem("user"); 
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest(".profile-menu-container")) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  if (loading) {
    return (
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-8 w-8"></div>
          <div className="flex-1 space-y-2 py-1 max-w-lg">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
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
            {/* Notification Badge Component */}
            <NotificationBadge />

            {/* Profile Dropdown */}
            <div className="relative profile-menu-container">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-xl p-2 transition-colors duration-200"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.name
                  )}&background=0D8ABC&color=fff`}
                  alt="User"
                  className="h-8 w-8 rounded-xl ring-2 ring-white"
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                    showProfileMenu ? "transform rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 border border-gray-100 transform origin-top-right transition-all duration-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      Signed in as
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block">
                      {user.role?.name || "User"}
                    </div>
                  </div>
                  <div className="py-1">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center">
                      <UserCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Your Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center">
                      <Cog6ToothIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Settings
                    </button>
                    <Link
                      to="/notifications"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    >
                      <NotificationBadge hideCount={true} />
                      <span className="ml-2">Notifications</span>
                    </Link>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center">
                      <QuestionMarkCircleIcon className="h-4 w-4 mr-2 text-gray-500" />
                      Help Center
                    </button>
                  </div>
                  <div className="py-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2 text-red-500" />
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
