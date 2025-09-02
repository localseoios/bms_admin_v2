import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../utils/axios";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  ClockIcon as ClockIconSolid,
  BellIcon as BellIconSolid,
} from "@heroicons/react/24/solid";

const ComplianceNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchNotifications();
    fetchSummary();
  }, [filter, priorityFilter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: 100,
        status: "active",
      });
      
      if (filter !== "all") {
        params.append("type", filter);
      }
      
      if (priorityFilter !== "all") {
        params.append("priority", priorityFilter);
      }

      const response = await axios.get(`/compliance-notifications?${params}`);
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching compliance notifications:", error);
      toast.error("Error loading notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get("/compliance-notifications/dashboard");
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/compliance-notifications/${notificationId}/read`);
      // Refresh notifications after marking as read
      fetchNotifications();
      fetchSummary();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Error marking notification as read");
    }
  };

  const getNotificationIcon = (type, priority) => {
    const baseClasses = "w-7 h-7";
    
    switch (type) {
      case "document_expired":
        return <ExclamationTriangleIconSolid className={`${baseClasses} text-red-600`} />;
      case "document_expiring_soon":
        return priority === "high" ? 
          <ClockIconSolid className={`${baseClasses} text-orange-600`} /> :
          <ClockIcon className={`${baseClasses} text-yellow-600`} />;
      case "document_uploaded":
        return <DocumentTextIcon className={`${baseClasses} text-blue-600`} />;
      case "document_update":
        return <PencilIcon className={`${baseClasses} text-purple-600`} />;
      case "staff_added":
        return <UserIcon className={`${baseClasses} text-green-600`} />;
      default:
        return <BellIcon className={`${baseClasses} text-gray-600`} />;
    }
  };

  const getNotificationBg = (type, priority, isRead) => {
    const opacity = isRead ? "opacity-75" : "";
    const baseClasses = "bg-white/80 backdrop-blur-sm";
    
    switch (type) {
      case "document_expired":
        return `${baseClasses} border-red-300 hover:border-red-400 shadow-red-100/50 ${opacity}`;
      case "document_expiring_soon":
        return priority === "high" ? 
          `${baseClasses} border-orange-300 hover:border-orange-400 shadow-orange-100/50 ${opacity}` :
          `${baseClasses} border-yellow-300 hover:border-yellow-400 shadow-yellow-100/50 ${opacity}`;
      case "document_uploaded":
        return `${baseClasses} border-blue-300 hover:border-blue-400 shadow-blue-100/50 ${opacity}`;
      case "document_update":
        return `${baseClasses} border-purple-300 hover:border-purple-400 shadow-purple-100/50 ${opacity}`;
      case "staff_added":
        return `${baseClasses} border-green-300 hover:border-green-400 shadow-green-100/50 ${opacity}`;
      default:
        return `${baseClasses} border-gray-300 hover:border-gray-400 shadow-gray-100/50 ${opacity}`;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "critical":
        return (
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-md animate-pulse">
            🚨 Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-md">
            ⚠️ High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-full shadow-md">
            ⚡ Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-md">
            ℹ️ Low
          </span>
        );
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return past.toLocaleDateString();
  };

  const filteredAndSortedNotifications = notifications
    .filter(notification => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (notification.metadata?.staffName && 
          notification.metadata.staffName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "priority":
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case "unread":
          const aUnread = !isRead(a);
          const bUnread = !isRead(b);
          if (aUnread === bUnread) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          return bUnread - aUnread;
        default:
          return 0;
      }
    });

  const isRead = (notification) => {
    return notification.readBy && notification.readBy.length > 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-gray-200/50 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-12 h-12 rounded-xl hover:bg-gray-100 transition-colors shadow-md"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </motion.button>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
                  <div className="relative mr-4">
                    <BellIconSolid className="w-8 h-8 text-purple-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  Compliance Notifications
                </h1>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  📋 Document expiry alerts and compliance management notifications
                </p>
              </div>
            </div>

            {summary && (
              <div className="flex items-center space-x-6">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200"
                >
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Active</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{summary.totalActive}</p>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200"
                >
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Unread</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{summary.unreadCount}</p>
                  {summary.unreadCount > 0 && <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto mt-1 animate-pulse"></div>}
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200"
                >
                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Critical</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{summary.criticalCount}</p>
                  {summary.criticalCount > 0 && <ExclamationTriangleIconSolid className="w-4 h-4 text-red-500 mx-auto mt-1 animate-bounce" />}
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Filters and Search */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 p-6 bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-6 lg:space-y-0 lg:space-x-6">
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Type Filter */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200"
              >
                <FunnelIcon className="w-5 h-5 text-purple-600" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-medium text-gray-700 cursor-pointer min-w-[180px]"
                >
                  <option value="all">🌟 All Types</option>
                  <option value="document_expired">❌ Expired Documents</option>
                  <option value="document_expiring_soon">⏰ Expiring Soon</option>
                  <option value="document_uploaded">📄 Document Uploads</option>
                  <option value="document_update">✏️ Document Updates</option>
                  <option value="staff_added">👥 Staff Management</option>
                </select>
              </motion.div>

              {/* Priority Filter */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-200"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 font-medium text-gray-700 cursor-pointer min-w-[140px]"
                >
                  <option value="all">🎯 All Priority</option>
                  <option value="critical">🚨 Critical</option>
                  <option value="high">⚠️ High</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="low">ℹ️ Low</option>
                </select>
              </motion.div>

              {/* Clear Filters Button */}
              {(filter !== "all" || priorityFilter !== "all" || searchTerm !== "") && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setFilter("all");
                    setPriorityFilter("all");
                    setSearchTerm("");
                    setSortBy("newest");
                  }}
                  className="flex items-center space-x-2 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span>Clear</span>
                </motion.button>
              )}
            </div>

            {/* Search */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="relative bg-white rounded-xl shadow-sm border border-gray-200"
            >
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-600" />
              <input
                type="text"
                placeholder="🔍 Search notifications, staff, messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-transparent border-none rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none w-80 font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </div>

          {/* Active Filters Display */}
          {(filter !== "all" || priorityFilter !== "all") && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 pt-4 border-t border-gray-200/50"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Active filters:</span>
                {filter !== "all" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Type: {filter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {priorityFilter !== "all" && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Priority: {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Notifications List */}
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col justify-center items-center py-16 bg-white/50 rounded-2xl backdrop-blur-sm"
          >
            <div className="relative">
              <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-purple-200 rounded-full animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg font-medium text-gray-700">Loading notifications...</span>
            <span className="text-sm text-gray-500 mt-1">Please wait while we fetch your updates</span>
          </motion.div>
        ) : filteredAndSortedNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/50 rounded-2xl backdrop-blur-sm"
          >
            <div className="relative mb-6">
              <BellIcon className="w-20 h-20 text-gray-300 mx-auto" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-500">0</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">No notifications found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm ? "🔍 No notifications match your search criteria. Try adjusting your filters or search term." : "✨ You're all caught up! No compliance notifications at this time."}
            </p>
            {searchTerm && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors"
              >
                Clear search
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Results Header */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between bg-white/50 rounded-xl p-4 backdrop-blur-sm border border-gray-200/50"
            >
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600">
                  Showing {filteredAndSortedNotifications.length} of {notifications.length} notifications
                </span>
                {filteredAndSortedNotifications.filter(n => !isRead(n)).length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {filteredAndSortedNotifications.filter(n => !isRead(n)).length} unread
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="newest">🕐 Newest First</option>
                  <option value="oldest">🕑 Oldest First</option>
                  <option value="priority">⚠️ Priority</option>
                  <option value="unread">👁️ Unread First</option>
                </select>
              </div>
            </motion.div>

            {/* Notifications List */}
            {filteredAndSortedNotifications.map((notification, index) => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ delay: index * 0.1 }}
                className={`border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm ${getNotificationBg(notification.type, notification.priority, isRead(notification))}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1 p-2 rounded-xl bg-white/50 shadow-sm">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight flex-1 mr-4">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {getPriorityBadge(notification.priority)}
                          {!isRead(notification) && (
                            <div className="relative">
                              <span className="w-3 h-3 bg-purple-600 rounded-full animate-ping absolute"></span>
                              <span className="w-3 h-3 bg-purple-600 rounded-full relative"></span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/80 rounded-lg p-4 mb-4 border-l-4 border-purple-400">
                        <p className="text-sm text-gray-700 leading-relaxed font-medium">
                          {notification.message}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50">
                        <div className="flex items-center space-x-6 text-xs">
                          <span className="flex items-center bg-gray-100/80 rounded-full px-3 py-1.5 font-medium text-gray-600">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.metadata?.staffName && (
                            <span className="flex items-center bg-blue-100/80 rounded-full px-3 py-1.5 font-medium text-blue-700">
                              <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                              {notification.metadata.staffName}
                            </span>
                          )}
                          
                          {notification.metadata?.daysLeft !== undefined && (
                            <span className={`flex items-center rounded-full px-3 py-1.5 font-medium ${
                              notification.metadata.daysLeft <= 0 
                                ? 'bg-red-100/80 text-red-700' 
                                : notification.metadata.daysLeft <= 7 
                                  ? 'bg-orange-100/80 text-orange-700' 
                                  : 'bg-yellow-100/80 text-yellow-700'
                            }`}>
                              <ClockIcon className="w-3.5 h-3.5 mr-1.5" />
                              {notification.metadata.daysLeft <= 0 ? '🚨 EXPIRED' : `⏰ ${notification.metadata.daysLeft} days left`}
                            </span>
                          )}
                        </div>
                        
                        {!isRead(notification) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium px-4 py-2 rounded-full transition-colors shadow-md hover:shadow-lg"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>Mark as read</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceNotifications;