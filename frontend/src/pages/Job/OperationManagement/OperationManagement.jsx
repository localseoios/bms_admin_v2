import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  BriefcaseIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axiosInstance from "../../../utils/axios";

const priorityWeight = (priority) => {
  switch (priority) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
};

const filters = [
  { id: "all", name: "All Jobs" },
  { id: "pending", name: "Pending" },
  { id: "in-progress", name: "In Progress" },
  { id: "completed", name: "Completed" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
  { id: "corrected", name: "Corrected" },
  { id: "cancelled", name: "Cancelled" },
];

const priorities = [
  { id: "all", name: "All Priorities" },
  { id: "high", name: "High Priority" },
  { id: "medium", name: "Medium Priority" },
  { id: "low", name: "Low Priority" },
];

const sortOptions = [
  { id: "deadline-asc", name: "Deadline (Earliest)" },
  { id: "deadline-desc", name: "Deadline (Latest)" },
  { id: "priority-desc", name: "Priority (Highest)" },
  { id: "priority-asc", name: "Priority (Lowest)" },
  { id: "created-desc", name: "Created (Newest)" },
  { id: "created-asc", name: "Created (Oldest)" },
];

function OperationManagement() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedSort, setSelectedSort] = useState("deadline-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // New state variables for API integration
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/jobs/assigned`, {
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
            status: selectedFilter !== "all" ? selectedFilter : undefined,
          },
        });

        setJobs(response.data.jobs || []);
        setPagination(response.data.pagination || pagination);

        // Calculate stats
        const allJobsResponse = await axiosInstance.get("/jobs/assigned", {
          params: { limit: 1000 }, // Get all jobs for stats (could be optimized with a dedicated stats endpoint)
        });

        const allJobs = allJobsResponse.data.jobs || [];
        setStats({
          total: allJobs.length,
          pending: allJobs.filter((job) => job.status === "pending").length,
          inProgress: allJobs.filter((job) => job.status === "in-progress")
            .length,
          completed: allJobs.filter(
            (job) => job.status === "completed" || job.status === "approved"
          ).length,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err.response?.data?.message || "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [selectedFilter, pagination.currentPage, pagination.itemsPerPage]);

  // Export jobs function (example implementation)
  const exportJobs = () => {
    // Could implement CSV export here
    alert("Export functionality would go here");
  };

  const filteredJobs = jobs
    .filter((job) => {
      // Filter by priority if selected
      if (selectedPriority !== "all" && job.priority !== selectedPriority)
        return false;

      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          job._id?.toLowerCase().includes(searchLower) ||
          job.clientName?.toLowerCase().includes(searchLower) ||
          job.serviceType?.toLowerCase().includes(searchLower) ||
          job.gmail?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case "deadline-asc":
          return (
            new Date(a.deadline || a.createdAt) -
            new Date(b.deadline || b.createdAt)
          );
        case "deadline-desc":
          return (
            new Date(b.deadline || b.createdAt) -
            new Date(a.deadline || a.createdAt)
          );
        case "priority-desc":
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        case "priority-asc":
          return priorityWeight(a.priority) - priorityWeight(b.priority);
        case "created-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "created-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

  const handleViewJob = (job) => {
    navigate(`/job/${job._id}`);
  };

  // New function to handle client profile navigation
  const handleViewClientProfile = (e, gmail) => {
    e.stopPropagation(); // Prevent row click event from firing
    navigate(`/clients/${gmail}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "in-progress":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "pending":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "corrected":
        return "bg-purple-50 text-purple-700 ring-purple-600/20";
      case "cancelled":
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "medium":
        return "bg-orange-50 text-orange-700 ring-orange-600/20";
      case "low":
        return "bg-green-50 text-green-700 ring-green-600/20";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return "No deadline";
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days left` : "Overdue";
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 mt-4">
            Error Loading Jobs
          </h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              My Jobs
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Track and manage your assigned tasks efficiently
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <button
              onClick={exportJobs}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              Export Jobs
            </button>
          </div>
        </div>

        {/* Enhanced Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: "Total Jobs",
              value: stats.total,
              icon: BriefcaseIcon,
              color: "blue",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: ClockIcon,
              color: "yellow",
            },
            {
              label: "In Progress",
              value: stats.inProgress,
              icon: ClockIcon,
              color: "indigo",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckIcon,
              color: "green",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center">
                <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                    placeholder="Search jobs by ID, client, or service type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => {
                    setSelectedFilter(e.target.value);
                    setPagination({ ...pagination, currentPage: 1 }); // Reset to first page on filter change
                  }}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  {filters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  {priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Jobs Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {loading && jobs.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Job Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Service Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Client Info
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Priority
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Deadline
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredJobs.map((job, index) => (
                      <motion.tr
                        key={job._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleViewJob(job)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {job._id}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {job.jobDetails}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.serviceType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span
                              className="cursor-pointer hover:text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClientProfile(e, job.gmail);
                              }}
                            >
                              {job.clientName}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.gmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {getStatusIcon(job.status)}
                            <span className="ml-1.5">{job.status}</span>
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(
                              job.priority || "medium"
                            )}`}
                          >
                            {job.priority || "medium"}
                          </motion.span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.deadline
                              ? new Date(job.deadline).toLocaleDateString()
                              : "Not set"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getDaysUntilDeadline(job.deadline)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewJob(job);
                              }}
                              className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>

                            {/* Client profile button */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) =>
                                handleViewClientProfile(e, job.gmail)
                              }
                              className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                              title="View Client Profile"
                            >
                              <UserIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No jobs found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error
                  ? `Error: ${error}`
                  : "No jobs match your current filters."}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      currentPage: Math.max(1, pagination.currentPage - 1),
                    })
                  }
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      currentPage: Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      ),
                    })
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {Math.min(
                        1 +
                          (pagination.currentPage - 1) *
                            pagination.itemsPerPage,
                        pagination.totalItems
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalItems}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: Math.max(1, pagination.currentPage - 1),
                        })
                      }
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {[...Array(pagination.totalPages).keys()].map((page) => (
                      <button
                        key={page + 1}
                        onClick={() =>
                          setPagination({
                            ...pagination,
                            currentPage: page + 1,
                          })
                        }
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.currentPage === page + 1
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: Math.min(
                            pagination.totalPages,
                            pagination.currentPage + 1
                          ),
                        })
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Job Details Modal */}
        <Transition appear show={isDetailModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsDetailModalOpen(false)}
          >
            <div className="min-h-screen px-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
              </Transition.Child>

              <span
                className="inline-block h-screen align-middle"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
                  {selectedJob && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Job Details - {selectedJob._id}
                      </Dialog.Title>
                      <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Client Information
                            </h4>
                            <p className="text-sm text-gray-900">
                              {selectedJob.clientName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedJob.gmail}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Service Details
                            </h4>
                            <p className="text-sm text-gray-900">
                              {selectedJob.serviceType}
                            </p>
                            <p className="text-sm text-gray-600">
                              Assigned to:{" "}
                              {selectedJob.assignedPerson?.name ||
                                "Not assigned"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Job Description
                          </h4>
                          <p className="text-sm text-gray-900">
                            {selectedJob.jobDetails}
                          </p>
                          {selectedJob.specialDescription && (
                            <p className="mt-2 text-sm text-gray-600">
                              {selectedJob.specialDescription}
                            </p>
                          )}
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Documents
                          </h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                              <span className="text-sm text-gray-900">
                                Passport Document
                              </span>
                              <a
                                href={selectedJob.documentPassport}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                              >
                                View
                              </a>
                            </div>
                            <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                              <span className="text-sm text-gray-900">
                                ID Document
                              </span>
                              <a
                                href={selectedJob.documentID}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                              >
                                View
                              </a>
                            </div>
                            {selectedJob.otherDocuments &&
                              selectedJob.otherDocuments.length > 0 && (
                                <div className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                  <span className="text-sm text-gray-900">
                                    Other Documents (
                                    {selectedJob.otherDocuments.length})
                                  </span>
                                  <a
                                    href={selectedJob.otherDocuments[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    View
                                  </a>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Status
                            </h4>
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                selectedJob.status
                              )}`}
                            >
                              {getStatusIcon(selectedJob.status)}
                              <span className="ml-1.5">
                                {selectedJob.status}
                              </span>
                            </motion.span>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Priority
                            </h4>
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(
                                selectedJob.priority || "medium"
                              )}`}
                            >
                              {selectedJob.priority || "medium"}
                            </motion.span>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Timeline
                          </h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Created</p>
                              <p className="text-sm font-medium text-gray-900">
                                {new Date(
                                  selectedJob.createdAt
                                ).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Deadline</p>
                              <p className="text-sm font-medium text-gray-900">
                                {selectedJob.deadline
                                  ? new Date(
                                      selectedJob.deadline
                                    ).toLocaleString()
                                  : "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        {/* Add Client Profile button */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          className="mr-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          onClick={() => {
                            setIsDetailModalOpen(false);
                            navigate(`/clients/${selectedJob.gmail}`);
                          }}
                        >
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            View Client Profile
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                          onClick={() => setIsDetailModalOpen(false)}
                        >
                          Close
                        </motion.button>
                      </div>
                    </>
                  )}
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}

export default OperationManagement;
