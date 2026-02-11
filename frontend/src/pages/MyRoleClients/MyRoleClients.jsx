import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import {
  MagnifyingGlassIcon,
  EyeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../utils/axios";
import { useAuth } from "../../context/AuthContext";
import * as XLSX from "xlsx";
import { format } from "date-fns";

function MyRoleClients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState("latest");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [debouncedSearchQuery]);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearchQuery,
      };

      const response = await axiosInstance.get("/clients/my-role-clients", { params });
      setClients(response.data.clients || []);
      setPagination((prev) => ({
        ...prev,
        ...response.data.pagination,
      }));
      setError(null);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.response?.data?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearchQuery]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const sortedClients = [...clients].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.latestJobDate || 0) - new Date(a.latestJobDate || 0);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "jobCount":
        return (b.jobCount || 0) - (a.jobCount || 0);
      default:
        return 0;
    }
  });

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-600";
    if (status.includes("completed")) return "bg-green-100 text-green-700";
    if (status.includes("rejected") || status.includes("cancelled")) return "bg-red-100 text-red-700";
    if (status.includes("pending")) return "bg-yellow-100 text-yellow-700";
    return "bg-blue-100 text-blue-700";
  };

  const formatStatus = (status) => {
    if (!status) return "No Status";
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const response = await axiosInstance.get("/clients/my-role-clients", {
        params: {
          page: 1,
          limit: 10000,
          search: debouncedSearchQuery,
        },
      });

      const allClients = response.data.clients || [];

      if (allClients.length === 0) {
        alert("No data to export");
        return;
      }

      const dataToExport = allClients.map((client, index) => ({
        "S.No": index + 1,
        "Client Name": client.name || "-",
        Email: client.gmail || "-",
        Location: client.startingPoint || "-",
        "Total Jobs": client.jobCount || 0,
        "Active Jobs": client.activeJobCount || 0,
        "Latest Service": client.latestServiceType || "-",
        Status: formatStatus(client.latestJobStatus) || "-",
        "Latest Job Date": client.latestJobDate
          ? format(new Date(client.latestJobDate), "yyyy-MM-dd")
          : "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "My Role Clients");

      const colWidths = [
        { wch: 6 },
        { wch: 30 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
      ];
      worksheet["!cols"] = colWidths;

      const fileName = debouncedSearchQuery
        ? `MyRoleClients_Search_${debouncedSearchQuery}`
        : `MyRoleClients_${user?.role?.name || "All"}`;

      XLSX.writeFile(workbook, `${fileName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-400 rounded-full blur-3xl opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Role Clients</h1>
                <p className="text-indigo-200 text-sm mt-1">
                  Clients related to your role: <span className="font-semibold text-white">{user?.role?.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <SparklesIcon className="h-5 w-5 text-yellow-300 mr-2" />
                <span className="text-2xl font-bold text-white">{pagination.total}</span>
                <span className="text-indigo-200 ml-2 text-sm">clients</span>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting || clients.length === 0}
                className="flex items-center px-4 py-2.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <ArrowDownTrayIcon className="h-5 w-5 text-white mr-2" />
                )}
                <span className="text-white font-medium text-sm">
                  {exporting ? "Exporting..." : "Export"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex items-center space-x-3">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                <option value="latest">Latest Activity</option>
                <option value="name">Name A-Z</option>
                <option value="jobCount">Most Jobs</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchClients}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sortedClients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-white rounded-xl border border-gray-200"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
              <UserGroupIcon className="h-10 w-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Clients Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {debouncedSearchQuery
                ? "No clients match your search criteria. Try adjusting your search."
                : "There are no clients associated with services assigned to your role yet."}
            </p>
          </motion.div>
        )}

        {/* Data Table */}
        {!loading && !error && sortedClients.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Latest Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedClients.map((client) => (
                      <tr
                        key={client._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Client Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {client.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{client.name}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600">{client.gmail}</p>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600">{client.startingPoint || "N/A"}</p>
                        </td>

                        {/* Jobs Count */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              <BriefcaseIcon className="h-3 w-3 mr-1" />
                              {client.jobCount || 0}
                            </span>
                            {client.activeJobCount > 0 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                {client.activeJobCount} active
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Latest Service */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900 truncate max-w-[180px]">
                            {client.latestServiceType || "N/A"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.latestJobStatus ? (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(client.latestJobStatus)}`}>
                              {formatStatus(client.latestJobStatus)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => navigate(`/clients/${client.gmail}`)}
                            className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> clients
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                              pagination.page === pageNum
                                ? "bg-indigo-600 text-white"
                                : "hover:bg-white text-gray-600 border border-gray-200"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyRoleClients;
