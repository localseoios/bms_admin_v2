import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
  ShieldCheckIcon,
  EyeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../utils/axios";

// Toast notification helper function
const showNotification = ({ type, message, duration = 3000 }) => {
  toast[type](message, { autoClose: duration });
};

const IntegratedKYCManagement = ({
  job,
  refreshJobData,
  user,
  kycDetails,
  personDetailsLoading,
  setActivePersonTab,
}) => {
  // States for KYC management
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentError, setDocumentError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [canInitializeKyc, setCanInitializeKyc] = useState(false);
  const [jobHistory, setJobHistory] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Action loading states
  const [initializing, setInitializing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Check user permissions for KYC roles
  const isLMRO = user?.role?.permissions?.kycManagement?.lmro;
  const isDLMRO = user?.role?.permissions?.kycManagement?.dlmro;
  const isCEO = user?.role?.permissions?.kycManagement?.ceo;
  const isAdmin = user?.role?.name === "admin";
  const hasKYCRole = isLMRO || isDLMRO || isCEO || isAdmin;

  // Fetch KYC status for this job
  useEffect(() => {
    if (job && job._id) {
      fetchKycStatus();
    }
  }, [job]);

  const fetchKycStatus = async () => {
    try {
      const response = await axiosInstance.get(`/kyc/jobs/${job._id}/status`);

      setKycStatus(response.data.exists ? response.data : null);
      setCanInitializeKyc(response.data.canInitialize);

      return response.data;
    } catch (error) {
      console.error(`Error fetching KYC status for job ${job._id}:`, error);
      return null;
    }
  };

  // Fetch KYC history
  const fetchKycHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axiosInstance.get(`/kyc/jobs/${job._id}/history`);
      setJobHistory(response.data || []);
    } catch (error) {
      console.error(`Error fetching KYC history for job ${job._id}:`, error);
      showNotification({
        type: "error",
        message: "Failed to load KYC history",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reset form states
  const resetForm = () => {
    setApprovalNotes("");
    setDocumentFile(null);
    setDocumentError("");
    setUploadProgress(0);
  };

  // Get current approval stage name
  const getCurrentStageName = () => {
    if (!kycStatus) return "";

    const stage = kycStatus.currentApprovalStage;
    if (stage === "lmro") return "LMRO";
    if (stage === "dlmro") return "DLMRO";
    if (stage === "ceo") return "CEO";
    return "";
  };

  // Check if the current user can approve
  const canApprove = () => {
    // Admin can approve at any stage
    if (isAdmin) return true;

    // Jobs ready for KYC initialization
    if (!kycStatus && job.status === "om_completed") {
      return false; // Can't approve, can only initialize
    }

    if (!kycStatus) return false;

    const stage = kycStatus.currentApprovalStage;

    if (stage === "lmro" && isLMRO) return true;
    if (stage === "dlmro" && isDLMRO) return true;
    if (stage === "ceo" && isCEO) return true;

    return false;
  };

  // Check if the current user can initialize KYC
  const canInitializeKYC = () => {
    return (
      job.status === "om_completed" &&
      !kycStatus &&
      canInitializeKyc &&
      (isAdmin || user?.role?.permissions?.operationManagement)
    );
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

  // Initialize KYC process
  const handleInitializeKYC = async () => {
    try {
      setInitializing(true);
      await axiosInstance.post(`/kyc/jobs/${job._id}/initialize`);

      // Refresh the job status
      await fetchKycStatus();
      if (refreshJobData) {
        refreshJobData();
      }

      showNotification({
        type: "success",
        message: "KYC process initialized successfully!",
        duration: 3000,
      });
    } catch (err) {
      console.error("Failed to initialize KYC process:", err);
      showNotification({
        type: "error",
        message:
          err.response?.data?.message || "Failed to initialize KYC process",
      });
    } finally {
      setInitializing(false);
    }
  };

  // Handle submit approval with document upload
  const handleSubmitApproval = async () => {
    // Validate document upload
    if (!validateFile(documentFile)) {
      return;
    }

    setSubmitting(true);
    setApproving(true);
    setUploadProgress(10); // Start progress indicator

    try {
      let endpoint = "";

      // If the user is an admin, they can approve at any stage
      if (isAdmin && kycStatus) {
        const stage = kycStatus.currentApprovalStage;
        if (stage === "lmro") {
          endpoint = `/kyc/jobs/${job._id}/lmro-approve`;
        } else if (stage === "dlmro") {
          endpoint = `/kyc/jobs/${job._id}/dlmro-approve`;
        } else if (stage === "ceo") {
          endpoint = `/kyc/jobs/${job._id}/ceo-approve`;
        }
      } else if (kycStatus) {
        // Normal user flow
        const stage = kycStatus.currentApprovalStage;
        if (stage === "lmro" && isLMRO) {
          endpoint = `/kyc/jobs/${job._id}/lmro-approve`;
        } else if (stage === "dlmro" && isDLMRO) {
          endpoint = `/kyc/jobs/${job._id}/dlmro-approve`;
        } else if (stage === "ceo" && isCEO) {
          endpoint = `/kyc/jobs/${job._id}/ceo-approve`;
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
            Math.round((progressEvent.loaded * 70) / progressEvent.total) + 30; // Start from 30% (after form prep)
          setUploadProgress(percentCompleted > 100 ? 100 : percentCompleted);
        },
      });

      setUploadProgress(100); // Complete progress

      // Refresh the job status
      await fetchKycStatus();
      if (refreshJobData) {
        refreshJobData();
      }

      // Close modal and reset form
      setApprovalModalOpen(false);
      resetForm();

      // Show success message
      showNotification({
        type: "success",
        message: "Approval submitted successfully with document!",
      });
    } catch (err) {
      console.error("Failed to submit approval:", err);
      showNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to submit approval",
      });
      setUploadProgress(0); // Reset progress on error
    } finally {
      setSubmitting(false);
      setApproving(false);
    }
  };

  // Handle rejection submission
  const handleSubmitRejection = async () => {
    if (!rejectionReason) return;

    setSubmitting(true);
    setRejecting(true);

    try {
      await axiosInstance.put(`/kyc/jobs/${job._id}/reject`, {
        rejectionReason,
      });

      // Refresh the job status
      await fetchKycStatus();
      if (refreshJobData) {
        refreshJobData();
      }

      // Close modal and reset form
      setRejectionModalOpen(false);
      setRejectionReason("");

      // Show success message
      showNotification({
        type: "success",
        message: "Job rejected successfully!",
      });
    } catch (err) {
      console.error("Failed to reject job:", err);
      showNotification({
        type: "error",
        message: err.response?.data?.message || "Failed to reject job",
      });
    } finally {
      setSubmitting(false);
      setRejecting(false);
    }
  };

  // Render document link for approvals
  const renderDocumentLink = () => {
    // If no KYC approval exists, return null
    if (!kycStatus) return null;

    // Determine which document to show based on approval stage
    let document = null;
    let stageLabel = "";

    // For completed KYC, show CEO document
    if (kycStatus.status === "completed" && kycStatus.ceoApproval?.document) {
      document = kycStatus.ceoApproval.document;
      stageLabel = "Final Approved";
    }
    // For CEO stage, show DLMRO document
    else if (
      kycStatus.currentApprovalStage === "ceo" &&
      kycStatus.dlmroApproval?.document
    ) {
      document = kycStatus.dlmroApproval.document;
      stageLabel = "DLMRO";
    }
    // For DLMRO stage, show LMRO document
    else if (
      kycStatus.currentApprovalStage === "dlmro" &&
      kycStatus.lmroApproval?.document
    ) {
      document = kycStatus.lmroApproval.document;
      stageLabel = "LMRO";
    }
    // For LMRO stage, also show LMRO document if available
    else if (
      kycStatus.currentApprovalStage === "lmro" &&
      kycStatus.lmroApproval?.document
    ) {
      document = kycStatus.lmroApproval.document;
      stageLabel = "LMRO";
    }

    // If no document is available, return null
    if (!document || !document.fileUrl) return null;

    return (
      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:from-green-100 hover:to-emerald-100 transition-colors border border-green-100 shadow-sm hover:shadow-md"
      >
        <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-green-500 transition-colors">
          <DocumentTextIcon className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
        </div>
        <div>
          <span className="text-sm font-medium text-gray-800 group-hover:text-green-900 transition-colors">
            {stageLabel} Document
          </span>
          <p className="text-xs text-gray-500">
            {document.fileName || "View document"}
          </p>
        </div>
      </a>
    );
  };

  // Get KYC status display info
  const getKYCStatusInfo = () => {
    // If no KYC approval but job is OM completed, show as ready for KYC
    if (!kycStatus && job.status === "om_completed") {
      return {
        label: "Ready for KYC",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        bgColor: "bg-blue-500",
        textColor: "text-blue-900",
        icon: <ArrowPathIcon className="h-5 w-5 text-blue-500" />,
        description: "This job is ready for KYC initialization.",
      };
    }

    // If no KYC approval but already in KYC status, it's pending LMRO review
    if (!kycStatus && job.status === "kyc_pending") {
      return {
        label: "LMRO Review Pending",
        color: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        bgColor: "bg-yellow-500",
        textColor: "text-yellow-900",
        icon: <UserGroupIcon className="h-5 w-5 text-yellow-500" />,
        description: "Awaiting LMRO review.",
      };
    }

    if (!kycStatus) {
      return {
        label: "KYC Status Unknown",
        color: "bg-gray-50 text-gray-700 ring-gray-600/20",
        bgColor: "bg-gray-500",
        textColor: "text-gray-900",
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />,
        description: "Current KYC status could not be determined.",
      };
    }

    const stage = kycStatus.currentApprovalStage;

    if (kycStatus.status === "rejected") {
      return {
        label: "KYC Rejected",
        color: "bg-red-50 text-red-700 ring-red-600/20",
        bgColor: "bg-red-500",
        textColor: "text-red-900",
        icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
        description: `KYC was rejected: ${
          kycStatus.rejectionReason || "No reason provided"
        }`,
      };
    } else if (kycStatus.status === "completed") {
      return {
        label: "KYC Completed",
        color: "bg-green-50 text-green-700 ring-green-600/20",
        bgColor: "bg-green-500",
        textColor: "text-green-900",
        icon: <CheckIcon className="h-5 w-5 text-green-500" />,
        description: "KYC process has been completed successfully.",
      };
    } else if (stage === "lmro") {
      return {
        label: "LMRO Review",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        bgColor: "bg-blue-500",
        textColor: "text-blue-900",
        icon: <UserGroupIcon className="h-5 w-5 text-blue-500" />,
        description: "Waiting for LMRO approval.",
      };
    } else if (stage === "dlmro") {
      return {
        label: "DLMRO Review",
        color: "bg-purple-50 text-purple-700 ring-purple-600/20",
        bgColor: "bg-purple-500",
        textColor: "text-purple-900",
        icon: (
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
        ),
        description: "LMRO has approved. Waiting for DLMRO approval.",
      };
    } else if (stage === "ceo") {
      return {
        label: "CEO Review",
        color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        bgColor: "bg-indigo-500",
        textColor: "text-indigo-900",
        icon: <LockClosedIcon className="h-5 w-5 text-indigo-500" />,
        description: "DLMRO has approved. Waiting for CEO final approval.",
      };
    }

    return {
      label: "Processing",
      color: "bg-gray-50 text-gray-700 ring-gray-600/20",
      bgColor: "bg-gray-500",
      textColor: "text-gray-900",
      icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
      description: "KYC is being processed.",
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Handle history button click
  const handleViewHistory = () => {
    fetchKycHistory();
    setHistoryModalOpen(true);
  };

  // Loading state
  if (personDetailsLoading) {
    return (
      <div className="py-10 text-center bg-white rounded-xl shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading KYC details...</p>
      </div>
    );
  }

  const statusInfo = getKYCStatusInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* KYC Header with Gradient */}
      <div
        className={`bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-white rounded-xl p-2.5 mr-4 shadow-md">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">KYC Verification</h3>
              <p className="text-sm text-green-100 mt-0.5">
                Know Your Customer Documentation
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleViewHistory}
              className="px-3 py-1.5 text-sm text-white bg-green-600/30 hover:bg-green-500/50 rounded-lg flex items-center shadow-sm hover:shadow-md transition-all duration-200"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              View History
            </button>
            <div
              className={`${statusInfo.color} px-4 py-2 rounded-full shadow-sm flex items-center space-x-2`}
            >
              {statusInfo.icon}
              <span className="font-medium">{statusInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* KYC Status Card */}
        <div
          className={`${statusInfo.color} rounded-xl p-5 border border-green-100/40 shadow-sm hover:shadow-md transition-all duration-300 mb-6`}
        >
          <h4 className="text-sm font-semibold text-green-900 mb-4 pb-2 border-b border-green-100 flex items-center">
            <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-600" />
            KYC Status Information
          </h4>

          <div className="flex items-center p-4 bg-white rounded-lg shadow-sm">
            <div
              className={`flex h-10 w-10 rounded-full ${statusInfo.color} items-center justify-center mr-4`}
            >
              {statusInfo.icon}
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-900">
                Current Status
              </h5>
              <p className={`text-sm ${statusInfo.textColor} font-medium`}>
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* KYC Management Actions - Only visible to authorized users */}
          {hasKYCRole && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-2 text-indigo-600" />
                KYC Management Actions
              </h5>
              <div className="flex flex-wrap gap-2">
                {canInitializeKYC() && (
                  <button
                    onClick={handleInitializeKYC}
                    disabled={initializing}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {initializing ? (
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
                        Initialize KYC
                      </>
                    )}
                  </button>
                )}

                {canApprove() && (
                  <>
                    <button
                      onClick={() => setApprovalModalOpen(true)}
                      disabled={approving}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1.5" />
                      Upload & Approve
                    </button>
                    <button
                      onClick={() => setRejectionModalOpen(true)}
                      disabled={rejecting}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1.5" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* KYC Progress Bar */}
        {kycStatus && (
          <div className="mb-6 bg-white p-4 rounded-xl shadow-sm">
            <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-indigo-600" />
              KYC Approval Progress
            </h4>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>LMRO</span>
              <span>DLMRO</span>
              <span>CEO</span>
            </div>
            <div className="flex items-center gap-1">
              {/* LMRO */}
              <div
                className={`h-2.5 flex-1 rounded-l-full ${
                  kycStatus.lmroApproval && kycStatus.lmroApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>

              {/* DLMRO */}
              <div
                className={`h-2.5 flex-1 ${
                  kycStatus.dlmroApproval && kycStatus.dlmroApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>

              {/* CEO */}
              <div
                className={`h-2.5 flex-1 rounded-r-full ${
                  kycStatus.ceoApproval && kycStatus.ceoApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>
            </div>

            {/* Approval dates */}
            <div className="grid grid-cols-3 mt-2 text-xs text-gray-600">
              <div>
                {kycStatus.lmroApproval?.approvedAt ? (
                  <span>
                    {new Date(
                      kycStatus.lmroApproval.approvedAt
                    ).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Pending</span>
                )}
              </div>
              <div className="text-center">
                {kycStatus.dlmroApproval?.approvedAt ? (
                  <span>
                    {new Date(
                      kycStatus.dlmroApproval.approvedAt
                    ).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Pending</span>
                )}
              </div>
              <div className="text-right">
                {kycStatus.ceoApproval?.approvedAt ? (
                  <span>
                    {new Date(
                      kycStatus.ceoApproval.approvedAt
                    ).toLocaleDateString()}
                  </span>
                ) : (
                  <span>Pending</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KYC Documents Section */}
        <div className="mt-4">
          <h4 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
            KYC Documents
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderDocumentLink()}

            {/* Add additional documents from kycDetails if available */}
            {kycDetails &&
              kycDetails.documents &&
              kycDetails.documents.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors border border-blue-100 shadow-sm hover:shadow-md"
                >
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-blue-500 transition-colors">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800 group-hover:text-blue-900 transition-colors">
                      {doc.name || `KYC Document ${idx + 1}`}
                    </span>
                    <p className="text-xs text-gray-500">
                      {doc.uploadDate
                        ? new Date(doc.uploadDate).toLocaleDateString()
                        : "View document"}
                    </p>
                  </div>
                </a>
              ))}

            {/* Show empty state if no documents */}
            {(!kycStatus || !renderDocumentLink()) &&
              (!kycDetails ||
                !kycDetails.documents ||
                kycDetails.documents.length === 0) && (
                <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No KYC documents have been uploaded yet.
                  </p>
                  {canApprove() && (
                    <button
                      onClick={() => setApprovalModalOpen(true)}
                      className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1.5" />
                      Upload KYC Document
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        {/* Rejection Reason (if rejected) */}
        {kycStatus && kycStatus.status === "rejected" && (
          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <h4 className="text-base font-medium text-red-800 mb-2 flex items-center">
              <XMarkIcon className="h-5 w-5 mr-2" />
              Rejection Information
            </h4>
            <p className="text-sm text-red-700">
              {kycStatus.rejectionReason || "No rejection reason provided"}
            </p>
            <p className="text-xs text-red-600 mt-2">
              Rejected on:{" "}
              {kycStatus.rejectedAt
                ? new Date(kycStatus.rejectedAt).toLocaleString()
                : "Unknown date"}
            </p>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-100 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h5 className="text-sm font-medium text-blue-800">
                About KYC Verification
              </h5>
              <p className="mt-1 text-sm text-blue-700">
                KYC (Know Your Customer) verification is a mandatory process to
                verify the identity of clients and assess potential risks of
                illegal intentions for business relationships. The process
                involves approvals from LMRO, DLMRO, and finally CEO.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
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
                {getCurrentStageName()} Approval
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
                        className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
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
                <p className="mt-2 text-sm text-indigo-600 font-medium">
                  Document submission is mandatory for approval
                </p>
              </div>

              {/* Upload Progress Bar */}
              {uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                          Uploading...
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-indigo-600">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                      <div
                        style={{ width: `${uploadProgress}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-300"
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                Reject KYC
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

      {/* KYC History Modal */}
      <AnimatePresence>
        {historyModalOpen && (
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
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  KYC Approval History
                </h3>
                <button
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {historyLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-500">
                    Loading KYC history...
                  </p>
                </div>
              ) : jobHistory.length === 0 ? (
                <div className="py-8 text-center">
                  <InformationCircleIcon className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="mt-4 text-sm text-gray-500">
                    No KYC history records found
                  </p>
                </div>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {jobHistory.map((event, eventIdx) => (
                      <li key={eventIdx}>
                        <div className="relative pb-8">
                          {eventIdx !== jobHistory.length - 1 ? (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span
                                className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  event.action === "approved"
                                    ? "bg-green-100 text-green-600"
                                    : event.action === "rejected"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {event.action === "approved" ? (
                                  <CheckIcon className="h-5 w-5" />
                                ) : event.action === "rejected" ? (
                                  <XMarkIcon className="h-5 w-5" />
                                ) : (
                                  <ArrowPathIcon className="h-5 w-5" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-900">
                                  {event.action === "approved" ? (
                                    <>
                                      <span className="font-medium">
                                        {event.stage.toUpperCase()}
                                      </span>{" "}
                                      approved by {event.user?.name || "Admin"}
                                    </>
                                  ) : event.action === "rejected" ? (
                                    <>
                                      Rejected by {event.user?.name || "Admin"}
                                    </>
                                  ) : (
                                    <>KYC Process initiated</>
                                  )}
                                </p>
                                {event.notes && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    Note: {event.notes}
                                  </p>
                                )}
                                {event.reason && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    Reason: {event.reason}
                                  </p>
                                )}
                                {event.document?.fileUrl && (
                                  <a
                                    href={event.document.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                  >
                                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                                    View document
                                  </a>
                                )}
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(event.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => setHistoryModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IntegratedKYCManagement;
