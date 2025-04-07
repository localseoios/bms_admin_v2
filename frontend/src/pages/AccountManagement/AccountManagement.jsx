import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckIcon,
  ClockIcon,
  BriefcaseIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";

function AccountManagement() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSort, setSelectedSort] = useState("date-desc");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [stats, setStats] = useState({
    jobsRequiringPayment: 0,
    jobsWithPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    overduePayments: 0,
    totalAmountPaid: 0,
    totalAmountPending: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch stats and jobs data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard statistics first
        try {
          const statsData = await accountService.getDashboardStats();
          setStats(statsData);
        } catch (statsError) {
          console.error("Error fetching dashboard stats:", statsError);
          // Continue with defaults
        }

        // Fetch payment eligible jobs
        const response = await accountService.getCompletedJobs(
          pagination.currentPage,
          pagination.itemsPerPage,
          searchQuery.trim()
        );

        console.log("Jobs response:", response);

        // Handle different response structures
        if (response && Array.isArray(response)) {
          setJobs(response);
          setPagination((prev) => ({
            ...prev,
            totalItems: response.length,
            totalPages: Math.ceil(response.length / prev.itemsPerPage),
          }));
        } else if (response && response.jobs) {
          setJobs(response.jobs);
          setPagination(response.pagination || pagination);
        } else {
          console.warn("Unexpected response format:", response);
          setJobs([]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch jobs. Please try again.");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    pagination.currentPage,
    pagination.itemsPerPage,
    searchQuery,
    refreshKey,
  ]);

  // Filter jobs based on search query (client-side filtering as backup)
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      job._id?.toLowerCase().includes(searchLower) ||
      job.clientName?.toLowerCase().includes(searchLower) ||
      job.serviceType?.toLowerCase().includes(searchLower) ||
      job.gmail?.toLowerCase().includes(searchLower)
    );
  });

  // Sort jobs based on selected sort option
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (selectedSort) {
      case "date-asc":
        return (
          new Date(a.createdAt || a.updatedAt || 0) -
          new Date(b.createdAt || b.updatedAt || 0)
        );
      case "date-desc":
        return (
          new Date(b.createdAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.updatedAt || 0)
        );
      case "client-asc":
        return (a.clientName || "").localeCompare(b.clientName || "");
      case "client-desc":
        return (b.clientName || "").localeCompare(a.clientName || "");
      case "service-asc":
        return (a.serviceType || "").localeCompare(b.serviceType || "");
      case "service-desc":
        return (b.serviceType || "").localeCompare(a.serviceType || "");
      default:
        return (
          new Date(b.createdAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.updatedAt || 0)
        );
    }
  });

  // Navigate to client payment details
  const handleViewClientProfile = (gmail) => {
    navigate(`/account-management/client/${gmail}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  // Get time since job was completed
  const getTimeElapsed = (date) => {
    if (!date) return "Unknown";

    const now = new Date();
    const completedDate = new Date(date);

    // Check if date is valid
    if (isNaN(completedDate.getTime())) {
      return "Invalid date";
    }

    const diffTime = Math.abs(now - completedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    // Reset to page 1 when searching
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Account Management
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage payment records for completed operations
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <BriefcaseIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Jobs
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.jobsRequiringPayment || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Paid Invoices
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.paidPayments || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Pending Payments
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.pendingPayments || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Amount
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(stats.totalAmountPaid || 0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
                    placeholder="Search by client name, job ID, or service type..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="client-asc">Client (A-Z)</option>
                  <option value="client-desc">Client (Z-A)</option>
                  <option value="service-asc">Service Type (A-Z)</option>
                  <option value="service-desc">Service Type (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Job List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading completed jobs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Error Loading Jobs
              </h3>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : sortedJobs.length === 0 ? (
            <div className="text-center py-16">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No completed jobs found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no jobs currently marked as "Operation Complete" that
                need payment processing.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
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
                      Service Details
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Completed
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Payment Status
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
                    {sortedJobs.map((job, index) => (
                      <motion.tr
                        key={job._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() =>
                                  handleViewClientProfile(job.gmail)
                                }
                              >
                                {job.clientName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {job.gmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-md bg-indigo-100 flex items-center justify-center">
                                <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {job.serviceType}
                              </div>
                              <div className="text-xs text-gray-500">
                                ID: {job._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getTimeElapsed(job.updatedAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.updatedAt
                              ? new Date(job.updatedAt).toLocaleDateString()
                              : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.hasPayments ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckIcon className="h-3 w-3 mr-1" />
                              Payment Added
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewClientProfile(job.gmail)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-sm"
                          >
                            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                            Manage Payments
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls - Only show if needed */}
          {!loading &&
            !error &&
            sortedJobs.length > 0 &&
            pagination.totalPages > 1 && (
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
                      <span className="font-medium">
                        {pagination.totalItems}
                      </span>{" "}
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
                            currentPage: Math.max(
                              1,
                              pagination.currentPage - 1
                            ),
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
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: page,
                            })
                          }
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.currentPage === page
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
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
      </div>
    </div>
  );
}

export default AccountManagement;
