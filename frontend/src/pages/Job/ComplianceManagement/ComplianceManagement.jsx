import { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, Transition } from "@headlessui/react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../utils/axios";

import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  DocumentArrowDownIcon,
  BriefcaseIcon,
  ArrowPathIcon,
  CalendarIcon,
  DocumentCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Filter options
const filters = [
  { id: "all", name: "All Jobs" },
  { id: "pending", name: "Pending Review" },
  { id: "corrected", name: "Corrected Jobs" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
];

// Sort options
const sortOptions = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
  { id: "client", name: "Client Name" },
  { id: "service", name: "Service Type" },
];

// Mock assigned persons (optional)
const assignedPersons = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Senior Consultant",
    status: "Available",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Legal Advisor",
    status: "In Meeting",
  },
  {
    id: "3",
    name: "Emily Brown",
    role: "Document Specialist",
    status: "Available",
  },
  { id: "4", name: "David Wilson", role: "Compliance Officer", status: "Busy" },
];

// Helper function to get assigned person name by ID
const getAssignedPersonName = (id) => {
  const person = assignedPersons.find((p) => p.id === id);
  return person ? person.name : "Unknown";
};

// File size formatter
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Get file type icon based on file extension
const getFileTypeIcon = (filename) => {
  if (!filename) return <DocumentIcon className="h-5 w-5" />;
  const extension = filename.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension)) {
    return <PhotoIcon className="h-5 w-5 text-blue-500" />;
  } else if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
    return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
  } else {
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  }
};

// Format date helper function
const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Helper function to get the latest document URLs
const getLatestDocuments = (job) => {
  if (!job.resubmissions || job.resubmissions.length === 0) {
    return {
      documentPassport: job.documentPassport,
      documentID: job.documentID,
      otherDocuments: job.otherDocuments || [],
    };
  }
  const latestResubmission = job.resubmissions[job.resubmissions.length - 1];
  return {
    documentPassport:
      latestResubmission.newDocumentPassport || job.documentPassport,
    documentID: latestResubmission.newDocumentID || job.documentID,
    otherDocuments:
      latestResubmission.newOtherDocuments &&
      latestResubmission.newOtherDocuments.length > 0
        ? latestResubmission.newOtherDocuments
        : job.otherDocuments || [],
  };
};

// Helper to check if a document was updated in the latest resubmission
const isDocumentUpdated = (job, documentType) => {
  if (!job.resubmissions || job.resubmissions.length === 0) return false;
  const latestResubmission = job.resubmissions[job.resubmissions.length - 1];
  switch (documentType) {
    case "passport":
      return !!latestResubmission.newDocumentPassport;
    case "id":
      return !!latestResubmission.newDocumentID;
    case "other":
      return (
        latestResubmission.newOtherDocuments &&
        latestResubmission.newOtherDocuments.length > 0
      );
    default:
      return false;
  }
};

