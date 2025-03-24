import React, { useState, useEffect } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import axios from "../../utils/axios";
import { Link } from "react-router-dom";

function NotificationBadge({ hideCount = false }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/notifications/unread-count");
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link to="/notifications" className="relative p-2 group">
      <div className="relative">
        <BellIcon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
        {!hideCount && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full ring-2 ring-white transform transition-all duration-200 group-hover:scale-110">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {loading && (
        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-gray-300 animate-pulse"></span>
      )}

      {/* Optional tooltip */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "No new notifications"}
      </div>
    </Link>
  );
}

export default NotificationBadge;
