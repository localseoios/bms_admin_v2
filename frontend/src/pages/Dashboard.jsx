// Dashboard.jsx - Fixed to work with backend API response structure
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  EyeIcon,
  SparklesIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import axiosInstance from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import ViewAllExpiringJobsModal from "./ViewAllExpiringJobsModal";

const COLORS = [
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#EC4899",
  "#F43F5E",
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState("monthly");
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [stats, setStats] = useState([]);
  const [jobTrendsData, setJobTrendsData] = useState([]);
  const [taskCompletionData, setTaskCompletionData] = useState([]);
  const [serviceDistributionData, setServiceDistributionData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [expiringJobs, setExpiringJobs] = useState([]);
  const [expiringJobsError, setExpiringJobsError] = useState(null);

  // Modal state
  const [showAllExpiringJobs, setShowAllExpiringJobs] = useState(false);
  const [totalUsersData, setTotalUsersData] = useState([]);
  const [showTotalUsersModal, setShowTotalUsersModal] = useState(false);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [onlineUsersData, setOnlineUsersData] = useState([]);

  // Helper function to get urgency display info based on backend data
  // UPDATED: Helper function to get urgency display info with new expiryType
  const getUrgencyDisplayInfo = (job) => {
    // Normalize urgency level to lowercase to match expected keys
    const urgencyLevel =
      job.urgencyLevel && typeof job.urgencyLevel === "string"
        ? job.urgencyLevel.toLowerCase()
        : job.urgencyLevel;
    const urgencyText = job.urgencyDescription || job.urgencyText;
    const expiryType = job.expiryType || "Document";

    let urgencyColor, urgencyIcon;

    switch (urgencyLevel) {
      case "expired":
        urgencyColor = "text-red-700 bg-red-100 border-red-200";
        urgencyIcon = XCircleIcon;
        break;
      case "critical":
        urgencyColor = "text-red-700 bg-red-100 border-red-200";
        urgencyIcon = ExclamationTriangleIcon;
        break;
      case "warning":
        urgencyColor = "text-orange-700 bg-orange-100 border-orange-200";
        urgencyIcon = ClockIcon;
        break;
      default:
        urgencyColor = "text-green-700 bg-green-100 border-green-200";
        urgencyIcon = CheckCircleIcon;
    }

    return {
      urgencyLevel,
      urgencyText,
      urgencyColor,
      urgencyIcon,
      expiryType, // Pass through the expiry type
    };
  };

  // UPDATED: Expiring Jobs section in the Dashboard render with expiryType display
const renderExpiringJobsSection = () => {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Expiring Documents
        </h2>
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-600">
            {expiringJobs.length} alerts
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : expiringJobsError ? (
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-orange-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-2">Cannot load expiring jobs</p>
          <p className="text-xs text-gray-400">{expiringJobsError}</p>
          <button
            onClick={() => {
              setExpiringJobsError(null);
              fetchExpiringJobs().then(setExpiringJobs);
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Try Again
          </button>
        </div>
      ) : expiringJobs && expiringJobs.length > 0 ? (
        <div className="space-y-4">
          {/* CHANGED: Show more documents instead of limiting to 5 */}
          {expiringJobs.slice(0, 10).map((job, index) => {
            const UrgencyIcon = job.urgencyIcon;

            return (
              <div
                key={`${job.jobId}-${job.expiryType}-${index}`} // Better key for multiple docs per job
                className={`p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 ${
                  job.urgencyLevel === "expired"
                    ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200"
                    : job.urgencyLevel === "critical"
                    ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200"
                    : "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {job.clientName}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${job.urgencyColor}`}
                      >
                        <UrgencyIcon className="h-3 w-3 mr-1" />
                        {job.urgencyText}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600">
                        {job.serviceType} • Job #{job.jobNumber || "N/A"}
                      </p>
                      {job.isServiceCompleted && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Service Complete
                        </span>
                      )}
                    </div>
                    
                    {/* ENHANCED: Better document type display */}
                    <p className="text-xs font-medium text-blue-700 mb-2">
                      📄 {job.expiryType}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Expires: {formatExpiryDate(job.expiryDate)}
                      </span>
                      {job.urgencyLevel === "expired" && (
                        <span className="text-red-600 font-medium">
                          {job.isServiceCompleted ? "RENEWAL REQUIRED" : "ACTION REQUIRED"}
                        </span>
                      )}
                    </div>
                    
                    {job.isServiceCompleted && job.urgencyLevel !== "normal" && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-3 w-3 mr-1" />
                          Document renewal required for completed service
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* UPDATED: Better summary display */}
          {expiringJobs.length > 0 && (
            <div className="text-center pt-4">
              <button
                onClick={() => setShowAllExpiringJobs(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
              >
                {expiringJobs.length > 10
                  ? `View all ${expiringJobs.length} expiring documents`
                  : expiringJobs.length === 1
                  ? "View document details"
                  : `View all ${expiringJobs.length} expiring documents`}
              </button>
              
              {/* ADDED: Show unique jobs count */}
              {(() => {
                const uniqueJobIds = [...new Set(expiringJobs.map(job => job.jobId))];
                return uniqueJobIds.length < expiringJobs.length ? (
                  <p className="text-xs text-gray-500 mt-1">
                    From {uniqueJobIds.length} unique job{uniqueJobIds.length !== 1 ? 's' : ''}
                  </p>
                ) : null;
              })()}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No documents expiring soon</p>
          <p className="text-xs text-gray-400 mt-1">All your documents are up to date</p>
          <button
            onClick={() => setShowAllExpiringJobs(true)}
            className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
          >
            View all documents
          </button>
        </div>
      )}
    </div>
  );
};

  // Helper function to format expiry date for display
  const formatExpiryDate = (expiryDate) => {
    return new Date(expiryDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Fetch all dashboard data on mount and when refreshing
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dashboardResponse, usersResponse, onlineUsersResponse, expiringJobsData] = await Promise.all([
        axiosInstance.get("/jobs/dashboard-stats"),
        axiosInstance.get("/users/dashboard-users"),
        axiosInstance.get("/users/online"),
        fetchExpiringJobs(),
      ]);

      const jobsData = dashboardResponse.data.jobs || [];
      const users = usersResponse.data || [];
      const onlineUsers = onlineUsersResponse.data?.data || [];

      setTotalUsersData(users);
      setOnlineUsersData(onlineUsers);

      const statsData = buildStatsFromData(jobsData, users, onlineUsers);
      setStats(statsData);

      processJobsData(jobsData);
      processServicesData(jobsData);

      const activitiesData = buildRecentActivity(jobsData);
      setRecentActivity(activitiesData);

      setExpiringJobs(expiringJobsData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed fetchExpiringJobs function for Dashboard.jsx

// FIXED: fetchExpiringJobs function in Dashboard.jsx
const fetchExpiringJobs = async () => {
  try {
    setExpiringJobsError(null);
    console.log("🔍 Fetching future expiring documents from dashboard (2 months, excluding expired)...");

    const response = await axiosInstance.get("/operations/dashboard/expiring-jobs");
    console.log("📋 Dashboard API response:", response.data);

    let jobsData = [];

    if (response.data) {
      if (response.data.success && Array.isArray(response.data.data)) {
        jobsData = response.data.data;
        console.log(`✅ Successfully received ${jobsData.length} expiring documents`);
        
        if (response.data.summary) {
          console.log("📊 Backend summary:", response.data.summary);
        }
      } else if (Array.isArray(response.data)) {
        jobsData = response.data;
      } else {
        console.warn("❌ Unexpected response structure:", response.data);
        jobsData = [];
      }
    }

    const validJobs = jobsData.filter((job) => job && job.clientName);
    if (validJobs.length !== jobsData.length) {
      console.warn(`⚠️ Filtered out ${jobsData.length - validJobs.length} invalid jobs`);
    }

    const processedJobs = validJobs.map((job) => {
      const processedJob = {
        jobId: job.jobId || job._id,
        jobNumber: job.jobNumber || "N/A",
        clientName: job.clientName || "Unknown Client",
        companyName: job.companyName || job.clientName || "Unknown Company",
        serviceType: job.serviceType || "Unknown Service",
        status: job.status || "unknown",
        expiryDate: job.expiryDate,
        expiryType: job.expiryType || "Document",
        daysUntilExpiry: job.daysUntilExpiry || 0,
        urgencyLevel: (job.urgencyLevel && job.urgencyLevel.toLowerCase()) || "normal",
        urgencyDescription: job.urgencyDescription || "No description",
        assignedPerson: job.assignedPerson || { name: "Unassigned" },
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      };

      const urgencyDisplayInfo = getUrgencyDisplayInfo(processedJob);
      return {
        ...processedJob,
        ...urgencyDisplayInfo,
      };
    });

    // REMOVED: Artificial grouping and limiting that was hiding multiple expired docs per job
    // Previously was creating "balanced" display that limited expired docs
    // Now we show ALL expired documents

    console.log(`📋 Dashboard showing ${processedJobs.length} future expiring documents`);
    
    // Group by urgency for logging (excluding expired since we no longer show them)
    const urgencyBreakdown = {
      critical: processedJobs.filter(job => job.urgencyLevel === 'critical').length,
      warning: processedJobs.filter(job => job.urgencyLevel === 'warning').length,
      normal: processedJobs.filter(job => job.urgencyLevel === 'normal').length,
    };
    
    console.log("📊 Dashboard urgency breakdown:", urgencyBreakdown);

    // Show breakdown by unique jobs
    const uniqueJobIds = [...new Set(processedJobs.map(job => job.jobId))];
    console.log(`📈 ${processedJobs.length} documents from ${uniqueJobIds.length} unique jobs`);

    return processedJobs; // Return ALL processed jobs, no artificial limits
    
  } catch (error) {
    console.error("❌ Error fetching all expiring jobs:", error);
    setExpiringJobsError(`Failed to load expiring jobs: ${error.message}`);
    return [];
  }
};

  const buildStatsFromData = (jobsData, users, onlineUsers) => {
    const isAdmin = user?.role?.name === "admin";
    const totalJobs = jobsData.length;
    const totalUsers = users.length;
    const completedJobs = jobsData.filter((job) =>
      ["completed", "fully_completed_bra"].includes(job.status)
    ).length;
    const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

    return [
      {
        name: "Total Jobs",
        value: totalJobs.toString(),
        change: "+12.5%",
        changeType: "positive",
        icon: BriefcaseIcon,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        onClick: isAdmin ? () => navigate("/admin/jobs") : null,
        isClickable: isAdmin,
      },
      {
        name: "Total Users",
        value: totalUsers.toString(),
        change: "+3.2%",
        changeType: "positive",
        icon: UserGroupIcon,
        bgColor: "bg-blue-50",
        iconColor: "text-blue-600",
        onClick: isAdmin ? () => setShowTotalUsersModal(true) : null,
        isClickable: isAdmin,
      },
      {
        name: "Online Users",
        value: onlineUsers.length.toString(),
        change: "+1.5%",
        changeType: "positive",
        icon: UserGroupIcon,
        bgColor: "bg-emerald-50",
        iconColor: "text-emerald-600",
        onClick: isAdmin ? () => setShowOnlineUsersModal(true) : null,
        isClickable: isAdmin,
      },
      {
        name: "Completion Rate",
        value: `${completionRate}%`,
        change: "+2.3%",
        changeType: "positive",
        icon: CheckCircleIcon,
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
        onClick: isAdmin ? () => navigate("/admin/jobs") : null,
        isClickable: isAdmin,
      },
    ];
  };

  const buildRecentActivity = (jobs) => {
    const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sortedJobs.slice(0, 5).map((job) => {
      let activityType, activityStatus, icon, description;
      switch (job.status) {
        case "pending":
          activityType = "job";
          activityStatus = "pending";
          icon = BuildingOfficeIcon;
          description = `${job.serviceType} job submitted for ${job.clientName}`;
          break;
        case "completed":
        case "fully_completed_bra":
        case "om_completed":
          activityType = "task";
          activityStatus = "completed";
          icon = DocumentTextIcon;
          description = `${job.serviceType} completed for ${job.clientName}`;
          break;
        case "kyc_pending":
        case "bra_pending":
          activityType = "alert";
          activityStatus = "warning";
          icon = ExclamationCircleIcon;
          description = `${job.status === "kyc_pending" ? "KYC" : "BRA"} process pending for ${job.clientName}`;
          break;
        default:
          activityType = "job";
          activityStatus = "pending";
          icon = BuildingOfficeIcon;
          description = `${job.serviceType} job for ${job.clientName}`;
      }
      const createdAt = new Date(job.createdAt);
      const now = new Date();
      const diffMs = now - createdAt;
      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      let timestamp;
      if (diffMinutes < 60) {
        timestamp = `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
      } else if (diffHours < 24) {
        timestamp = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      } else {
        timestamp = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
      }
      return {
        id: job._id,
        type: activityType,
        title: job.serviceType,
        description,
        timestamp,
        status: activityStatus,
        icon,
      };
    });
  };

  // Fetch and calculate statistics (kept for backward compatibility)
  const fetchStats = async () => {
    try {
      const isAdmin = user?.role?.name === "admin";

      // Fetch dashboard stats and user data in parallel
      const [dashboardResponse, usersResponse, onlineUsersResponse] = await Promise.all([
        axiosInstance.get("/jobs/dashboard-stats"),
        axiosInstance.get("/users/dashboard-users"),
        axiosInstance.get("/users/online"),
      ]);

      const jobsData = dashboardResponse.data.jobs || [];
      const users = usersResponse.data || [];
      const onlineUsers = onlineUsersResponse.data?.data || [];

      setTotalUsersData(users);
      setOnlineUsersData(onlineUsers);

      // Calculate statistics from the responses
      const totalJobs = jobsData.length;
      const totalUsers = users.length;

      // Calculate completion rate
      const completedJobs = jobsData.filter((job) =>
        ["completed", "fully_completed_bra"].includes(job.status)
      ).length;
      const completionRate =
        totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

      return [
        {
          name: "Total Jobs",
          value: totalJobs.toString(),
          change: "+12.5%",
          changeType: "positive",
          icon: BriefcaseIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          onClick: isAdmin ? () => navigate("/admin/jobs") : null,
          isClickable: isAdmin,
        },
        {
          name: "Total Users",
          value: totalUsers.toString(),
          change: "+3.2%",
          changeType: "positive",
          icon: UserGroupIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
          onClick: isAdmin ? () => setShowTotalUsersModal(true) : null,
          isClickable: isAdmin,
        },
        {
          name: "Online Users",
          value: onlineUsers.length.toString(),
          change: "+1.5%",
          changeType: "positive",
          icon: UserGroupIcon,
          bgColor: "bg-emerald-50",
          iconColor: "text-emerald-600",
          onClick: isAdmin ? () => setShowOnlineUsersModal(true) : null,
          isClickable: isAdmin,
        },
        {
          name: "Completion Rate",
          value: `${completionRate}%`,
          change: "+2.3%",
          changeType: "positive",
          icon: CheckCircleIcon,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
          onClick: isAdmin ? () => navigate("/admin/jobs") : null,
          isClickable: isAdmin,
        },
      ];
    } catch (error) {
      console.error("Error fetching stats:", error);
      return [
        {
          name: "Total Jobs",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: BriefcaseIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          name: "Total Users",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: UserGroupIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          name: "Online Users",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: UserGroupIcon,
          bgColor: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          name: "Completion Rate",
          value: "0%",
          change: "0%",
          changeType: "neutral",
          icon: CheckCircleIcon,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
        },
      ];
    }
  };

  // Fetch jobs data for trends
  const fetchJobsData = async () => {
    try {
      const response = await axiosInstance.get("/jobs/dashboard-stats");
      return response.data.jobs || [];
    } catch (error) {
      console.error("Error fetching jobs data:", error);
      return [];
    }
  };

  // Process jobs data for charts
  const processJobsData = (jobs) => {
    // Process job trends by month or according to selected timeframe
    const trends = processJobTrends(jobs, selectedTimeframe);
    setJobTrendsData(trends.trendData);

    // Process task completion data
    setTaskCompletionData(processTaskCompletionData(jobs));
  };

  const processJobTrends = (jobs, timeframe) => {
    // Group jobs by time period based on selected timeframe
    const groupedJobs = {};
    const groupedRevenue = {}; // Assuming we have revenue data per job

    // Get current date
    const now = new Date();
    let periods = [];
    let format = "";

    // Define time periods based on selected timeframe
    switch (timeframe) {
      case "daily":
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split("T")[0];
          periods.push({ key, name: `Day ${7 - i}` });
          groupedJobs[key] = 0;
          groupedRevenue[key] = 0;
        }
        format = "date";
        break;

      case "weekly":
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const key = `Week ${4 - i}`;
          periods.push({ key, name: key });
          groupedJobs[key] = 0;
          groupedRevenue[key] = 0;
        }
        format = "week";
        break;

      case "yearly":
        // Last 6 years
        const currentYear = now.getFullYear();
        for (let i = 5; i >= 0; i--) {
          const year = currentYear - i;
          periods.push({ key: year.toString(), name: year.toString() });
          groupedJobs[year] = 0;
          groupedRevenue[year] = 0;
        }
        format = "year";
        break;

      case "monthly":
      default:
        // Last 7 months
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const monthIndex = date.getMonth();
          const year = date.getFullYear();
          const key = `${year}-${monthIndex + 1}`;
          periods.push({ key, name: monthNames[monthIndex] });
          groupedJobs[key] = 0;
          groupedRevenue[key] = 0;
        }
        format = "month";
        break;
    }

    // Count jobs per period
    jobs.forEach((job) => {
      const jobDate = new Date(job.createdAt);
      let key;

      switch (format) {
        case "date":
          key = jobDate.toISOString().split("T")[0];
          break;
        case "week":
          // Calculate week number (rough approximation)
          const weekNum = Math.ceil((jobDate.getDate() - 1) / 7);
          key = `Week ${weekNum}`;
          break;
        case "year":
          key = jobDate.getFullYear().toString();
          break;
        case "month":
        default:
          key = `${jobDate.getFullYear()}-${jobDate.getMonth() + 1}`;
          break;
      }

      if (groupedJobs[key] !== undefined) {
        groupedJobs[key]++;
        // Add mock revenue data (in a real app, this would come from actual job data)
        groupedRevenue[key] += Math.floor(Math.random() * 1000) + 500;
      }
    });

    // Convert to array format for charts
    const trendData = periods.map((period) => ({
      name: period.name,
      jobs: groupedJobs[period.key] || 0,
      revenue: groupedRevenue[period.key] || 0,
    }));

    return { trendData };
  };

  const processTaskCompletionData = (jobs) => {
    // For task completion data, we'll use the job status to determine completed vs pending
    // Group into weekly buckets for the bar chart

    // Get current date
    const now = new Date();
    const weekData = [];

    // Create 4 weeks of data
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Filter jobs that were created in this week
      const weekJobs = jobs.filter((job) => {
        const jobDate = new Date(job.createdAt);
        return jobDate >= weekStart && jobDate <= weekEnd;
      });

      // Count completed and pending jobs
      const completed = weekJobs.filter((job) =>
        ["completed", "fully_completed_bra", "om_completed"].includes(
          job.status
        )
      ).length;

      const pending = weekJobs.filter((job) =>
        ["pending", "approved", "kyc_pending", "bra_pending"].includes(
          job.status
        )
      ).length;

      weekData.push({
        name: `Week ${4 - i}`,
        completed,
        pending,
      });
    }

    return weekData;
  };

  // Fetch services data for pie chart - using actual job data
  const fetchServicesData = async () => {
    try {
      const response = await axiosInstance.get("/jobs/dashboard-stats");
      return response.data.jobs || [];
    } catch (error) {
      console.error("Error fetching jobs data for services:", error);
      return [];
    }
  };

  // Process services data for pie chart - count jobs by serviceType
  const processServicesData = (jobs) => {
    const serviceMap = {};

    jobs.forEach((job) => {
      const serviceType = job.serviceType || "Other";
      if (serviceMap[serviceType]) {
        serviceMap[serviceType].value += 1;
      } else {
        serviceMap[serviceType] = {
          name: serviceType,
          value: 1,
        };
      }
    });

    // Convert to array and sort by value (highest first)
    const servicesData = Object.values(serviceMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Limit to 6 categories for the pie chart

    if (servicesData.length === 0) {
      setServiceDistributionData([{ name: "No Data", value: 1 }]);
    } else {
      setServiceDistributionData(servicesData);
    }
  };

  // Fetch recent activity for activity feed
  const fetchRecentActivity = async () => {
    try {
      // Use dashboard stats endpoint accessible to all users
      const response = await axiosInstance.get("/jobs/dashboard-stats");
      const jobs = response.data.jobs || [];

      // Sort jobs by createdAt date (newest first)
      const sortedJobs = [...jobs].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Take the 5 most recent jobs and map them to activity format
      return sortedJobs.slice(0, 5).map((job) => {
        // Determine activity type and status based on job status
        let activityType, activityStatus, icon, description;

        switch (job.status) {
          case "pending":
            activityType = "job";
            activityStatus = "pending";
            icon = BuildingOfficeIcon;
            description = `${job.serviceType} job submitted for ${job.clientName}`;
            break;
          case "completed":
          case "fully_completed_bra":
          case "om_completed":
            activityType = "task";
            activityStatus = "completed";
            icon = DocumentTextIcon;
            description = `${job.serviceType} completed for ${job.clientName}`;
            break;
          case "kyc_pending":
          case "bra_pending":
            activityType = "alert";
            activityStatus = "warning";
            icon = ExclamationCircleIcon;
            description = `${
              job.status === "kyc_pending" ? "KYC" : "BRA"
            } process pending for ${job.clientName}`;
            break;
          default:
            activityType = "job";
            activityStatus = "pending";
            icon = BuildingOfficeIcon;
            description = `${job.serviceType} job for ${job.clientName}`;
        }

        // Format the relative time (e.g., "2 hours ago")
        const createdAt = new Date(job.createdAt);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timestamp;
        if (diffMinutes < 60) {
          timestamp = `${diffMinutes} minute${
            diffMinutes !== 1 ? "s" : ""
          } ago`;
        } else if (diffHours < 24) {
          timestamp = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
        } else {
          timestamp = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
        }

        return {
          id: job._id,
          type: activityType,
          title: job.serviceType,
          description,
          timestamp,
          status: activityStatus,
          icon,
        };
      });
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return [];
    }
  };

  // Handle refreshing dashboard data
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData().finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "warning":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "warning":
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Dashboard Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff33_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#ffffff33_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
      <div className="max-w-7xl mx-auto relative">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
                <SparklesIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard Overview
                </h1>
                <p className="mt-2 text-base text-gray-600">
                  {user?.name
                    ? `Welcome back, ${user.name}`
                    : "Track your business metrics and performance insights"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className={`p-2.5 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-white/80 hover:shadow-md transition-all duration-200 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                disabled={isLoading || isRefreshing}
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="rounded-xl border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white/80 shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <button className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-lg">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 xl:grid-cols-4">
          {isLoading
            ? // Skeleton loaders for stats
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
                  >
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
                        <div className="flex-1">
                          <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
                          <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="h-4 w-20 bg-gray-200 rounded mt-4"></div>
                    </div>
                  </div>
                ))
            : stats.map((stat, index) => (
                <div
                  key={stat.name}
                  className={`group relative bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ${
                    stat.isClickable ? 'cursor-pointer' : ''
                  }`}
                  onClick={stat.onClick || (() => {})}
                >
                  <div className="p-5">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-3.5 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                      >
                        <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {stat.name}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-0.5">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center">
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          stat.changeType === "positive"
                            ? "bg-green-100 text-green-700"
                            : stat.changeType === "negative"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {stat.changeType === "positive" ? (
                          <ArrowUpIcon className="h-3 w-3 mr-1" />
                        ) : stat.changeType === "negative" ? (
                          <ArrowDownIcon className="h-3 w-3 mr-1" />
                        ) : null}
                        <span>{stat.change}</span>
                      </div>
                      <span className="ml-2 text-xs text-gray-500">vs last month</span>
                    </div>
                  </div>
                  <div className={`h-1 w-full ${
                    stat.iconColor === "text-blue-600" ? "bg-gradient-to-r from-blue-400 to-blue-600" :
                    stat.iconColor === "text-purple-600" ? "bg-gradient-to-r from-purple-400 to-purple-600" :
                    stat.iconColor === "text-emerald-600" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                    stat.iconColor === "text-green-600" ? "bg-gradient-to-r from-green-400 to-green-600" :
                    "bg-gradient-to-r from-gray-400 to-gray-600"
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                </div>
              ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-8 mb-8 lg:grid-cols-2">
          {/* Area Chart - Job Trends */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Job Trends
              </h2>
              <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {selectedTimeframe === "yearly"
                    ? "+12.3% vs last year"
                    : "+15.3% vs last period"}
                </span>
              </div>
            </div>

            <div className="h-80">
              {isLoading ? (
                <div className="animate-pulse flex flex-col h-full justify-center items-center">
                  <div className="w-full h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="w-full h-64 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={jobTrendsData}>
                    <defs>
                      <linearGradient
                        id="jobsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6B7280"
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="jobs"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#jobsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Bar Chart - Task Completion */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Task Completion
              </h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="rounded-xl border-gray-200 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white/80 shadow-sm hover:shadow-md transition-all duration-200"
                disabled={isLoading}
              >
                <option value="all">All Tasks</option>
                <option value="registration">Registration</option>
                <option value="filing">Filing</option>
                <option value="licensing">Licensing</option>
              </select>
            </div>
            <div className="h-80">
              {isLoading ? (
                <div className="animate-pulse flex flex-col h-full justify-center items-center">
                  <div className="w-full h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="w-full h-64 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskCompletionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#6B7280"
                      tick={{ fill: "#4B5563", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        paddingTop: "20px",
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill="#3B82F6"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      fill="#6B7280"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid - Updated Expiring Jobs with proper notification system */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Service Distribution */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Service Distribution
              </h2>
              <button
                onClick={() => navigate("/admin/services")}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="h-64">
              {isLoading ? (
                <div className="animate-pulse flex h-full justify-center items-center">
                  <div className="w-40 h-40 bg-gray-200 rounded-full"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "none",
                        borderRadius: "0.75rem",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        padding: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{
                        paddingTop: "20px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Recent Activity
              </h2>
              <button
                onClick={() => navigate("/admin/jobs")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
              >
                View All
              </button>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-6">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 w-2/3 bg-gray-200 rounded mb-3"></div>
                        <div className="flex space-x-3">
                          <div className="h-3 w-20 bg-gray-200 rounded"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flow-root">
                <ul role="list" className="-mb-8">
                  {recentActivity.slice(0, 3).map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== 2 && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div
                            className={`relative p-2 rounded-xl shadow-sm ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            <activity.icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {activity.title}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {activity.description}
                            </p>
                            <div className="mt-2 flex items-center space-x-4">
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1.5" />
                                {activity.timestamp}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* FIXED: Expiring Jobs with proper backend integration */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Future Expiring Documents
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate("/admin/jobs")}
                  className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200"
                  title="View all jobs"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium text-orange-600 ml-1">
                    {expiringJobs.length} alerts
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
                    </div>
                  ))}
              </div>
            ) : expiringJobsError ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-2">
                  Cannot load expiring jobs
                </p>
                <p className="text-xs text-gray-400">{expiringJobsError}</p>
                <button
                  onClick={() => {
                    setExpiringJobsError(null);
                    fetchExpiringJobs().then(setExpiringJobs);
                  }}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : expiringJobs && expiringJobs.length > 0 ? (
              <div className="space-y-4">
                {expiringJobs.slice(0, 5).map((job, index) => {
                  const UrgencyIcon = job.urgencyIcon;

                  return (
                    <div
                      key={`${job.jobId}-${job.expiryType}-${index}`}
                      onClick={() => navigate(`/job/${job.jobId}?expiryType=${encodeURIComponent(job.expiryType || '')}`)}
                      className={`p-4 rounded-lg border-2 hover:shadow-md transition-all duration-200 cursor-pointer ${
                        job.urgencyLevel === "expired"
                          ? "bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:border-red-400"
                          : job.urgencyLevel === "critical"
                          ? "bg-gradient-to-r from-red-50 to-orange-50 border-red-200 hover:border-orange-400"
                          : "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 hover:border-yellow-400"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {job.clientName}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${job.urgencyColor}`}
                            >
                              <UrgencyIcon className="h-3 w-3 mr-1" />
                              {job.urgencyText}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">
                            {job.serviceType} • Job #{job.jobNumber || "N/A"}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              Expires: {formatExpiryDate(job.expiryDate)}
                            </span>
                            {job.urgencyLevel === "expired" && (
                              <span className="text-red-600 font-medium">
                                ACTION REQUIRED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {expiringJobs.length > 0 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => setShowAllExpiringJobs(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
                    >
                      {expiringJobs.length > 5
                        ? `View all ${expiringJobs.length} expiring documents`
                        : expiringJobs.length === 1
                        ? "View document details"
                        : `View all ${expiringJobs.length} expiring documents`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No documents expiring soon
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  All your documents are up to date
                </p>
                <button
                  onClick={() => setShowAllExpiringJobs(true)}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200"
                >
                  View all documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      

      {/* View All Expiring Jobs Modal */}
      <ViewAllExpiringJobsModal
        isOpen={showAllExpiringJobs}
        onClose={() => setShowAllExpiringJobs(false)}
        initialJobs={expiringJobs}
      />


      {/* Total Users Modal */}
      {showTotalUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">All Users</h2>
                  <p className="text-blue-100">System registered users</p>
                </div>
                <button
                  onClick={() => setShowTotalUsersModal(false)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {totalUsersData.length > 0 ? (
                <div className="grid gap-4">
                  {totalUsersData.map((user) => (
                    <div key={user._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              Role: {user.role?.name || 'No Role'}
                            </span>
                            {user.createdAt && (
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' || !user.status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users found</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: {totalUsersData.length} user{totalUsersData.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => setShowTotalUsersModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Online Users Modal */}
      {showOnlineUsersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Online Users</h2>
                  <p className="text-emerald-100">Users currently logged in to the system</p>
                </div>
                <button
                  onClick={() => setShowOnlineUsersModal(false)}
                  className="text-white hover:text-emerald-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {onlineUsersData.length > 0 ? (
                <div className="grid gap-4">
                  {onlineUsersData.map((user) => (
                    <div key={user._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {user.email}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              Role: {user.role?.name || 'No Role'}
                            </span>
                            {user.lastLogin && (
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Last login: {new Date(user.lastLogin).toLocaleDateString()} {new Date(user.lastLogin).toLocaleTimeString()}
                              </span>
                            )}
                            {user.lastActivity && (
                              <span className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                Last activity: {new Date(user.lastActivity).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            Online
                          </span>
                          {user.isOnline && (
                            <p className="text-xs text-green-600 mt-1 font-medium">
                              Currently active
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users currently online</p>
                  <p className="text-xs text-gray-400 mt-1">Users will appear here when they log in</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Total: {onlineUsersData.length} user{onlineUsersData.length !== 1 ? 's' : ''} online
                </p>
                <button
                  onClick={() => setShowOnlineUsersModal(false)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