function ComplianceManagement() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionFile, setRejectionFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResubmissionHistory, setShowResubmissionHistory] = useState(false);

  // Handle file selection and update file details
  const handleFileChange = (file) => {
    if (!file) {
      setRejectionFile(null);
      setFileDetails(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit. Please select a smaller file.");
      return;
    }
    setRejectionFile(file);
    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      extension: file.name.split(".").pop().toLowerCase(),
    });
  };

  // Handle file drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setRejectionFile(null);
    setFileDetails(null);
  };

  // Fetch jobs from the API when the component mounts
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/jobs");
        setJobs(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Reset file state when rejection modal closes
  useEffect(() => {
    if (!isRejectionModalOpen) {
      setRejectionFile(null);
      setFileDetails(null);
      setRejectionReason("");
    }
  }, [isRejectionModalOpen]);

  // Reset resubmission history view when detail modal closes
  useEffect(() => {
    if (!isDetailModalOpen) {
      setShowResubmissionHistory(false);
    }
  }, [isDetailModalOpen]);

  // Filter + sort
  const filteredJobs = jobs
    .filter((job) => {
      if (selectedFilter !== "all" && job.status !== selectedFilter)
        return false;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          (job._id && job._id.toLowerCase().includes(searchLower)) ||
          (job.clientName &&
            job.clientName.toLowerCase().includes(searchLower)) ||
          (job.serviceType &&
            job.serviceType.toLowerCase().includes(searchLower)) ||
          (job.jobDetails && job.jobDetails.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (selectedSort) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "client":
          return (a.clientName || "").localeCompare(b.clientName || "");
        case "service":
          return (a.serviceType || "").localeCompare(b.serviceType || "");
        default:
          // newest first
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Handlers for job actions
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleRejectJob = (job) => {
    setSelectedJob(job);
    setIsRejectionModalOpen(true);
  };

  const handleApproveJob = async (job) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/jobs/${job._id}/approve`, {});
      setJobs((prevJobs) =>
        prevJobs.map((j) =>
          j._id === job._id ? { ...j, status: "approved" } : j
        )
      );
    } catch (err) {
      console.error("Error approving job:", err);
      alert("Failed to approve job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a simple profile modal (example)
  const handleViewProfile = (job) => {
    setSelectedClient({
      name: job.clientName,
      email: job.gmail,
      startingPoint: job.startingPoint,
    });
    setIsDetailModalOpen(false);
    setIsProfileModalOpen(true);
  };

  // Submitting rejection
  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rejectionReason", rejectionReason);
      if (rejectionFile) {
        formData.append("rejectionDocument", rejectionFile);
      }
      const response = await axiosInstance.put(
        `/jobs/${selectedJob._id}/reject`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const updatedJob = response.data;
      setJobs((prevJobs) =>
        prevJobs.map((j) => (j._id === selectedJob._id ? updatedJob : j))
      );
      setIsRejectionModalOpen(false);
      setRejectionReason("");
      setRejectionFile(null);
      setFileDetails(null);
    } catch (err) {
      console.error("Error rejecting job:", err);
      alert("Failed to reject job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "corrected":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      default:
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      case "corrected":
        return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const exportData = () => {
    const headers = [
      "Job ID",
      "Client Name",
      "Service Type",
      "Assigned To",
      "Status",
      "Created Date",
    ].join(",");
    const rows = filteredJobs.map((job) =>
      [
        job._id,
        job.clientName || "N/A",
        job.serviceType || "N/A",
        getAssignedPersonName(job.assignedPerson),
        job.status || "pending",
        new Date(job.createdAt).toLocaleDateString(),
      ].join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "compliance-jobs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? "..." : jobs.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading
                    ? "..."
                    : jobs.filter((job) => job.status === "approved").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <ArrowPathIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Corrected</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading
                    ? "..."
                    : jobs.filter((job) => job.status === "corrected").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading
                    ? "..."
                    : jobs.filter((job) => job.status === "pending").length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Compliance Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Review and manage compliance requests efficiently
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportData}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
            Export Data
          </motion.button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8 backdrop-blur-xl bg-white/50"
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                    placeholder="Search by Job ID, Client, Service Type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  {filters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
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

        {/* Jobs Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden backdrop-blur-xl bg-white/50"
        >
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
                    Assigned To
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
                    Created
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
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading jobs...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No jobs found
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filteredJobs.map((job, index) => (
                      <motion.tr
                        key={job._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {job.clientName || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {job._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {job.serviceType || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getAssignedPersonName(job.assignedPerson) ||
                              "Unassigned"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              job.status || "pending"
                            )}`}
                          >
                            {getStatusIcon(job.status || "pending")}
                            <span className="ml-1.5">
                              {job.status || "pending"}
                            </span>
                          </motion.span>
                          {job.status === "corrected" && (
                            <div className="mt-1 text-xs text-gray-500">
                              Resubmitted
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {/* View Job Detail */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewJob(job)}
                              className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>

                            {/* “View Profile” button only if job is approved */}
                            {job.status === "approved" && (
                              <Link to={`/clients/${job.gmail}`}>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                >
                                  <UserIcon className="h-5 w-5" />
                                </motion.button>
                              </Link>
                            )}

                            {/* Approve/Reject if pending or corrected */}
                            {(!job.status ||
                              job.status === "pending" ||
                              job.status === "corrected") && (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleApproveJob(job)}
                                  disabled={isSubmitting}
                                  className={`text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors duration-200 ${
                                    isSubmitting
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRejectJob(job)}
                                  disabled={isSubmitting}
                                  className={`text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200 ${
                                    isSubmitting
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </motion.button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* -------- JOB DETAILS MODAL -------- */}
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
                ​
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
                        className="text-lg font-medium leading-6 text-gray-900 flex items-center justify-between"
                      >
                        <span>Job Details - {selectedJob._id}</span>
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            selectedJob.status || "pending"
                          )}`}
                        >
                          {getStatusIcon(selectedJob.status || "pending")}
                          <span className="ml-1.5">
                            {selectedJob.status || "pending"}
                          </span>
                        </motion.span>
                      </Dialog.Title>

                      <div className="mt-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Client Info */}
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Client Information
                            </h4>
                            <p className="text-sm text-gray-900">
                              {selectedJob.clientName || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedJob.gmail || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              Starting Point:{" "}
                              {selectedJob.startingPoint || "N/A"}
                            </p>
                          </div>

                          {/* Service Details */}
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Service Details
                            </h4>
                            <p className="text-sm text-gray-900">
                              {selectedJob.serviceType || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">
                              Assigned to:{" "}
                              {getAssignedPersonName(
                                selectedJob.assignedPerson
                              ) || "Unassigned"}
                            </p>
                          </div>
                        </div>

                        {/* Job Description */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Job Description
                          </h4>
                          <p className="text-sm text-gray-900">
                            {selectedJob.jobDetails || "No details provided"}
                          </p>
                          {selectedJob.specialDescription && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-700 mb-1">
                                Special Description
                              </h5>
                              <p className="text-sm text-gray-600">
                                {selectedJob.specialDescription}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Documents Section */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">
                              Documents
                              {selectedJob.status === "corrected" && (
                                <span className="ml-2 text-xs text-blue-600">
                                  (Showing Current Version)
                                </span>
                              )}
                            </h4>
                            {selectedJob.status === "corrected" &&
                              selectedJob.resubmissions &&
                              selectedJob.resubmissions.length > 0 && (
                                <button
                                  onClick={() =>
                                    setShowResubmissionHistory(
                                      !showResubmissionHistory
                                    )
                                  }
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  {showResubmissionHistory
                                    ? "Hide History"
                                    : "Show History"}
                                  <ChevronDownIcon
                                    className={`h-4 w-4 ml-1 transition-transform ${
                                      showResubmissionHistory
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>
                              )}
                          </div>

                          {/* Current (Latest) Documents */}
                          {!showResubmissionHistory && (
                            <div className="space-y-2">
                              {(() => {
                                const latestDocs =
                                  getLatestDocuments(selectedJob);
                                return (
                                  <>
                                    {latestDocs.documentPassport && (
                                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                          <span className="text-sm text-gray-900">
                                            Passport:
                                          </span>
                                          <a
                                            href={latestDocs.documentPassport}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            View Document
                                          </a>
                                          {isDocumentUpdated(
                                            selectedJob,
                                            "passport"
                                          ) && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                              Updated
                                            </span>
                                          )}
                                        </div>
                                        <a
                                          href={latestDocs.documentPassport}
                                          download
                                          title="Download Passport"
                                          className="text-gray-500 hover:text-blue-500"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                      </div>
                                    )}

                                    {latestDocs.documentID && (
                                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                          <span className="text-sm text-gray-900">
                                            ID:
                                          </span>
                                          <a
                                            href={latestDocs.documentID}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            View Document
                                          </a>
                                          {isDocumentUpdated(
                                            selectedJob,
                                            "id"
                                          ) && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                              Updated
                                            </span>
                                          )}
                                        </div>
                                        <a
                                          href={latestDocs.documentID}
                                          download
                                          title="Download ID"
                                          className="text-gray-500 hover:text-blue-500"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}

                          {/* Resubmission History */}
                          {selectedJob.status === "corrected" &&
                            selectedJob.resubmissions &&
                            selectedJob.resubmissions.length > 0 &&
                            showResubmissionHistory && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-blue-700 mb-3">
                                  Resubmission History
                                </h4>
                                {selectedJob.resubmissions.map(
                                  (resubmission, index) => (
                                    <div
                                      key={index}
                                      className={`${
                                        index > 0
                                          ? "mt-4 pt-4 border-t border-blue-100"
                                          : ""
                                      } bg-blue-50 p-3 rounded-lg mb-3`}
                                    >
                                      <div className="flex items-center text-xs text-blue-600 mb-2">
                                        <CalendarIcon className="h-4 w-4 mr-1" />
                                        {resubmission.resubmittedAt
                                          ? formatDate(
                                              resubmission.resubmittedAt
                                            )
                                          : "Date not available"}
                                      </div>
                                      <p className="text-sm text-blue-700 mb-3">
                                        {resubmission.resubmitNotes ||
                                          "No notes provided"}
                                      </p>
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-medium text-blue-800 mb-1">
                                          Updated Documents
                                        </h5>
                                        {resubmission.newDocumentPassport && (
                                          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <div className="flex items-center space-x-2">
                                              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                              <span className="text-sm text-gray-900">
                                                Updated Passport:
                                              </span>
                                              <a
                                                href={
                                                  resubmission.newDocumentPassport
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline"
                                              >
                                                View Document
                                              </a>
                                            </div>
                                            <a
                                              href={
                                                resubmission.newDocumentPassport
                                              }
                                              download
                                              title="Download Passport"
                                              className="text-gray-500 hover:text-blue-500"
                                            >
                                              <ArrowDownTrayIcon className="h-5 w-5" />
                                            </a>
                                          </div>
                                        )}

                                        {resubmission.newDocumentID && (
                                          <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                            <div className="flex items-center space-x-2">
                                              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                              <span className="text-sm text-gray-900">
                                                Updated ID:
                                              </span>
                                              <a
                                                href={
                                                  resubmission.newDocumentID
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline"
                                              >
                                                View Document
                                              </a>
                                            </div>
                                            <a
                                              href={resubmission.newDocumentID}
                                              download
                                              title="Download ID"
                                              className="text-gray-500 hover:text-blue-500"
                                            >
                                              <ArrowDownTrayIcon className="h-5 w-5" />
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Original Documents
                                  </h5>
                                  <div className="space-y-2">
                                    {selectedJob.documentPassport && (
                                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                          <span className="text-sm text-gray-900">
                                            Original Passport:
                                          </span>
                                          <a
                                            href={selectedJob.documentPassport}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            View Document
                                          </a>
                                        </div>
                                        <a
                                          href={selectedJob.documentPassport}
                                          download
                                          title="Download Passport"
                                          className="text-gray-500 hover:text-gray-500"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                      </div>
                                    )}
                                    {selectedJob.documentID && (
                                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                                          <span className="text-sm text-gray-900">
                                            Original ID:
                                          </span>
                                          <a
                                            href={selectedJob.documentID}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            View Document
                                          </a>
                                        </div>
                                        <a
                                          href={selectedJob.documentID}
                                          download
                                          title="Download ID"
                                          className="text-gray-500 hover:text-gray-500"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Rejection info */}
                        {selectedJob.status === "rejected" &&
                          selectedJob.rejectionReason && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                              <div className="flex items-start">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                                <div className="ml-3 w-full">
                                  <h4 className="text-sm font-medium text-red-800">
                                    Rejection Reason
                                  </h4>
                                  <p className="mt-1 text-sm text-red-700">
                                    {selectedJob.rejectionReason}
                                  </p>
                                  {selectedJob.rejectionDocument && (
                                    <div className="mt-3 pt-3 border-t border-red-200">
                                      <h5 className="text-sm font-medium text-red-800 mb-2">
                                        Rejection Document
                                      </h5>
                                      <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-red-500" />
                                          <span className="text-sm text-gray-900">
                                            Supporting Document:
                                          </span>
                                          <a
                                            href={selectedJob.rejectionDocument}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline"
                                          >
                                            View Document
                                          </a>
                                        </div>
                                        <a
                                          href={selectedJob.rejectionDocument}
                                          download
                                          title="Download Rejection Document"
                                          className="text-gray-500 hover:text-red-500"
                                        >
                                          <ArrowDownTrayIcon className="h-5 w-5" />
                                        </a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      {/* Footer Buttons */}
                      <div className="mt-6 flex justify-end space-x-3">
                        {/* "View Profile" if approved */}
                        {selectedJob.status === "approved" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => handleViewProfile(selectedJob)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <UserIcon className="h-5 w-5 mr-2" />
                            View Profile
                          </motion.button>
                        )}
                        {/* Approve/Reject if pending or corrected */}
                        {(selectedJob.status === "pending" ||
                          selectedJob.status === "corrected") && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => {
                                setIsDetailModalOpen(false);
                                handleApproveJob(selectedJob);
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                              disabled={isSubmitting}
                            >
                              Approve Job
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              type="button"
                              onClick={() => {
                                setIsDetailModalOpen(false);
                                handleRejectJob(selectedJob);
                              }}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                              disabled={isSubmitting}
                            >
                              Reject Job
                            </motion.button>
                          </>
                        )}
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

        {/* -------- REJECTION MODAL -------- */}
        <Transition appear show={isRejectionModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsRejectionModalOpen(false)}
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
                ​
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
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Reject Job
                    {selectedJob && selectedJob.status === "corrected" && (
                      <div className="mt-1 text-sm font-normal text-gray-500">
                        This job was resubmitted with corrections
                      </div>
                    )}
                  </Dialog.Title>

                  <div className="mt-4">
                    <label
                      htmlFor="rejection-reason"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Reason for Rejection
                    </label>
                    <textarea
                      id="rejection-reason"
                      rows={4}
                      className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 resize-none"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a detailed reason for rejection..."
                    />
                  </div>

                  {/* File Upload Section */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supporting Document (Optional)
                    </label>
                    <div
                      className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
                        dragActive
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300 hover:border-red-400"
                      } border-dashed rounded-xl transition-colors duration-200 relative`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <AnimatePresence mode="wait">
                        {fileDetails ? (
                          <motion.div
                            key="file-details"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col w-full"
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <div className="flex items-center space-x-3">
                                {getFileTypeIcon(fileDetails.name)}
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                                    {fileDetails.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {fileDetails.size}
                                  </span>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                                onClick={removeFile}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </motion.button>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-red-600 h-1.5 rounded-full"
                                style={{ width: "100%" }}
                              ></div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="file-upload"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1 text-center"
                          >
                            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="rejection-file"
                                className="relative cursor-pointer rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="rejection-file"
                                  type="file"
                                  className="sr-only"
                                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                                  onChange={(e) =>
                                    handleFileChange(
                                      e.target.files?.[0] || null
                                    )
                                  }
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PDF, DOC, DOCX, JPG, PNG up to 10MB
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      onClick={() => setIsRejectionModalOpen(false)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 ${
                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={submitRejection}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Rejecting..." : "Reject Job"}
                    </motion.button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* -------- PROFILE MODAL (simple example) -------- */}
        <Transition appear show={isProfileModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsProfileModalOpen(false)}
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
                ​
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
                <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl">
                  {selectedClient && (
                    <>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 mb-4"
                      >
                        Client Profile
                      </Dialog.Title>
                      <div className="mt-2 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedClient.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedClient.email || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Starting Point
                          </label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedClient.startingPoint || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                          onClick={() => setIsProfileModalOpen(false)}
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

export default ComplianceManagement;
