// FIXED: ViewAllExpiringJobsModal.jsx - Updated to work with corrected backend

import { useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  BellIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../utils/axios";

const ViewAllExpiringJobsModal = ({ isOpen, onClose, initialJobs = [] }) => {
  // Ensure all state values are always arrays
  const [expiringJobs, setExpiringJobs] = useState(
    Array.isArray(initialJobs) ? initialJobs : []
  );
  const [filteredJobs, setFilteredJobs] = useState(
    Array.isArray(initialJobs) ? initialJobs : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("urgency");

  useEffect(() => {
    if (isOpen && (!initialJobs || initialJobs.length === 0)) {
      fetchAllExpiringJobs();
    }
  }, [isOpen, initialJobs]);

  useEffect(() => {
    const jobsArray = Array.isArray(initialJobs) ? initialJobs : [];
    setExpiringJobs(jobsArray);
    setFilteredJobs(jobsArray);
  }, [initialJobs]);

  useEffect(() => {
    filterAndSortJobs();
  }, [expiringJobs, searchTerm, urgencyFilter, sortBy]);

  // FIXED: Updated fetchAllExpiringJobs to work with corrected backend
  const fetchAllExpiringJobs = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching all expiring jobs from modal...");

      const response = await axiosInstance.get("/operations/expiring-jobs");
      console.log("Modal API response:", response.data);

      // Handle the corrected backend response structure
      let jobsData = [];

      if (response.data) {
        if (response.data.success && Array.isArray(response.data.data)) {
          // Backend API response structure: { success: true, data: [...] }
          jobsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array response
          jobsData = response.data;
        } else {
          console.warn("Unexpected response structure:", response.data);
          jobsData = [];
        }
      }

      console.log("Setting expiring jobs:", jobsData.length, "jobs");

      // Process jobs and add urgency display info
      const processedJobs = jobsData
        .filter((job) => job && job.clientName) // Filter out invalid jobs
        .map((job) => {
          // Ensure job has all required fields from the corrected backend
          const processedJob = {
            jobId: job.jobId || job._id,
            jobNumber: job.jobNumber || "N/A",
            clientName: job.clientName || "Unknown Client",
            companyName: job.companyName || job.clientName || "Unknown Company",
            serviceType: job.serviceType || "Unknown Service",
            status: job.status || "unknown",
            expiryDate: job.expiryDate,
            expiryType: job.expiryType || "Document", // Type of expiring document
            daysUntilExpiry: job.daysUntilExpiry || 0,
            urgencyLevel: job.urgencyLevel || "normal",
            urgencyDescription: job.urgencyDescription || "No description",
            assignedPerson: job.assignedPerson || { name: "Unassigned" },
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
          };

          // Add urgency display info
          return {
            ...processedJob,
            ...getUrgencyDisplayInfo(processedJob),
          };
        });

      setExpiringJobs(processedJobs);
    } catch (error) {
      console.error("Error fetching all expiring jobs:", error);
      setExpiringJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortJobs = () => {
    const jobsArray = Array.isArray(expiringJobs) ? expiringJobs : [];
    let filtered = [...jobsArray];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job &&
          ((job.clientName &&
            job.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.jobNumber &&
              job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.serviceType &&
              job.serviceType
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (job.companyName &&
              job.companyName
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (job.expiryType &&
              job.expiryType.toLowerCase().includes(searchTerm.toLowerCase())))
      );
    }

    // Apply urgency filter
    if (urgencyFilter !== "all") {
      filtered = filtered.filter((job) => {
        return job && job.urgencyLevel === urgencyFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (!a || !b) return 0;

      switch (sortBy) {
        case "urgency":
          const urgencyOrder = {
            expired: 0,
            critical: 1,
            warning: 2,
            normal: 3,
          };

          const aUrgency = a.urgencyLevel || "normal";
          const bUrgency = b.urgencyLevel || "normal";

          if (urgencyOrder[aUrgency] !== urgencyOrder[bUrgency]) {
            return urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
          }
          return (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0);
        case "expiry":
          return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
        case "client":
          return (a.clientName || "").localeCompare(b.clientName || "");
        case "service":
          return (a.serviceType || "").localeCompare(b.serviceType || "");
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  // Helper function for urgency display
  const getUrgencyDisplayInfo = (job) => {
    const urgencyLevel = job.urgencyLevel;
    const urgencyDescription = job.urgencyDescription || "No description";

    let urgencyColor, urgencyIcon;

    switch (urgencyLevel) {
      case "expired":
        urgencyColor = "bg-red-100 text-red-800 border-red-200";
        urgencyIcon = ExclamationTriangleIcon;
        break;
      case "critical":
        urgencyColor = "bg-orange-100 text-orange-800 border-orange-200";
        urgencyIcon = ExclamationTriangleIcon;
        break;
      case "warning":
        urgencyColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
        urgencyIcon = ClockIcon;
        break;
      default:
        urgencyColor = "bg-green-100 text-green-800 border-green-200";
        urgencyIcon = CheckCircleIcon;
    }

    return {
      urgencyColor,
      urgencyIcon,
      urgencyText: urgencyDescription,
    };
  };

  const getUrgencyConfig = (urgencyLevel) => {
    switch (urgencyLevel) {
      case "expired":
        return {
          color: "bg-red-100 text-red-800 border-red-200",
          icon: ExclamationTriangleIcon,
          label: "Expired",
          textColor: "text-red-600",
        };
      case "critical":
        return {
          color: "bg-orange-100 text-orange-800 border-orange-200",
          icon: ExclamationTriangleIcon,
          label: "Critical",
          textColor: "text-orange-600",
        };
      case "warning":
        return {
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: ClockIcon,
          label: "Warning",
          textColor: "text-yellow-600",
        };
      default:
        return {
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircleIcon,
          label: "Normal",
          textColor: "text-green-600",
        };
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      om_completed: "bg-purple-100 text-purple-800",
      kyc_pending: "bg-indigo-100 text-indigo-800",
      bra_pending: "bg-pink-100 text-pink-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const exportToExcel = async () => {
    try {
      const response = await axiosInstance.get(
        "/operations/expiring-jobs/export",
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `expiring-jobs-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Failed to export data. Please try again.");
    }
  };

  const sendNotifications = async () => {
    try {
      const response = await axiosInstance.post(
        "/operations/expiring-jobs/notify"
      );
      alert(
        `Notifications sent successfully! ${response.data.notificationsSent} notifications were sent.`
      );
    } catch (error) {
      console.error("Error sending notifications:", error);
      alert("Failed to send notifications. Please try again.");
    }
  };

  // Format days until expiry
  const formatDaysUntilExpiry = (job) => {
    if (!job || !job.expiryDate) {
      return {
        main: "No expiry date",
        sub: "Expiry date not set",
      };
    }

    const daysUntilExpiry = job.daysUntilExpiry || 0;

    if (daysUntilExpiry < 0) {
      const daysOverdue = Math.abs(daysUntilExpiry);
      return {
        main: `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`,
        sub: `Expired on ${new Date(job.expiryDate).toLocaleDateString()}`,
      };
    } else {
      return {
        main: `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`,
        sub: `Expires on ${new Date(job.expiryDate).toLocaleDateString()}`,
      };
    }
  };

  // Calculate urgency counts with proper array handling and null checks
  const urgencyCounts = {
    expired: Array.isArray(expiringJobs)
      ? expiringJobs.filter((job) => job && job.urgencyLevel === "expired")
          .length
      : 0,
    critical: Array.isArray(expiringJobs)
      ? expiringJobs.filter((job) => job && job.urgencyLevel === "critical")
          .length
      : 0,
    warning: Array.isArray(expiringJobs)
      ? expiringJobs.filter((job) => job && job.urgencyLevel === "warning")
          .length
      : 0,
    normal: Array.isArray(expiringJobs)
      ? expiringJobs.filter((job) => job && job.urgencyLevel === "normal")
          .length
      : 0,
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                        <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-xl font-bold text-gray-900"
                        >
                          All Expiring Documents
                        </Dialog.Title>
                        <p className="text-sm text-gray-600">
                          Monitor document expiry dates and renewal deadlines
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Expired: {urgencyCounts.expired}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Critical: {urgencyCounts.critical}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Warning: {urgencyCounts.warning}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Normal: {urgencyCounts.normal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="px-6 py-4 bg-white border-b">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Search and Filters */}
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Search */}
                      <div className="relative min-w-[250px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search jobs or documents..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>

                      {/* Urgency Filter */}
                      <select
                        value={urgencyFilter}
                        onChange={(e) => setUrgencyFilter(e.target.value)}
                        className="block py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="all">All Urgency Levels</option>
                        <option value="expired">Expired</option>
                        <option value="critical">Critical</option>
                        <option value="warning">Warning</option>
                        <option value="normal">Normal</option>
                      </select>

                      {/* Sort By */}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="block py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="urgency">Sort by Urgency</option>
                        <option value="expiry">Sort by Expiry Date</option>
                        <option value="client">Sort by Client</option>
                        <option value="service">Sort by Service</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      {/* <button
                        onClick={sendNotifications}
                        className="inline-flex items-center px-3 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      >
                        <BellIcon className="h-4 w-4 mr-2" />
                        Send Alerts
                      </button> */}
                      <button
                        onClick={exportToExcel}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Export Excel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="animate-pulse bg-gray-100 rounded-lg p-4 h-24"
                          ></div>
                        ))}
                    </div>
                  ) : Array.isArray(filteredJobs) && filteredJobs.length > 0 ? (
                    <div className="space-y-4">
                      {filteredJobs.map((job, index) => {
                        // Safety check for job object
                        if (!job) return null;

                        const urgencyConfig = getUrgencyConfig(
                          job.urgencyLevel
                        );
                        const UrgencyIcon = urgencyConfig.icon;
                        const formattedDays = formatDaysUntilExpiry(job);

                        return (
                          <div
                            key={job.jobId || `job-${index}`}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
                          >
                            <div className="flex items-start justify-between">
                              {/* Job Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start space-x-4">
                                  {/* Company Icon */}
                                  <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                                    <BuildingOfficeIcon className="h-5 w-5 text-gray-600" />
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h4 className="text-lg font-semibold text-gray-900 truncate">
                                        {job.clientName || "Unknown Client"}
                                      </h4>
                                      <span
                                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${urgencyConfig.color}`}
                                      >
                                        <UrgencyIcon className="h-3 w-3 mr-1" />
                                        {urgencyConfig.label}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                      <div className="flex items-center space-x-1">
                                        <DocumentTextIcon className="h-4 w-4" />
                                        <span>#{job.jobNumber || "N/A"}</span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <BuildingOfficeIcon className="h-4 w-4" />
                                        <span className="truncate">
                                          {job.serviceType || "Unknown Service"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <UserIcon className="h-4 w-4" />
                                        <span className="truncate">
                                          {job.assignedPerson?.name ||
                                            "Unassigned"}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <CalendarIcon className="h-4 w-4" />
                                        <span>
                                          {job.expiryDate
                                            ? new Date(
                                                job.expiryDate
                                              ).toLocaleDateString()
                                            : "No date set"}
                                        </span>
                                      </div>
                                    </div>

                                    {/* UPDATED: Display document type prominently */}
                                    <div className="mt-2 flex items-center space-x-4">
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        Document: {job.expiryType || "Unknown"}
                                      </span>
                                      {job.companyName &&
                                        job.companyName !== job.clientName && (
                                          <span className="text-sm text-gray-500">
                                            Company: {job.companyName}
                                          </span>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Status and Urgency */}
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    job.status || "unknown"
                                  )}`}
                                >
                                  {(job.status || "unknown")
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </span>
                                <div
                                  className={`text-right ${urgencyConfig.textColor}`}
                                >
                                  <div className="text-sm font-medium">
                                    {formattedDays.main}
                                  </div>
                                  <div className="text-xs">
                                    {formattedDays.sub}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No expiring documents found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm || urgencyFilter !== "all"
                          ? "Try adjusting your filters to see more results."
                          : "All documents are up to date."}
                      </p>
                      {/* Debug info */}
                      <div className="mt-4 text-xs text-gray-400">
                        Debug: Jobs array length:{" "}
                        {Array.isArray(expiringJobs)
                          ? expiringJobs.length
                          : "Not an array"}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing{" "}
                      {Array.isArray(filteredJobs) ? filteredJobs.length : 0} of{" "}
                      {Array.isArray(expiringJobs) ? expiringJobs.length : 0}{" "}
                      expiring documents
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = "/expiring-jobs")
                        }
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        View Full Page
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ViewAllExpiringJobsModal;