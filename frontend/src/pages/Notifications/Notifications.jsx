import React, { useState, useEffect } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  ClockIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import axios from "../../utils/axios";

function Notifications() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActions, setShowActions] = useState(null);

  // Icon mapping - maintaining exact component names
  const iconMap = {
    BellIcon: BellIcon,
    BriefcaseIcon: BriefcaseIcon,
    CheckCircleIcon: CheckCircleIcon,
    ExclamationCircleIcon: ExclamationCircleIcon,
    InformationCircleIcon: InformationCircleIcon,
    UserPlusIcon: UserPlusIcon,
    ShieldCheckIcon: ShieldCheckIcon,
    ArrowPathIcon: ArrowPathIcon,
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/notifications");

      // Process notifications to add icon components
      const processedNotifications = response.data.map((notification) => {
        // Default to BellIcon if the specified icon doesn't exist
        const IconComponent = iconMap[notification.iconType] || BellIcon;

        return {
          ...notification,
          icon: IconComponent,
        };
      });

      setNotifications(processedNotifications);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("/notifications/mark-read", {});
      fetchNotifications(); // Refresh the list
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put("/notifications/mark-read", {
        notificationIds: [id],
      });
      fetchNotifications(); // Refresh the list
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, []);

  const filters = [
    { name: "all", label: "All", count: notifications.length },
    {
      name: "unread",
      label: "Unread",
      count: notifications.filter((n) => n.status === "unread").length,
    },
    {
      name: "job",
      label: "Jobs",
      count: notifications.filter((n) => n.type === "job").length,
    },
    {
      name: "role",
      label: "Roles",
      count: notifications.filter((n) => n.type === "role").length,
    },
    {
      name: "user",
      label: "Users",
      count: notifications.filter((n) => n.type === "user").length,
    },
    {
      name: "system",
      label: "System",
      count: notifications.filter((n) => n.type === "system").length,
    },
    {
      name: "security",
      label: "Security",
      count: notifications.filter((n) => n.type === "security").length,
    },
  ];

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "unread") return notification.status === "unread";
    return notification.type === selectedFilter;
  });

  // The time string is already formatted by the backend, just return it
  const getRelativeTime = (timeString) => {
    return timeString;
  };

  const handleActionsToggle = (id) => {
    setShowActions(showActions === id ? null : id);
  };

  // Toggle between read and unread states
  const toggleReadStatus = async (notification) => {
    try {
      // If it's already read, we don't have a direct API to mark as unread
      // This could be added to the backend, but for now we'll only support marking as read
      if (notification.status === "unread") {
        await markAsRead(notification._id);
      }
      // For completeness, we could add a markAsUnread API endpoint
      setShowActions(null);
    } catch (error) {
      console.error("Error toggling notification status:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BellIcon className="h-7 w-7 mr-2 text-blue-600" />
            Notifications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with the latest activities and system alerts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
            <ClockIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {notifications.filter((n) => n.status === "unread").length} unread
            </span>
          </div>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors duration-200"
          >
            <CheckIcon className="h-4 w-4" />
            Mark all as read
          </button>
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors duration-200"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex items-center p-4 space-x-3 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setSelectedFilter(filter.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                  selectedFilter === filter.name
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedFilter === filter.name
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-2"></div>
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 flex flex-col items-center">
              <ExclamationCircleIcon className="h-8 w-8 mb-2" />
              <p>Error: {error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <BellIcon className="h-12 w-12 text-gray-300 mb-2" />
              <p>No notifications found</p>
              {selectedFilter !== "all" && (
                <button
                  onClick={() => setSelectedFilter("all")}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-500"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`relative p-4 transition-colors duration-200 hover:bg-blue-50 ${
                  notification.status === "unread" ? "bg-blue-50/50" : ""
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-xl ${notification.bgColor}`}>
                    <notification.icon
                      className={`h-6 w-6 ${notification.iconColor}`}
                    />
                  </div>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() =>
                      notification.status === "unread" &&
                      markAsRead(notification._id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-0.5 flex items-center">
                          {notification.title}
                          {notification.status === "unread" && (
                            <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full"></span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {notification.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          {getRelativeTime(notification.time)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionsToggle(notification._id);
                          }}
                          className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Actions
                        </button>
                      </div>
                    </div>

                    {/* Related entity link if available */}
                    {notification.relatedTo && (
                      <div className="mt-2">
                        <a
                          href={`/${notification.relatedTo.model.toLowerCase()}s/${
                            notification.relatedTo.id
                          }`}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-500 bg-blue-50 px-2 py-1 rounded-md"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          View {notification.relatedTo.model}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action dropdown */}
                {showActions === notification._id && (
                  <div className="absolute right-4 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-32">
                    <button
                      onClick={() => toggleReadStatus(notification)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
                      {notification.status === "unread"
                        ? "Mark read"
                        : "Mark unread"}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        // This would require a new API endpoint
                        console.log("Remove notification:", notification._id);
                        setShowActions(null);
                      }}
                    >
                      <TrashIcon className="h-4 w-4 mr-2 text-red-500" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Notification controls footer */}
        {filteredNotifications.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length}{" "}
              notifications
            </span>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Mark all as read
              </button>
              <button
                className="text-sm text-gray-600 hover:text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                onClick={() => {
                  // This would require a new API endpoint
                  console.log("Clear all notifications");
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
