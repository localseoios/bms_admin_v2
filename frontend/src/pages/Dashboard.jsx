// Dashboard.jsx
import { useState, useEffect } from "react";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  ArrowTrendingUpIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  EyeIcon,
  SparklesIcon,
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

  // Fetch all dashboard data on mount and when refreshing
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeframe]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all required data in parallel
      const [statsData, jobsData, servicesData, activitiesData] =
        await Promise.all([
          fetchStats(),
          fetchJobsData(),
          fetchServicesData(),
          fetchRecentActivity(),
        ]);

      // Process the data
      setStats(statsData);
      processJobsData(jobsData);
      processServicesData(servicesData);
      setRecentActivity(activitiesData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch and calculate statistics
  const fetchStats = async () => {
    try {
      // For real implementation, fetch these stats from relevant API endpoints
      const [jobsResponse, clientsResponse] = await Promise.all([
        axiosInstance.get("/jobs"),
        axiosInstance.get("/clients/assigned"),
      ]);

      const jobs = jobsResponse.data;
      const clients = clientsResponse.data.clients || [];

      // Calculate statistics from the responses
      const totalJobs = jobs.length;
      const activeClients = clients.length;

      // Count pending tasks (jobs with status 'pending')
      const pendingTasks = jobs.filter(
        (job) => job.status === "pending"
      ).length;

      // Calculate completion rate
      const completedJobs = jobs.filter((job) =>
        ["completed", "fully_completed_bra"].includes(job.status)
      ).length;
      const completionRate =
        totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;

      // Generate statistics with comparison to previous period (mockup for now)
      return [
        {
          name: "Total Jobs",
          value: totalJobs.toString(),
          change: "+12.5%", // In a real implementation, calculate this from historical data
          changeType: "positive",
          icon: BriefcaseIcon,
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          name: "Active Clients",
          value: activeClients.toString(),
          change: "+8.2%",
          changeType: "positive",
          icon: UserGroupIcon,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          name: "Pending Tasks",
          value: pendingTasks.toString(),
          change: pendingTasks > 35 ? "+5.4%" : "-5.4%",
          changeType: pendingTasks > 35 ? "positive" : "negative",
          icon: ClockIcon,
          bgColor: "bg-yellow-50",
          iconColor: "text-yellow-600",
        },
        {
          name: "Completion Rate",
          value: `${completionRate}%`,
          change: "+2.3%",
          changeType: "positive",
          icon: CheckCircleIcon,
          bgColor: "bg-green-50",
          iconColor: "text-green-600",
        },
      ];
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Return default stats in case of error
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
          name: "Active Clients",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: UserGroupIcon,
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          name: "Pending Tasks",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: ClockIcon,
          bgColor: "bg-yellow-50",
          iconColor: "text-yellow-600",
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
      const response = await axiosInstance.get("/jobs");
      return response.data;
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

  // Fetch services data for pie chart
  const fetchServicesData = async () => {
    try {
      const response = await axiosInstance.get("/services");
      return response.data;
    } catch (error) {
      console.error("Error fetching services data:", error);
      return [];
    }
  };

  // Process services data for pie chart
  const processServicesData = (services) => {
    // Count jobs by service type
    const serviceMap = services.reduce((acc, service) => {
      acc[service.name] = {
        name: service.name,
        value: service.usageCount || 0,
      };
      return acc;
    }, {});

    // If we don't have enough services with data, add some defaults
    if (Object.keys(serviceMap).length < 4) {
      const defaults = {
        "Company Registration": 35,
        "Tax Filing": 25,
        "Business License": 20,
        "Legal Consultation": 20,
      };

      Object.entries(defaults).forEach(([name, value]) => {
        if (!serviceMap[name]) {
          serviceMap[name] = { name, value };
        }
      });
    }

    // Convert to array and sort by value (highest first)
    const servicesData = Object.values(serviceMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Limit to 6 categories for the pie chart

    setServiceDistributionData(servicesData);
  };

  // Fetch recent activity for activity feed
  const fetchRecentActivity = async () => {
    try {
      // In a real implementation, this would probably be a dedicated endpoint
      // Here we're using job data and filtering for recent items
      const response = await axiosInstance.get("/jobs");
      const jobs = response.data;

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
        <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? // Skeleton loaders for stats
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50"
                  >
                    <div className="animate-pulse flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="ml-4">
                          <div className="h-3 w-24 bg-gray-200 rounded"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded mt-2"></div>
                        </div>
                      </div>
                      <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
            : stats.map((stat, index) => (
                <div
                  key={stat.name}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`p-3.5 rounded-xl ${stat.bgColor} shadow-sm`}
                      >
                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          {stat.name}
                        </p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : stat.changeType === "negative"
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {stat.changeType === "positive" ? (
                        <ArrowUpIcon className="h-4 w-4 mr-1" />
                      ) : stat.changeType === "negative" ? (
                        <ArrowDownIcon className="h-4 w-4 mr-1" />
                      ) : null}
                      <span className="text-sm font-semibold">
                        {stat.change}
                      </span>
                    </div>
                  </div>
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

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Service Distribution */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Service Distribution
              </h2>
              <button className="p-2 text-gray-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200">
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
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-100/50 hover:shadow-xl transition-all duration-300 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200">
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
                  {recentActivity.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
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
                              <div
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(
                                  activity.status
                                )}`}
                              >
                                {getStatusIcon(activity.status)}
                                <span className="ml-1.5 capitalize">
                                  {activity.status}
                                </span>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
