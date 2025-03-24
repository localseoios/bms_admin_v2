import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  UserGroupIcon,
  ArrowPathIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  NoSymbolIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axiosInstance from "../../../utils/axios"; // Adjust the path based on your project structure
import { Toaster, toast } from "react-hot-toast"; // Import the toast library

// Filter options for job status
const filters = [
  { id: "all", name: "All Jobs" },
  { id: "pending", name: "Pending Review" },
  { id: "approved", name: "Approved" },
  { id: "rejected", name: "Rejected" },
  { id: "cancelled", name: "Cancelled" },
];

// Sort options for job list
const sortOptions = [
  { id: "newest", name: "Newest First" },
  { id: "oldest", name: "Oldest First" },
  { id: "client", name: "Client Name" },
  { id: "service", name: "Service Type" },
];

// Service types for display/reference
const serviceTypes = [
  "Company Registration",
  "Tax Filing",
  "Business License",
  "Legal Consultation",
  "Document Verification",
  "Compliance Audit",
];

// Assigned persons for display/reference
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

// Document types for resubmission
const DOCUMENT_TYPES = {
  PASSPORT: "newDocumentPassport",
  ID: "newDocumentID",
  OTHER: "newOtherDocuments",
};

// Helper function to get assigned person name by ID
const getAssignedPersonName = (id) => {
  const person = assignedPersons.find((p) => p.id === id);
  return person ? person.name : "Unknown";
};

// Helper function to get file type icon based on file extension
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

// Custom Toast Notification Component
const NotificationToast = ({ title, message, type = "success" }) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case "error":
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      case "info":
        return <BellAlertIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <BellAlertIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`flex items-start p-4 rounded-lg border ${getBgColor()} shadow-lg`}
    >
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
      <div className="ml-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="mt-1 text-sm text-gray-500">{message}</div>
      </div>
    </div>
  );
};

