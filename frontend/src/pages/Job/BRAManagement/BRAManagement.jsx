import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  BriefcaseIcon,
  IdentificationIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  ShieldExclamationIcon,
  PaperClipIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

// Toast notification helper function
const showNotification = ({ type, message, duration = 3000 }) => {
  toast[type](message, { autoClose: duration });
};

function BRAManagement() {
  const navigate = useNavigate();
  const [braRequests, setBraRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Document upload state
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");

  // Loading states for different actions
  const [initializingId, setInitializingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { user } = useAuth();

  // Check user permissions for BRA roles
  const isLMRO = user?.role?.permissions?.braManagement?.lmro;
  const isDLMRO = user?.role?.permissions?.braManagement?.dlmro;
  const isCEO = user?.role?.permissions?.braManagement?.ceo;
  const isAdmin = user?.role?.name === "admin";
  const hasBRARole = isLMRO || isDLMRO || isCEO || isAdmin;

  // Navigate to client profile
  const navigateToClientProfile = (job, e) => {
    if (e) e.stopPropagation();

    if (job && job.clientName) {
      console.log(
        `Navigating to compliance search for client: ${job.clientName}`
      );
      navigate(`/compliance?search=${encodeURIComponent(job.clientName)}`);
      showNotification({
        type: "info",
        message: `Searching for client: ${job.clientName}`,
        duration: 3000,
      });
    } else {
      showNotification({
        type: "error",
        message: "Cannot find client information",
        duration: 3000,
      });
      console.error("Navigation failed - job data:", job);
    }
  };

  // API error handler
  const handleApiError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    showNotification({
      type: "error",
      message: error.response?.data?.message || defaultMessage,
    });
  };

  // Reset form when modal is closed
  const resetForm = () => {
    setApprovalNotes("");
    setDocumentFile(null);
    setDocumentError("");
    setSelectedJob(null);
    setUploadProgress(0);
  };

  // Function to refresh a single job's status
  const refreshJobStatus = async (jobId) => {
    try {
      const response = await axiosInstance.get(`/bra/jobs/${jobId}/status`);

      setBraRequests((prevRequests) =>
        prevRequests.map((job) =>
          job._id === jobId
            ? {
                ...job,
                braApproval: response.data.exists ? response.data : null,
                status: response.data.exists
                  ? job.status
                  : response.data.jobStatus,
              }
            : job
        )
      );

      return response.data;
    } catch (error) {
      console.error(`Error refreshing job ${jobId}:`, error);
      return null;
    }
  };

  // Fetch all BRA requests
  const fetchBRARequests = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all jobs with the relevant statuses
      const response = await axiosInstance.get("/bra/jobs", {
        params: {
          status: [
            "completed", // KYC completed jobs eligible for BRA
            "bra_pending",
            "bra_lmro_approved",
            "bra_dlmro_approved",
          ],
        },
      });

      console.log("Jobs data fetched:", response.data);

      if (!Array.isArray(response.data)) {
        setError("Received invalid data format from server");
        setLoading(false);
        return;
      }

      // Get detailed BRA status for each job
      const jobsWithBraStatus = await Promise.all(
        response.data.map(async (job) => {
          try {
            const braResponse = await axiosInstance.get(
              `/bra/jobs/${job._id}/status`
            );

            // Check if the BRA record exists
            if (!braResponse.data.exists) {
              return {
                ...job,
                braApproval: null,
                canInitialize: braResponse.data.canInitialize,
              };
            }

            return { ...job, braApproval: braResponse.data };
          } catch (err) {
            console.log(
              `Error fetching BRA status for job ${job._id}: ${err.message}`
            );
            return { ...job, braApproval: null };
          }
        })
      );

      setBraRequests(jobsWithBraStatus);
      setError(null);
    } catch (err) {
      handleApiError(err, "Failed to load BRA requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasBRARole) {
      fetchBRARequests();
    } else {
      setError("You don't have permission to access BRA management");
      setLoading(false);
    }
  }, [fetchBRARequests, hasBRARole]);

  // Filter BRA requests based on search and status filter
  const filteredRequests = braRequests.filter((job) => {
    // Match search query
    const searchMatch =
      searchQuery === "" ||
      job.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job._id?.toLowerCase().includes(searchQuery.toLowerCase());

    // Match status filter
    let statusMatch = true;
    if (selectedFilter !== "all") {
      if (selectedFilter === "pending") {
        statusMatch =
          job.status === "completed" || // Jobs that completed KYC
          (!job.braApproval && job.status === "bra_pending") ||
          (job.braApproval && job.braApproval.currentApprovalStage === "lmro");
      } else if (selectedFilter === "lmro_approved") {
        statusMatch =
          job.status === "bra_lmro_approved" ||
          (job.braApproval && job.braApproval.currentApprovalStage === "dlmro");
      } else if (selectedFilter === "dlmro_approved") {
        statusMatch =
          job.status === "bra_dlmro_approved" ||
          (job.braApproval && job.braApproval.currentApprovalStage === "ceo");
      }
    }

    return searchMatch && statusMatch;
  });

  // Get BRA status display info
  const getBRAStatusInfo = (job) => {
    // If no BRA approval but job is KYC completed, show as ready for BRA
    if (!job.braApproval && job.status === "completed") {
      return {
        label: "Ready for BRA",
        color: "bg-teal-50 text-teal-700 ring-teal-600/20",
        icon: <ArrowPathIcon className="h-5 w-5 text-teal-500" />,
        actionText: "Initialize BRA",
      };
    }

    // If no BRA approval but already in BRA status, it's pending LMRO review
    if (!job.braApproval && job.status === "bra_pending") {
      return {
        label: "LMRO Review Pending",
        color: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-yellow-500" />,
      };
    }

    if (!job.braApproval) {
      return {
        label: "BRA Status Unknown",
        color: "bg-gray-50 text-gray-700 ring-gray-600/20",
        icon: <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />,
      };
    }

    const stage = job.braApproval.currentApprovalStage;

    if (job.braApproval.status === "rejected") {
      return {
        label: "BRA Rejected",
        color: "bg-red-50 text-red-700 ring-red-600/20",
        icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
      };
    } else if (job.braApproval.status === "completed") {
      return {
        label: "BRA Completed",
        color: "bg-green-50 text-green-700 ring-green-600/20",
        icon: <CheckIcon className="h-5 w-5 text-green-500" />,
      };
    } else if (stage === "lmro") {
      return {
        label: "LMRO Review",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-blue-500" />,
      };
    } else if (stage === "dlmro") {
      return {
        label: "DLMRO Review",
        color: "bg-purple-50 text-purple-700 ring-purple-600/20",
        icon: (
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
        ),
      };
    } else if (stage === "ceo") {
      return {
        label: "CEO Review",
        color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        icon: <LockClosedIcon className="h-5 w-5 text-indigo-500" />,
      };
    }

    return {
      label: "Processing",
      color: "bg-gray-50 text-gray-700 ring-gray-600/20",
      icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
    };
  };

  // Get the current approval stage name for document labels
  const getCurrentStageName = (job) => {
    if (!job || !job.braApproval) return "";

    const stage = job.braApproval.currentApprovalStage;
    if (stage === "lmro") return "LMRO";
    if (stage === "dlmro") return "DLMRO";
    if (stage === "ceo") return "CEO";
    return "";
  };

  // Check if the current user can approve a job
  const canApprove = (job) => {
    // Admin can approve at any stage
    if (isAdmin) return true;

    // Jobs ready for BRA initialization
    if (!job.braApproval && job.status === "completed") {
      return false; // Can't approve, can only initialize
    }

    if (!job.braApproval) return false;

    const stage = job.braApproval.currentApprovalStage;

    if (stage === "lmro" && isLMRO) return true;
    if (stage === "dlmro" && isDLMRO) return true;
    if (stage === "ceo" && isCEO) return true;

    return false;
  };

  // Check if the current user can initialize BRA for a job
  const canInitializeBRA = (job) => {
    return (
      job.status === "completed" &&
      !job.braApproval &&
      (isAdmin || user?.role?.permissions?.operationManagement)
    );
  };

  // Handle opening the approval modal
  const handleOpenApprovalModal = (job) => {
    setSelectedJob(job);
    setApprovalModalOpen(true);
    setDocumentError("");
    setDocumentFile(null);
  };

  // Handle opening the rejection modal
  const handleOpenRejectionModal = (job) => {
    setSelectedJob(job);
    setRejectionModalOpen(true);
  };

  // Validate file before upload
  const validateFile = (file) => {
    if (!file) {
      setDocumentError("Document upload is required");
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setDocumentError("File size must be less than 10MB");
      return false;
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setDocumentError(
        "Invalid file type. Only PDF, Word, Excel, and image files are allowed."
      );
      return false;
    }

    setDocumentError("");
    return true;
  };

  // Handle document file selection
  const handleDocumentChange = (e) => {
    const file = e.target.files[0];
    setDocumentFile(file);
    validateFile(file);
  };

  // Handle submit approval with Cloudinary upload
  const handleSubmitApproval = async () => {
    if (!selectedJob) return;

    // Validate document upload
    if (!validateFile(documentFile)) {
      return;
    }

    setSubmitting(true);
    setApprovingId(selectedJob._id);
    setUploadProgress(10); // Start progress indicator

    try {
      let endpoint = "";

      // If the user is an admin, they can approve at any stage
      if (isAdmin && selectedJob.braApproval) {
        const stage = selectedJob.braApproval.currentApprovalStage;
        if (stage === "lmro") {
          endpoint = `/bra/jobs/${selectedJob._id}/lmro-approve`;
        } else if (stage === "dlmro") {
          endpoint = `/bra/jobs/${selectedJob._id}/dlmro-approve`;
        } else if (stage === "ceo") {
          endpoint = `/bra/jobs/${selectedJob._id}/ceo-approve`;
        }
      } else if (selectedJob.braApproval) {
        // Normal user flow
        const stage = selectedJob.braApproval.currentApprovalStage;
        if (stage === "lmro" && isLMRO) {
          endpoint = `/bra/jobs/${selectedJob._id}/lmro-approve`;
        } else if (stage === "dlmro" && isDLMRO) {
          endpoint = `/bra/jobs/${selectedJob._id}/dlmro-approve`;
        } else if (stage === "ceo" && isCEO) {
          endpoint = `/bra/jobs/${selectedJob._id}/ceo-approve`;
        }
      }

      if (!endpoint) {
        throw new Error("You don't have permission to approve at this stage");
      }

      // Create FormData for file upload to Cloudinary
      const formData = new FormData();
      formData.append("notes", approvalNotes);
      formData.append("document", documentFile);

      setUploadProgress(30); // Update progress during form preparation

      // Send request with FormData for Cloudinary upload
      await axiosInstance.put(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          // Calculate and update upload progress
          const percentCompleted =
            Math.round((progressEvent.loaded * 70) / progressEvent.total) + 30;
          setUploadProgress(percentCompleted > 100 ? 100 : percentCompleted);
        },
      });

      setUploadProgress(100); // Complete progress

      // Refresh the job status instead of entire list
      await refreshJobStatus(selectedJob._id);

      // Close modal and reset form
      setApprovalModalOpen(false);
      resetForm();

      // Show success message
      showNotification({
        type: "success",
        message: "Approval submitted successfully with document!",
      });
    } catch (err) {
      handleApiError(err, "Failed to submit approval");
      setUploadProgress(0); // Reset progress on error
    } finally {
      setSubmitting(false);
      setApprovingId(null);
    }
  };

  // Handle rejection submission
  const handleSubmitRejection = async () => {
    if (!selectedJob || !rejectionReason) return;

    setSubmitting(true);
    setRejectingId(selectedJob._id);

    try {
      await axiosInstance.put(`/bra/jobs/${selectedJob._id}/reject`, {
        rejectionReason,
      });

      // Refresh the job status
      await refreshJobStatus(selectedJob._id);

      // Close modal and reset form
      setRejectionModalOpen(false);
      setRejectionReason("");
      setSelectedJob(null);

      // Show success message
      showNotification({
        type: "success",
        message: "Job rejected successfully!",
      });
    } catch (err) {
      handleApiError(err, "Failed to reject job");
    } finally {
      setSubmitting(false);
      setRejectingId(null);
    }
  };

  // Initialize BRA process
  const handleInitializeBRA = async (job) => {
    try {
      setInitializingId(job._id);
      await axiosInstance.post(`/bra/jobs/${job._id}/initialize`);

      // Refresh the job status
      await refreshJobStatus(job._id);

      showNotification({
        type: "success",
        message: "BRA process initialized successfully!",
        duration: 3000,
      });
    } catch (err) {
      handleApiError(err, "Failed to initialize BRA process");
    } finally {
      setInitializingId(null);
    }
  };

  // Handle refresh all data
  const handleRefreshData = () => {
    fetchBRARequests();
    showNotification({
      type: "info",
      message: "Refreshing BRA data...",
      duration: 2000,
    });
  };

  // Render document link - for document replacement model
  const renderDocumentLink = (job) => {
    // If no BRA approval exists, return null
    if (!job.braApproval) return null;

    // Determine which document to show based on approval stage
    let document = null;
    let stageLabel = "";

    // For completed BRA, show CEO document
    if (
      job.braApproval.status === "completed" &&
      job.braApproval.ceoApproval?.document
    ) {
      document = job.braApproval.ceoApproval.document;
      stageLabel = "Final Approved";
    }
    // For CEO stage, show DLMRO document
    else if (
      job.braApproval.currentApprovalStage === "ceo" &&
      job.braApproval.dlmroApproval?.document
    ) {
      document = job.braApproval.dlmroApproval.document;
      stageLabel = "DLMRO";
    }
    // For DLMRO stage, show LMRO document
    else if (
      job.braApproval.currentApprovalStage === "dlmro" &&
      job.braApproval.lmroApproval?.document
    ) {
      document = job.braApproval.lmroApproval.document;
      stageLabel = "LMRO";
    }
    // For LMRO stage, also show LMRO document if available
    else if (
      job.braApproval.currentApprovalStage === "lmro" &&
      job.braApproval.lmroApproval?.document
    ) {
      document = job.braApproval.lmroApproval.document;
      stageLabel = "LMRO";
    }

    // If no document is available, return null
    if (!document || !document.fileUrl) return null;

    return (
      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
        {stageLabel} Document: {document.fileName}
      </a>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-8 rounded-lg max-w-md">
          <h3 className="text-red-800 font-medium text-xl mb-4">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasBRARole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 p-8 rounded-lg max-w-md">
          <ShieldExclamationIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-yellow-800 font-medium text-xl mb-4 text-center">
            Access Restricted
          </h3>
          <p className="text-yellow-700 mb-4 text-center">
            You don't have permission to access the BRA Management area. Please
            contact your administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-lg">
                <ClipboardIcon className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  BRA Management
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {isLMRO
                    ? "LMRO"
                    : isDLMRO
                    ? "DLMRO"
                    : isCEO
                    ? "CEO"
                    : "Admin"}{" "}
                  Dashboard - Review and approve BRA submissions
                </p>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={handleRefreshData}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Jobs
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {braRequests.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-teal-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      LMRO Review
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {
                        braRequests.filter(
                          (job) =>
                            (!job.braApproval &&
                              job.status === "bra_pending") ||
                            (job.braApproval &&
                              job.braApproval.currentApprovalStage === "lmro")
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      DLMRO Review
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {
                        braRequests.filter(
                          (job) =>
                            job.status === "bra_lmro_approved" ||
                            (job.braApproval &&
                              job.braApproval.currentApprovalStage === "dlmro")
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <LockClosedIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      CEO Review
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {
                        braRequests.filter(
                          (job) =>
                            job.status === "bra_dlmro_approved" ||
                            (job.braApproval &&
                              job.braApproval.currentApprovalStage === "ceo")
                        ).length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                    placeholder="Search by client name or job ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="block w-full rounded-md border-gray-300 focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending / LMRO Review</option>
                  <option value="lmro_approved">DLMRO Review</option>
                  <option value="dlmro_approved">CEO Review</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BRA List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No BRA requests found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no BRA requests matching your criteria.
              </p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-200">
              {filteredRequests.map((job) => {
                const statusInfo = getBRAStatusInfo(job);
                return (
                  <li
                    key={job._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {/* Modified client icon to be clickable and navigate to profile */}
                          <div
                            className="flex-shrink-0 cursor-pointer hover:bg-gray-100 p-2 rounded-full transition-colors"
                            onClick={(e) => navigateToClientProfile(job, e)}
                            title={`View ${job.clientName}'s profile`}
                          >
                            <BuildingOfficeIcon className="h-6 w-6 text-teal-500" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {job.clientName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {job.serviceType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.label}</span>
                          </span>

                          {/* Show Initialize button for KYC completed jobs without BRA */}
                          {canInitializeBRA(job) && (
                            <button
                              onClick={() => handleInitializeBRA(job)}
                              disabled={initializingId === job._id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {initializingId === job._id ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Initializing...
                                </>
                              ) : (
                                <>
                                  <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                                  {statusInfo.actionText || "Initialize BRA"}
                                </>
                              )}
                            </button>
                          )}

                          {/* Show approval/rejection buttons for jobs at user's approval stage */}
                          {canApprove(job) && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleOpenApprovalModal(job)}
                                disabled={approvingId === job._id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                <DocumentArrowUpIcon className="h-4 w-4 mr-1.5" />
                                Upload & Approve
                              </button>
                              <button
                                onClick={() => handleOpenRejectionModal(job)}
                                disabled={rejectingId === job._id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                              >
                                <XMarkIcon className="h-4 w-4 mr-1.5" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <DocumentTextIcon
                              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            Job ID: {job._id}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
                            Created:{" "}
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Document Link - Only show current document */}
                      {job.braApproval && (
                        <div className="mt-2 border-t border-gray-100 pt-2">
                          <div className="text-xs text-gray-500 font-medium">
                            Current Document:
                          </div>
                          <div className="flex flex-col space-y-1">
                            {renderDocumentLink(job)}
                          </div>
                        </div>
                      )}

                      {/* BRA Progress Bar */}
                      {job.braApproval && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>LMRO</span>
                            <span>DLMRO</span>
                            <span>CEO</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* LMRO */}
                            <div
                              className={`h-2 flex-1 rounded-l-full ${
                                job.braApproval.lmroApproval &&
                                job.braApproval.lmroApproval.approved
                                  ? "bg-teal-500"
                                  : "bg-gray-200"
                              }`}
                            ></div>

                            {/* DLMRO */}
                            <div
                              className={`h-2 flex-1 ${
                                job.braApproval.dlmroApproval &&
                                job.braApproval.dlmroApproval.approved
                                  ? "bg-teal-500"
                                  : "bg-gray-200"
                              }`}
                            ></div>

                            {/* CEO */}
                            <div
                              className={`h-2 flex-1 rounded-r-full ${
                                job.braApproval.ceoApproval &&
                                job.braApproval.ceoApproval.approved
                                  ? "bg-teal-500"
                                  : "bg-gray-200"
                              }`}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason (if rejected) */}
                      {job.braApproval &&
                        job.braApproval.status === "rejected" && (
                          <div className="mt-3 p-2 bg-red-50 rounded-md border border-red-200">
                            <p className="text-xs font-medium text-red-800">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-700">
                              {job.braApproval.rejectionReason ||
                                "No reason provided"}
                            </p>
                          </div>
                        )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Approval Modal - Updated to include document upload to Cloudinary */}
      <AnimatePresence>
        {approvalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {getCurrentStageName(selectedJob)} Approval
              </h3>

              {/* Document Upload Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Upload <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="document-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="document-upload"
                          name="document"
                          type="file"
                          className="sr-only"
                          onChange={handleDocumentChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel or image file up to 10MB
                    </p>
                    {documentFile && (
                      <div className="flex items-center mt-2 text-sm text-gray-800">
                        <PaperClipIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {documentFile.name} (
                        {(documentFile.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    )}
                  </div>
                </div>
                {documentError && (
                  <p className="mt-1 text-sm text-red-600">{documentError}</p>
                )}
                <p className="mt-2 text-sm text-teal-600 font-medium">
                  Document submission is mandatory for approval
                </p>
                {/* Information about document replacement */}
                {selectedJob &&
                  selectedJob.braApproval &&
                  (selectedJob.braApproval.currentApprovalStage === "dlmro" ||
                    selectedJob.braApproval.currentApprovalStage === "ceo") && (
                    <p className="mt-2 text-sm text-amber-600 font-medium">
                      Note: Uploading a new document will replace the previous
                      one
                    </p>
                  )}
              </div>

              {/* Upload Progress Bar (for Cloudinary) */}
              {uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                          Uploading...
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-teal-600">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-200">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-300"
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  rows={3}
                  placeholder="Add any notes about this approval..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setApprovalModalOpen(false);
                    resetForm();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  disabled={
                    submitting ||
                    !documentFile ||
                    (uploadProgress > 0 && uploadProgress < 100)
                  }
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                      Upload & Approve
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject BRA
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  rows={4}
                  placeholder="Provide a reason for rejection..."
                  required
                ></textarea>
                {!rejectionReason && (
                  <p className="mt-1 text-sm text-red-600">
                    Rejection reason is required
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setRejectionModalOpen(false);
                    setRejectionReason("");
                    setSelectedJob(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRejection}
                  disabled={submitting || !rejectionReason}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default BRAManagement;