import React, { useState } from "react";
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function Notifications() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [notifications] = useState([
    {
      id: 1,
      title: "New Role Created",
      description:
        'A new role "Senior Manager" has been created with custom permissions.',
      time: "5 minutes ago",
      type: "role",
      status: "unread",
      icon: ShieldCheckIcon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: 2,
      title: "System Update Complete",
      description: "The system has been successfully updated to version 2.1.0.",
      time: "1 hour ago",
      type: "system",
      status: "read",
      icon: ArrowPathIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: 3,
      title: "New User Added",
      description: "Sarah Johnson has been added as an Administrator.",
      time: "2 hours ago",
      type: "user",
      status: "unread",
      icon: UserPlusIcon,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: 4,
      title: "Security Alert",
      description:
        "Multiple failed login attempts detected from IP 192.168.1.1",
      time: "3 hours ago",
      type: "security",
      status: "unread",
      icon: ExclamationCircleIcon,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      id: 5,
      title: "Maintenance Scheduled",
      description: "System maintenance scheduled for tomorrow at 2:00 AM UTC.",
      time: "5 hours ago",
      type: "system",
      status: "read",
      icon: InformationCircleIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ]);

  const filters = [
    { name: "all", label: "All" },
    { name: "unread", label: "Unread" },
    { name: "role", label: "Roles" },
    { name: "user", label: "Users" },
    { name: "system", label: "System" },
    { name: "security", label: "Security" },
  ];

  const filteredNotifications = notifications.filter((notification) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "unread") return notification.status === "unread";
    return notification.type === selectedFilter;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with the latest activities and system alerts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {notifications.filter((n) => n.status === "unread").length} unread
          </span>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex items-center p-4 space-x-4 overflow-x-auto">
            {filters.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setSelectedFilter(filter.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  selectedFilter === filter.name
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 transition-colors duration-200 hover:bg-gray-50 ${
                notification.status === "unread" ? "bg-gray-50" : ""
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-xl ${notification.bgColor}`}>
                  <notification.icon
                    className={`h-6 w-6 ${notification.iconColor}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500">{notification.time}</p>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {notification.description}
                  </p>
                </div>
                {notification.status === "unread" && (
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
