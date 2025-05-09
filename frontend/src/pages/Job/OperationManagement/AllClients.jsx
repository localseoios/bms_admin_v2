import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  BriefcaseIcon,
  ArrowDownTrayIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

function AllClients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [sortBy, setSortBy] = useState("latest"); // Sort options: latest, name, jobCount

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/clients/all", {
          params: {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
          },
        });

        console.log("API Response:", response.data);
        setClients(response.data.clients || []);
        setPagination(response.data.pagination || pagination);
        setError(null);
      } catch (err) {
        console.error("Error fetching clients:", err);
        setError(err.response?.data?.message || "Failed to fetch clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [pagination.currentPage, pagination.itemsPerPage]);

  // Filter and sort clients
  const filteredClients = clients
    .filter((client) => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          client.name?.toLowerCase().includes(searchLower) ||
          client.gmail?.toLowerCase().includes(searchLower) ||
          client.startingPoint?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return (
            new Date(b.latestJobDate || 0) - new Date(a.latestJobDate || 0)
          );
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "jobCount":
          return (b.jobCount || 0) - (a.jobCount || 0);
        default:
          return 0;
      }
    });

  // Export clients function
  const exportClients = () => {
    // Implementation for exporting clients data
    alert("Export functionality would go here");
  };

  // Handle client selection
  const handleViewClient = (gmail) => {
    navigate(`/clients/${gmail}`);
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 mt-4">
            Error Loading Clients
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
        {/* Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              All Clients
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              View and manage all clients in the system
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <button
              onClick={exportClients}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              Export Clients
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Clients
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pagination.totalItems || clients.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clients.reduce(
                    (sum, client) => sum + (client.activeJobCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Engagement Letters
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {clients.filter((client) => client.engagementLetter).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Sort */}
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
                    placeholder="Search clients by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  <option value="latest">Sort by Latest Job</option>
                  <option value="name">Sort by Name</option>
                  <option value="jobCount">Sort by Job Count</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clients List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {loading && clients.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Jobs
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Latest Job
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Engagement Letter
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
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleViewClient(client.gmail)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <EnvelopeIcon className="h-3.5 w-3.5 mr-1" />
                                {client.gmail}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <BuildingOfficeIcon className="h-3.5 w-3.5 mr-1" />
                                {client.startingPoint}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {client.jobCount || 0} Total
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.activeJobCount || 0} Active
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.latestJobDate ? (
                            <>
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  client.latestJobDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.latestServiceType || "N/A"}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.engagementLetter ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(client.engagementLetter, "_blank");
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              View
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Not available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClient(client.gmail);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                              title="View Client Profile"
                            >
                              <EyeIcon className="h-5 w-5" />
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
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No clients found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error
                  ? `Error: ${error}`
                  : searchQuery
                  ? "No clients match your search criteria."
                  : "There are no clients in the system yet."}
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
                    {Array.from({ length: pagination.totalPages }).map(
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: i + 1,
                            })
                          }
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.currentPage === i + 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
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

export default AllClients;