function AdminJobs() {
  // State for managing jobs data, loading, and errors
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filters, sorting, and search
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  // State for modals and selected job
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // State for resubmission form
  const [resubmitNotes, setResubmitNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for cancellation
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelError, setCancelError] = useState(null);

  // State for notifications
  const [notifications, setNotifications] = useState([]);

  // State for resubmission documents
  const [documentSelections, setDocumentSelections] = useState({
    passport: null,
    id: null,
    others: [],
  });

  // State for document type selection in resubmit modal
  const [selectedDocumentType, setSelectedDocumentType] = useState(
    DOCUMENT_TYPES.OTHER
  );

  // Fetch jobs from the API when the component mounts
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/jobs/get-all-admin");
        setJobs(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load jobs. Please try again later.");
        showNotification(
          "Error",
          "Failed to load jobs. Please try again later.",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Function to show notifications
  const showNotification = (title, message, type = "success") => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full`}
        >
          <NotificationToast title={title} message={message} type={type} />
        </div>
      ),
      {
        duration: 5000,
        position: "top-right",
      }
    );
  };

  // Filter and sort the jobs based on user input
  const filteredJobs = jobs
    .filter((job) => {
      // Filter by status
      if (selectedFilter !== "all" && job.status !== selectedFilter)
        return false;

      // Filter by search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          (job._id && job._id.toLowerCase().includes(searchLower)) ||
          (job.clientName &&
            job.clientName.toLowerCase().includes(searchLower)) ||
          (job.serviceType &&
            job.serviceType.toLowerCase().includes(searchLower)) ||
          (job.jobDetails &&
            job.jobDetails.toLowerCase().includes(searchLower)) ||
          (job.gmail && job.gmail.toLowerCase().includes(searchLower)) ||
          getAssignedPersonName(job.assignedPerson)
            .toLowerCase()
            .includes(searchLower)
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
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Handlers for job actions
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleResubmitJob = (job) => {
    setSelectedJob(job);
    setIsResubmitModalOpen(true);
    resetResubmissionForm();
  };

  const handleDeleteJob = (job) => {
    setSelectedJob(job);
    setIsDeleteModalOpen(true);
  };

  const handleCancelJob = (job) => {
    setSelectedJob(job);
    setCancellationReason("");
    setCancelError(null);
    setIsCancelModalOpen(true);
  };

  // Reset resubmission form state
  const resetResubmissionForm = () => {
    setResubmitNotes("");
    setDocumentSelections({
      passport: null,
      id: null,
      others: [],
    });
    setSelectedDocumentType(DOCUMENT_TYPES.OTHER);
  };

  // Handlers for file uploads in resubmit modal
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    switch (selectedDocumentType) {
      case DOCUMENT_TYPES.PASSPORT:
        setDocumentSelections((prev) => ({
          ...prev,
          passport: files[0],
        }));
        break;
      case DOCUMENT_TYPES.ID:
        setDocumentSelections((prev) => ({
          ...prev,
          id: files[0],
        }));
        break;
      case DOCUMENT_TYPES.OTHER:
        setDocumentSelections((prev) => ({
          ...prev,
          others: [...prev.others, ...files],
        }));
        break;
      default:
        break;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    switch (selectedDocumentType) {
      case DOCUMENT_TYPES.PASSPORT:
        setDocumentSelections((prev) => ({
          ...prev,
          passport: files[0],
        }));
        break;
      case DOCUMENT_TYPES.ID:
        setDocumentSelections((prev) => ({
          ...prev,
          id: files[0],
        }));
        break;
      case DOCUMENT_TYPES.OTHER:
        setDocumentSelections((prev) => ({
          ...prev,
          others: [...prev.others, ...files],
        }));
        break;
      default:
        break;
    }
  };

  const removeDocument = (type, index) => {
    if (type === DOCUMENT_TYPES.PASSPORT) {
      setDocumentSelections((prev) => ({
        ...prev,
        passport: null,
      }));
    } else if (type === DOCUMENT_TYPES.ID) {
      setDocumentSelections((prev) => ({
        ...prev,
        id: null,
      }));
    } else if (type === DOCUMENT_TYPES.OTHER) {
      setDocumentSelections((prev) => ({
        ...prev,
        others: prev.others.filter((_, i) => i !== index),
      }));
    }
  };

  const hasSelectedDocuments = () => {
    return (
      documentSelections.passport !== null ||
      documentSelections.id !== null ||
      documentSelections.others.length > 0
    );
  };

  // Cancel job function
  const confirmCancelJob = async () => {
    if (!cancellationReason.trim()) {
      setCancelError("Cancellation reason is required");
      return;
    }

    setIsSubmitting(true);
    setCancelError(null);

    try {
      const response = await axiosInstance.put(
        `/jobs/${selectedJob._id}/cancel`,
        {
          cancellationReason,
        }
      );

      // Update job in the state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === selectedJob._id ? response.data : job
        )
      );

      setIsCancelModalOpen(false);

      // Show notification for job cancellation
      showNotification(
        "Job Cancelled",
        `${selectedJob.serviceType} job for ${selectedJob.clientName} has been cancelled successfully.`,
        "info"
      );
    } catch (error) {
      console.error("Error cancelling job:", error);
      setCancelError(
        error.response?.data?.message ||
          "Failed to cancel job. Please try again."
      );
      showNotification(
        "Error",
        "Failed to cancel job. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResubmission = async () => {
    if (!resubmitNotes.trim()) {
      showNotification(
        "Missing Information",
        "Please provide resubmission notes.",
        "error"
      );
      return;
    }

    if (!hasSelectedDocuments()) {
      showNotification(
        "Missing Documents",
        "Please upload at least one document.",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append("resubmitNotes", resubmitNotes);

      // Append documents with correct field names matching backend expectations
      if (documentSelections.passport) {
        formData.append("newDocumentPassport", documentSelections.passport);
      }

      if (documentSelections.id) {
        formData.append("newDocumentID", documentSelections.id);
      }

      documentSelections.others.forEach((file) => {
        formData.append("newOtherDocuments", file);
      });

      // PUT request instead of POST to match backend route
      const response = await axiosInstance.put(
        `/jobs/${selectedJob._id}/resubmit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the local job status with the response data
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job._id === selectedJob._id ? response.data : job
        )
      );

      // Close modal and reset form
      setIsResubmitModalOpen(false);
      resetResubmissionForm();

      // Show notification for job resubmission
      showNotification(
        "Job Resubmitted",
        `${selectedJob.serviceType} job for ${selectedJob.clientName} has been resubmitted successfully.`,
        "success"
      );
    } catch (error) {
      console.error("Error resubmitting job:", error);
      showNotification(
        "Resubmission Failed",
        "Failed to resubmit job. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);

    try {
      await axiosInstance.delete(`/jobs/${selectedJob._id}`);

      // Remove the job from the local state
      setJobs((prevJobs) =>
        prevJobs.filter((job) => job._id !== selectedJob._id)
      );

      setIsDeleteModalOpen(false);

      // Show notification for job deletion
      showNotification(
        "Job Deleted",
        `${selectedJob.serviceType} job for ${selectedJob.clientName} has been deleted successfully.`,
        "info"
      );
    } catch (error) {
      console.error("Error deleting job:", error);
      showNotification(
        "Error",
        "Failed to delete job. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Utility functions for status styling
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "cancelled":
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
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
      case "cancelled":
        return <NoSymbolIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Check if job can be cancelled
  const canBeCancelled = (job) => {
    return job.status !== "cancelled"; // Jobs can be cancelled if they're not already cancelled
  };

  const exportData = () => {
    // Convert jobs data to CSV format
    const headers = [
      "Job ID",
      "Service Type",
      "Client Name",
      "Email",
      "Start Point",
      "Status",
      "Created Date",
      "Assigned To",
    ].join(",");

    const rows = filteredJobs.map((job) =>
      [
        job._id,
        job.serviceType || "N/A",
        job.clientName || "N/A",
        job.gmail || "N/A",
        job.startingPoint || "N/A",
        job.status || "pending",
        new Date(job.createdAt).toLocaleDateString(),
        getAssignedPersonName(job.assignedPerson),
      ].join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `jobs_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50">
      {/* Toast Container */}
      <Toaster />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin - Job Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and monitor all job submissions across the platform
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <button
              onClick={exportData}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group"
            >
              <ArrowDownTrayIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              Export Data
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-gray-50 rounded-xl">
                <NoSymbolIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading
                    ? "..."
                    : jobs.filter((job) => job.status === "cancelled").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
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
                    placeholder="Search by Job ID, Client, Service Type, Email..."
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
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
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
                      colSpan="7"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading jobs...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 text-center text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
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
                          <div className="text-sm font-medium text-gray-900">
                            {job._id}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.startingPoint || "No starting point"}
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
                          <div className="text-sm text-gray-900">
                            {job.clientName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.gmail || "N/A"}
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
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewJob(job)}
                              className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>

                            {/* Only show resubmit button if job status is rejected */}
                            {job.status === "rejected" && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleResubmitJob(job)}
                                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                                title="Resubmit Job"
                              >
                                <ArrowPathIcon className="h-5 w-5" />
                              </motion.button>
                            )}

                            {/* Cancel button - only show if job is not already cancelled */}
                            {canBeCancelled(job) && (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleCancelJob(job)}
                                className="text-gray-600 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                title="Cancel Job"
                              >
                                <NoSymbolIcon className="h-5 w-5" />
                              </motion.button>
                            )}

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteJob(job)}
                              className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                              title="Delete Job"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>

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

                        <div className="bg-gray-50 p-4 rounded-xl">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Documents
                          </h4>
                          <div className="space-y-2">
                            {selectedJob.documentPassport && (
                              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                  <span className="text-sm text-gray-900">
                                    Passport
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={selectedJob.documentPassport}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                                  >
                                    View
                                  </a>
                                  <a
                                    href={selectedJob.documentPassport}
                                    download
                                    className="text-sm text-green-600 hover:underline px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors flex items-center"
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}
                            {selectedJob.documentID && (
                              <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                  <span className="text-sm text-gray-900">
                                    ID
                                  </span>
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={selectedJob.documentID}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                                  >
                                    View
                                  </a>
                                  <a
                                    href={selectedJob.documentID}
                                    download
                                    className="text-sm text-green-600 hover:underline px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors flex items-center"
                                  >
                                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}
                            {selectedJob.otherDocuments &&
                              selectedJob.otherDocuments.length > 0 && (
                                <>
                                  <h5 className="text-sm font-medium text-gray-700 mt-3 mb-2">
                                    Other Documents
                                  </h5>
                                  {selectedJob.otherDocuments.map(
                                    (doc, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-white rounded-lg"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                                          <span className="text-sm text-gray-900">
                                            Document {index + 1}
                                          </span>
                                        </div>
                                        <div className="flex space-x-2">
                                          <a
                                            href={doc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                                          >
                                            View
                                          </a>
                                          <a
                                            href={doc}
                                            download
                                            className="text-sm text-green-600 hover:underline px-2 py-1 rounded bg-green-50 hover:bg-green-100 transition-colors flex items-center"
                                          >
                                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                                            Download
                                          </a>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </>
                              )}
                            {!selectedJob.documentPassport &&
                              !selectedJob.documentID &&
                              (!selectedJob.otherDocuments ||
                                selectedJob.otherDocuments.length === 0) && (
                                <p className="text-sm text-gray-500">
                                  No documents available
                                </p>
                              )}
                          </div>
                        </div>

                        {selectedJob.status === "rejected" &&
                          selectedJob.rejectionReason && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                              <div className="flex items-start">
                                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium text-red-800">
                                    Rejection Details
                                  </h4>
                                  <p className="mt-1 text-sm text-red-700">
                                    {selectedJob.rejectionReason ||
                                      "No reason provided"}
                                  </p>
                                  {selectedJob.rejectionDocument && (
                                    <div className="mt-2 flex items-center space-x-2">
                                      <DocumentTextIcon className="h-4 w-4 text-red-500" />
                                      <a
                                        href={selectedJob.rejectionDocument}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-red-700 hover:underline"
                                      >
                                        View Rejection Document
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {/* Display cancellation reason if job is cancelled */}
                        {selectedJob.status === "cancelled" &&
                          selectedJob.cancellationReason && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                              <div className="flex items-start">
                                <NoSymbolIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div className="ml-3">
                                  <h4 className="text-sm font-medium text-gray-800">
                                    Cancellation Details
                                  </h4>
                                  <p className="mt-1 text-sm text-gray-700">
                                    {selectedJob.cancellationReason ||
                                      "No reason provided"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        {selectedJob.status === "rejected" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleResubmitJob(selectedJob);
                            }}
                          >
                            Resubmit Job
                          </motion.button>
                        )}

                        {/* Add Cancel button in details modal */}
                        {canBeCancelled(selectedJob) && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                            onClick={() => {
                              setIsDetailModalOpen(false);
                              handleCancelJob(selectedJob);
                            }}
                          >
                            Cancel Job
                          </motion.button>
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

        {/* Resubmit Modal */}
        <Transition appear show={isResubmitModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsResubmitModalOpen(false)}
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
                    Resubmit Job
                  </Dialog.Title>

                  {selectedJob &&
                    selectedJob.status === "rejected" &&
                    selectedJob.rejectionReason && (
                      <div className="bg-red-50 p-4 rounded-xl mb-4">
                        <div className="flex items-start">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-red-800">
                              Previous Rejection Reason
                            </h4>
                            <p className="mt-1 text-sm text-red-700">
                              {selectedJob.rejectionReason ||
                                "No reason provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="mt-4">
                    <label
                      htmlFor="resubmit-notes"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Resubmission Notes
                    </label>
                    <textarea
                      id="resubmit-notes"
                      rows={4}
                      className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      value={resubmitNotes}
                      onChange={(e) => setResubmitNotes(e.target.value)}
                      placeholder="Please provide details about the changes made..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocumentType(DOCUMENT_TYPES.PASSPORT)
                        }
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          selectedDocumentType === DOCUMENT_TYPES.PASSPORT
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Passport
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocumentType(DOCUMENT_TYPES.ID)
                        }
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          selectedDocumentType === DOCUMENT_TYPES.ID
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        ID
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDocumentType(DOCUMENT_TYPES.OTHER)
                        }
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          selectedDocumentType === DOCUMENT_TYPES.OTHER
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Other
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedDocumentType === DOCUMENT_TYPES.PASSPORT
                        ? "Upload New Passport Document"
                        : selectedDocumentType === DOCUMENT_TYPES.ID
                        ? "Upload New ID Document"
                        : "Upload Other Documents"}
                    </label>

                    {/* Always render the file input, but hide it with sr-only */}
                    <input
                      id="resubmit-files"
                      type="file"
                      className="sr-only"
                      multiple={selectedDocumentType === DOCUMENT_TYPES.OTHER}
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />

                    <div
                      className={`mt-1 flex flex-col justify-center px-6 pt-5 pb-6 border-2 ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      } border-dashed rounded-xl transition-colors duration-200`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {/* Document display sections */}
                      {selectedDocumentType === DOCUMENT_TYPES.PASSPORT &&
                      documentSelections.passport ? (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getFileTypeIcon(documentSelections.passport.name)}
                            <span className="text-sm font-medium text-gray-900">
                              {documentSelections.passport.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              (
                              {(
                                documentSelections.passport.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeDocument(DOCUMENT_TYPES.PASSPORT)
                            }
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : selectedDocumentType === DOCUMENT_TYPES.ID &&
                        documentSelections.id ? (
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center space-x-2">
                            {getFileTypeIcon(documentSelections.id.name)}
                            <span className="text-sm font-medium text-gray-900">
                              {documentSelections.id.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              (
                              {(
                                documentSelections.id.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(DOCUMENT_TYPES.ID)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : selectedDocumentType === DOCUMENT_TYPES.OTHER &&
                        documentSelections.others.length > 0 ? (
                        <div className="space-y-2">
                          {documentSelections.others.map((doc, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-white rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                {getFileTypeIcon(doc.name)}
                                <span className="text-sm font-medium text-gray-900">
                                  {doc.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  removeDocument(DOCUMENT_TYPES.OTHER, index)
                                }
                                className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors duration-200"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById("resubmit-files").click()
                            }
                            className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                          >
                            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                            Add More Files
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 text-center">
                          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="resubmit-files"
                              className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                            >
                              <span>Upload files</span>
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, DOCX, JPG up to 10MB each
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document summary section */}
                  {(documentSelections.passport ||
                    documentSelections.id ||
                    documentSelections.others.length > 0) && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        Selected Documents
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {documentSelections.passport && (
                          <li className="flex items-center text-blue-700">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Passport document
                          </li>
                        )}
                        {documentSelections.id && (
                          <li className="flex items-center text-blue-700">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            ID document
                          </li>
                        )}
                        {documentSelections.others.length > 0 && (
                          <li className="flex items-center text-blue-700">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            {documentSelections.others.length} other document
                            {documentSelections.others.length > 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setIsResubmitModalOpen(false);
                        resetResubmissionForm();
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      onClick={submitResubmission}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Resubmit Job"
                      )}
                    </motion.button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Cancel Job Modal */}
        <Transition appear show={isCancelModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsCancelModalOpen(false)}
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
                  <div className="flex items-center space-x-3 text-gray-600">
                    <NoSymbolIcon className="h-6 w-6" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6"
                    >
                      Cancel Job
                    </Dialog.Title>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to cancel this job? This action
                      cannot be undone.
                    </p>

                    <div className="mt-4">
                      <label
                        htmlFor="cancellation-reason"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Cancellation Reason{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="cancellation-reason"
                        rows={4}
                        className="mt-1 block w-full rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Please provide a reason for cancellation..."
                      />
                      {cancelError && (
                        <p className="mt-1 text-sm text-red-600">
                          {cancelError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      onClick={() => setIsCancelModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Go Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      onClick={confirmCancelJob}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        "Cancel Job"
                      )}
                    </motion.button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>

        {/* Delete Confirmation Modal */}
        <Transition appear show={isDeleteModalOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsDeleteModalOpen(false)}
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
                  <div className="flex items-center space-x-3 text-red-600">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6"
                    >
                      Delete Job
                    </Dialog.Title>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this job? This action
                      cannot be undone. All data associated with this job will
                      be permanently removed.
                    </p>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className={`px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 flex items-center ${
                        isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      onClick={confirmDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Job"
                      )}
                    </motion.button>
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}

export default AdminJobs;