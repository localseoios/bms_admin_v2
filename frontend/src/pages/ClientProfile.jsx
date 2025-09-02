import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import axiosInstance from "../utils/axios";
import {
  UserCircleIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  DocumentIcon,
  IdentificationIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilSquareIcon,
  DocumentDuplicateIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  // New icons for KYC Management
  ArrowPathIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  XMarkIcon,
  CheckIcon,
  ShieldExclamationIcon,
  ArrowDownTrayIcon,
  // BRA Management icon
  ClipboardIcon,
  DocumentArrowDownIcon,
  FolderOpenIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import MonthlyPaymentForm from "./MonthlyPaymentForm/MonthlyPaymentForm";
import EnhancedMonthlyPaymentHistory from "./MonthlyPaymentForm/EnhancedMonthlyPaymentHistory";
import AccountManagementSection from "./AccountManagement/AccountManagementSection";
import { toast } from "react-toastify";

function ClientProfile() {
  const { gmail } = useParams();
  const navigate = useNavigate();

  // Client and jobs data
  const [client, setClient] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedService, setExpandedService] = useState(null);
  const [jobTimelines, setJobTimelines] = useState({});
  const [loadingTimelines, setLoadingTimelines] = useState({});
  const [showTimelines, setShowTimelines] = useState({}); // State to control timeline visibility for each job

  // Person details states
  const [activePersonTab, setActivePersonTab] = useState("company");
  const [personDetailsLoading, setPersonDetailsLoading] = useState({});
  const [directorDetails, setDirectorDetails] = useState({});
  const [shareholderDetails, setShareholderDetails] = useState({});
  const [secretaryDetails, setSecretaryDetails] = useState({});
  const [sefDetails, setSefDetails] = useState({});
  const [companyDetails, setCompanyDetails] = useState({});
  const [kycDetails, setKycDetails] = useState({});

  // New states for KYC Management section
  const [kycStatuses, setKycStatuses] = useState({});
  const [loadingKycStatuses, setLoadingKycStatuses] = useState({});

  // Inside the ClientProfile function, add these new state variables:
  const [braStatuses, setBraStatuses] = useState({});
  const [loadingBraStatuses, setLoadingBraStatuses] = useState({});

  const [isAddNewMonthOpen, setIsAddNewMonthOpen] = useState({});
  const [activePaymentTabs, setActivePaymentTabs] = useState({});

  // Add these new state variables at the top of ClientProfile component
  const [kycDocumentModals, setKycDocumentModals] = useState({});
  const [kycDocumentUploading, setKycDocumentUploading] = useState({});
  const [deleteConfirmModals, setDeleteConfirmModals] = useState({});

  const [braDocumentModals, setBraDocumentModals] = useState({});
  const [braDocumentUploading, setBraDocumentUploading] = useState({});
  const [braDeleteConfirmModals, setBraDeleteConfirmModals] = useState({});

  // ADD THESE STATE VARIABLES (after existing state declarations)
  const [engagementLetters, setEngagementLetters] = useState([]);
  const [loadingEngagementLetters, setLoadingEngagementLetters] =
    useState(false);

  // Add this function to your ClientProfile component
  const setActivePaymentTab = (jobId, tabName) => {
    setActivePaymentTabs((prev) => ({
      ...prev,
      [jobId]: tabName,
    }));
  };

  // Fetch client and job data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await axiosInstance.get(`/clients/${gmail}`);
        setClient(response.data.client);
        setJobs(response.data.jobs);
        setExpandedService(response.data.jobs[0]?._id || null);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching client data:", err);
        setError("Failed to load client data. Please try again later.");
        setIsLoading(false);
      }
    };
    fetchClientData();
  }, [gmail]);

  // ADD THIS useEffect HOOK (after existing useEffect hooks)
  useEffect(() => {
    const fetchEngagementLetters = async () => {
      if (!client?.gmail) return;

      try {
        setLoadingEngagementLetters(true);
        const response = await axiosInstance.get(
          `/operations/clients/${client.gmail}/engagement-letters`
        );
        setEngagementLetters(response.data);
      } catch (error) {
        console.error("Error fetching engagement letters:", error);
        setEngagementLetters([]);
      } finally {
        setLoadingEngagementLetters(false);
      }
    };

    if (client?.gmail) {
      fetchEngagementLetters();
    }
  }, [client?.gmail]);

  // Fetch timeline data when a service is expanded
  useEffect(() => {
    if (expandedService) {
      fetchJobTimeline(expandedService);
      // Also fetch the KYC status when a job is expanded
      fetchKycStatus(expandedService);
      fetchBraStatus(expandedService);
    }
  }, [expandedService]);

  // Toggle timeline visibility for a specific job
  const toggleTimelineVisibility = (jobId) => {
    setShowTimelines((prev) => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const fetchJobTimeline = async (jobId) => {
    if (jobTimelines[jobId]) return;
    setLoadingTimelines((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axiosInstance.get(`/jobs/${jobId}/timeline`);
      setJobTimelines((prev) => ({
        ...prev,
        [jobId]: response.data,
      }));
      setLoadingTimelines((prev) => ({ ...prev, [jobId]: false }));
    } catch (err) {
      console.error(`Error fetching timeline for job ${jobId}:`, err);
      setLoadingTimelines((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Add this component for rendering the engagement letters section
  const renderEngagementLettersSection = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500"
    >
      <div className="px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-4 ring-emerald-100 shadow-lg mr-4"
            >
              <FolderOpenIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Engagement Letters
              </h2>
              <p className="text-sm text-gray-500">
                All engagement letters for this client
              </p>
            </div>
          </div>
          {engagementLetters.length > 0 && (
            <div className="bg-emerald-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-emerald-700">
                {engagementLetters.length}{" "}
                {engagementLetters.length === 1 ? "letter" : "letters"}
              </span>
            </div>
          )}
        </div>

        {loadingEngagementLetters ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-500">
              Loading engagement letters...
            </p>
          </div>
        ) : engagementLetters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engagementLetters.map((letter, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="bg-emerald-100 rounded-lg p-2 mr-3 group-hover:bg-emerald-200 transition-colors">
                        <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                          {letter.fileName || "Engagement Letter"}
                        </h3>
                        {letter.jobNumber && (
                          <p className="text-xs text-gray-500">
                            Job: {letter.jobNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {letter.serviceType && (
                      <div className="flex items-center text-xs text-gray-600">
                        <BriefcaseIcon className="h-3 w-3 mr-1" />
                        <span>{letter.serviceType}</span>
                      </div>
                    )}

                    {letter.uploadedAt && (
                      <div className="flex items-center text-xs text-gray-600">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        <span>
                          {new Date(letter.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )}

                    {letter.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {letter.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <a
                      href={letter.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 rounded-lg shadow-sm border border-emerald-200 hover:shadow-md transition-all duration-200 group-hover:scale-105"
                    >
                      <DocumentArrowDownIcon className="h-3 w-3 mr-1" />
                      View Letter
                    </a>

                    {letter.jobId && (
                      <button
                        onClick={() => navigate(`/job/${letter.jobId}`)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        View Job
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50/50 rounded-xl border border-gray-200">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FolderOpenIcon className="h-7 w-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No Engagement Letters Found
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              No engagement letters have been uploaded for this client yet.
              Engagement letters will appear here once they are uploaded through
              job management.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  // KYC status fetch function
  const fetchKycStatus = async (jobId) => {
    if (kycStatuses[jobId]) return;
    setLoadingKycStatuses((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axiosInstance.get(`/kyc/jobs/${jobId}/status`);
      console.log("KYC Status Response:", response.data);
      setKycStatuses((prev) => ({ ...prev, [jobId]: response.data }));
    } catch (err) {
      console.error(`Error fetching KYC status for job ${jobId}:`, err);
    } finally {
      setLoadingKycStatuses((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const getStageDisplayName = (stage) => {
    const stageNames = {
      lmro: "LMRO",
      dlmro: "DLMRO",
      ceo: "CEO",
    };
    return stageNames[stage] || stage.toUpperCase();
  };

  // Helper function to handle KYC document update
  const handleUpdateKycDocument = async (jobId, stage, file, notes = "") => {
    try {
      setKycDocumentUploading((prev) => ({
        ...prev,
        [`${jobId}-${stage}`]: true,
      }));

      const formData = new FormData();
      formData.append("document", file);
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await axiosInstance.put(
        `/kyc/jobs/${jobId}/documents/${stage}/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast.success(
          `${getStageDisplayName(stage)} document updated successfully!`
        );

        // Refresh KYC status
        await fetchKycStatus(jobId);

        // Close modal
        setKycDocumentModals((prev) => ({
          ...prev,
          [`${jobId}-${stage}`]: false,
        }));
      }
    } catch (error) {
      console.error(`Error updating ${stage} document:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to update ${getStageDisplayName(stage)} document`
      );
    } finally {
      setKycDocumentUploading((prev) => ({
        ...prev,
        [`${jobId}-${stage}`]: false,
      }));
    }
  };

  // Helper function to handle KYC document deletion
  const handleDeleteKycDocument = async (jobId, stage) => {
    try {
      const response = await axiosInstance.delete(
        `/kyc/jobs/${jobId}/documents/${stage}/delete`
      );

      if (response.status === 200) {
        toast.success(
          `${getStageDisplayName(stage)} document deleted successfully!`
        );

        // Refresh KYC status
        await fetchKycStatus(jobId);

        // Close confirmation modal
        setDeleteConfirmModals((prev) => ({
          ...prev,
          [`${jobId}-${stage}`]: false,
        }));
      }
    } catch (error) {
      console.error(`Error deleting ${stage} document:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to delete ${getStageDisplayName(stage)} document`
      );
    }
  };

  // Enhanced KYC document rendering with edit/delete functionality
  const renderEnhancedKycDocumentSection = (kycData, jobId) => {
    const documents = [];

    // Helper to create document object
    const createDocumentInfo = (stage, approval) => {
      if (!approval?.document?.fileUrl) return null;

      return {
        stage,
        stageLabel: getStageDisplayName(stage),
        document: approval.document,
        approval: approval,
        canEdit: true, // You can add role-based permissions here
        canDelete: true, // You can add role-based permissions here
      };
    };

    // Collect all available documents
    if (kycData.lmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("lmro", kycData.lmroApproval));
    }

    if (kycData.dlmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("dlmro", kycData.dlmroApproval));
    }

    if (kycData.ceoApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("ceo", kycData.ceoApproval));
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-4">
            No KYC documents have been uploaded yet.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() =>
                setKycDocumentModals((prev) => ({
                  ...prev,
                  [`${jobId}-ceo`]: true,
                }))
              }
              className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Upload CEO Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => {
          const stageColors = {
            lmro: {
              bg: "bg-blue-50",
              border: "border-blue-200",
              text: "text-blue-800",
              icon: "text-blue-600",
            },
            dlmro: {
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-800",
              icon: "text-purple-600",
            },
            ceo: {
              bg: "bg-indigo-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
              icon: "text-indigo-600",
            },
          };
          const colors = stageColors[doc.stage];

          return (
            <div
              key={doc.stage}
              className={`group relative ${colors.bg} rounded-lg p-4 transition-all duration-200 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-md bg-white ${colors.icon} shadow-sm`}
                    >
                      {doc.stage === "lmro" && (
                        <UserGroupIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "dlmro" && (
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "ceo" && (
                        <LockClosedIcon className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className={`text-sm font-medium ${colors.text}`}>
                      {doc.stageLabel} Document
                    </h6>
                    <p
                      className={`mt-1 text-xs flex items-center flex-wrap gap-2`}
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {doc.document.fileName || "Document"}
                      </span>
                      <span className="mx-1">•</span>
                      {doc.approval.approved ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckIcon className="h-3 w-3 mr-0.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-700">
                          <ClockIcon className="h-3 w-3 mr-0.5" /> Pending
                        </span>
                      )}
                    </p>

                    {/* Document Details */}
                    <div className="mt-2 space-y-1">
                      {doc.document.uploadedBy && (
                        <p className="text-xs text-gray-600">
                          <UserIcon className="h-3 w-3 inline mr-1" />
                          Uploaded by:{" "}
                          <span className="font-medium">
                            {doc.document.uploadedBy.name || "Unknown User"}
                          </span>
                        </p>
                      )}
                      {doc.document.uploadedAt && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          Uploaded:{" "}
                          {new Date(doc.document.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                      {doc.approval.modifiedAt && doc.approval.modifiedBy && (
                        <p className="text-xs text-amber-600">
                          <PencilIcon className="h-3 w-3 inline mr-1" />
                          Modified by:{" "}
                          <span className="font-medium">
                            {/* DEBUG: Check what data is available */}
                            {console.log(
                              "Modified by data:",
                              doc.approval.modifiedBy
                            )}
                            {doc.approval.modifiedBy?.name ||
                              doc.approval.modifiedBy ||
                              "Unknown User"}
                          </span>{" "}
                          on{" "}
                          {new Date(doc.approval.modifiedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={doc.document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-xs ${colors.icon} hover:opacity-80 bg-white rounded-md px-2 py-1 ${colors.border} hover:shadow-sm transition-all`}
                      >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                        Download
                      </a>

                      {doc.canEdit && (
                        <button
                          onClick={() =>
                            setKycDocumentModals((prev) => ({
                              ...prev,
                              [`${jobId}-${doc.stage}`]: true,
                            }))
                          }
                          className="inline-flex items-center text-xs text-amber-600 hover:text-amber-800 bg-white rounded-md px-2 py-1 border border-amber-200 hover:bg-amber-50 transition-colors"
                        >
                          <PencilIcon className="h-3.5 w-3.5 mr-1" />
                          Replace
                        </button>
                      )}

                      {doc.canDelete && (
                        <button
                          onClick={() =>
                            setDeleteConfirmModals((prev) => ({
                              ...prev,
                              [`${jobId}-${doc.stage}`]: true,
                            }))
                          }
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-white rounded-md px-2 py-1 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      )}

                      {/* Add More Documents Button */}
                      {/* <button
                        onClick={() =>
                          setKycDocumentModals((prev) => ({
                            ...prev,
                            [`${jobId}-${doc.stage}-additional`]: true,
                          }))
                        }
                        className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                        title={`Upload additional ${doc.stageLabel} documents`}
                      >
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        + More
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload buttons for missing CEO stage only */}
        {(() => {
          const existingStages = documents.map(doc => doc.stage);
          const isCeoMissing = !existingStages.includes('ceo');

          if (!isCeoMissing) return null;

          return (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Upload CEO documents:</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setKycDocumentModals((prev) => ({
                      ...prev,
                      [`${jobId}-ceo`]: true,
                    }))
                  }
                  className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Upload CEO Document
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // Document Update Modal Component
  const KycDocumentUpdateModal = ({
    isOpen,
    onClose,
    jobId,
    stage,
    onUpdate,
  }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [notes, setNotes] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (file) => {
      setSelectedFile(file);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleSubmit = () => {
      if (selectedFile) {
        onUpdate(jobId, stage, selectedFile, notes);
      }
    };

    const resetForm = () => {
      setSelectedFile(null);
      setNotes("");
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Replace {getStageDisplayName(stage)} Document
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="text-sm">
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop a file here, or click to select
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id={`file-input-${stage}`}
                  />
                  <label
                    htmlFor={`file-input-${stage}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Add any notes about this document update..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFile || kycDocumentUploading[`${jobId}-${stage}`]
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {kycDocumentUploading[`${jobId}-${stage}`] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Replace Document"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal Component
  const KycDocumentDeleteModal = ({
    isOpen,
    onClose,
    jobId,
    stage,
    onDelete,
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete {getStageDisplayName(stage)} Document
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this document? This action
                  cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(jobId, stage)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Delete Document
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleUpdateBraDocument = async (jobId, stage, file, notes = "") => {
    try {
      setBraDocumentUploading((prev) => ({
        ...prev,
        [`${jobId}-${stage}`]: true,
      }));

      const formData = new FormData();
      formData.append("document", file);
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await axiosInstance.put(
        `/bra/jobs/${jobId}/documents/${stage}/update`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast.success(
          `${getStageDisplayName(stage)} document updated successfully!`
        );
        await fetchBraStatus(jobId);
        setBraDocumentModals((prev) => ({
          ...prev,
          [`${jobId}-${stage}`]: false,
        }));
      }
    } catch (error) {
      console.error(`Error updating ${stage} document:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to update ${getStageDisplayName(stage)} document`
      );
    } finally {
      setBraDocumentUploading((prev) => ({
        ...prev,
        [`${jobId}-${stage}`]: false,
      }));
    }
  };

  const handleDeleteBraDocument = async (jobId, stage) => {
    try {
      const response = await axiosInstance.delete(
        `/bra/jobs/${jobId}/documents/${stage}/delete`
      );

      if (response.status === 200) {
        toast.success(
          `${getStageDisplayName(stage)} document deleted successfully!`
        );
        await fetchBraStatus(jobId);
        setBraDeleteConfirmModals((prev) => ({
          ...prev,
          [`${jobId}-${stage}`]: false,
        }));
      }
    } catch (error) {
      console.error(`Error deleting ${stage} document:`, error);
      toast.error(
        error.response?.data?.message ||
          `Failed to delete ${getStageDisplayName(stage)} document`
      );
    }
  };

  const renderEnhancedBraDocumentSection = (braData, jobId) => {
    const documents = [];

    const createDocumentInfo = (stage, approval) => {
      if (!approval?.document?.fileUrl) return null;

      return {
        stage,
        stageLabel: getStageDisplayName(stage),
        document: approval.document,
        approval: approval,
        canEdit: true,
        canDelete: true,
      };
    };

    if (braData.lmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("lmro", braData.lmroApproval));
    }

    if (braData.dlmroApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("dlmro", braData.dlmroApproval));
    }

    if (braData.ceoApproval?.document?.fileUrl) {
      documents.push(createDocumentInfo("ceo", braData.ceoApproval));
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 mb-4">
            No BRA documents have been uploaded yet.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() =>
                setBraDocumentModals((prev) => ({
                  ...prev,
                  [`${jobId}-ceo`]: true,
                }))
              }
              className="inline-flex items-center px-3 py-2 border border-emerald-300 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Upload CEO Document
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => {
          const stageColors = {
            lmro: {
              bg: "bg-teal-50",
              border: "border-teal-200",
              text: "text-teal-800",
              icon: "text-teal-600",
            },
            dlmro: {
              bg: "bg-purple-50",
              border: "border-purple-200",
              text: "text-purple-800",
              icon: "text-purple-600",
            },
            ceo: {
              bg: "bg-indigo-50",
              border: "border-indigo-200",
              text: "text-indigo-800",
              icon: "text-indigo-600",
            },
          };
          const colors = stageColors[doc.stage];

          return (
            <div
              key={doc.stage}
              className={`group relative ${colors.bg} rounded-lg p-4 transition-all duration-200 hover:shadow-md ${colors.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="flex-shrink-0">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-md bg-white ${colors.icon} shadow-sm`}
                    >
                      {doc.stage === "lmro" && (
                        <UserGroupIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "dlmro" && (
                        <ClipboardDocumentCheckIcon className="h-5 w-5" />
                      )}
                      {doc.stage === "ceo" && (
                        <LockClosedIcon className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <h6 className={`text-sm font-medium ${colors.text}`}>
                      {doc.stageLabel} Document
                    </h6>
                    <p
                      className={`mt-1 text-xs flex items-center flex-wrap gap-2`}
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        {doc.document.fileName || "Document"}
                      </span>
                      <span className="mx-1">•</span>
                      {doc.approval.approved ? (
                        <span className="inline-flex items-center text-green-700">
                          <CheckIcon className="h-3 w-3 mr-0.5" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-700">
                          <ClockIcon className="h-3 w-3 mr-0.5" /> Pending
                        </span>
                      )}
                    </p>

                    <div className="mt-2 space-y-1">
                      {doc.document.uploadedBy && (
                        <p className="text-xs text-gray-600">
                          <UserIcon className="h-3 w-3 inline mr-1" />
                          Uploaded by:{" "}
                          <span className="font-medium">
                            {doc.document.uploadedBy.name || "Unknown User"}
                          </span>
                        </p>
                      )}
                      {doc.document.uploadedAt && (
                        <p className="text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 inline mr-1" />
                          Uploaded:{" "}
                          {new Date(doc.document.uploadedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                      {doc.approval.modifiedAt && doc.approval.modifiedBy && (
                        <p className="text-xs text-amber-600">
                          <PencilIcon className="h-3 w-3 inline mr-1" />
                          Modified by:{" "}
                          <span className="font-medium">
                            {doc.approval.modifiedBy?.name || "Unknown User"}
                          </span>{" "}
                          on{" "}
                          {new Date(doc.approval.modifiedAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={doc.document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center text-xs ${colors.icon} hover:opacity-80 bg-white rounded-md px-2 py-1 ${colors.border} hover:shadow-sm transition-all`}
                      >
                        <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                        Download
                      </a>

                      {doc.canEdit && (
                        <button
                          onClick={() =>
                            setBraDocumentModals((prev) => ({
                              ...prev,
                              [`${jobId}-${doc.stage}`]: true,
                            }))
                          }
                          className="inline-flex items-center text-xs text-amber-600 hover:text-amber-800 bg-white rounded-md px-2 py-1 border border-amber-200 hover:bg-amber-50 transition-colors"
                        >
                          <PencilIcon className="h-3.5 w-3.5 mr-1" />
                          Replace
                        </button>
                      )}

                      {doc.canDelete && (
                        <button
                          onClick={() =>
                            setBraDeleteConfirmModals((prev) => ({
                              ...prev,
                              [`${jobId}-${doc.stage}`]: true,
                            }))
                          }
                          className="inline-flex items-center text-xs text-red-600 hover:text-red-800 bg-white rounded-md px-2 py-1 border border-red-200 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </button>
                      )}

                      {/* Add More Documents Button */}
                      {/* <button
                        onClick={() =>
                          setBraDocumentModals((prev) => ({
                            ...prev,
                            [`${jobId}-${doc.stage}-additional`]: true,
                          }))
                        }
                        className="inline-flex items-center text-xs text-green-600 hover:text-green-800 bg-white rounded-md px-2 py-1 border border-green-200 hover:bg-green-50 transition-colors"
                        title={`Upload additional ${doc.stageLabel} documents`}
                      >
                        <PlusIcon className="h-3.5 w-3.5 mr-1" />
                        + More
                      </button> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload buttons for missing CEO stage only */}
        {(() => {
          const existingStages = documents.map(doc => doc.stage);
          const isCeoMissing = !existingStages.includes('ceo');

          if (!isCeoMissing) return null;

          return (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">Upload CEO documents:</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setBraDocumentModals((prev) => ({
                      ...prev,
                      [`${jobId}-ceo`]: true,
                    }))
                  }
                  className="inline-flex items-center px-3 py-2 border border-emerald-300 rounded-md text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Upload CEO Document
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  // STEP 3: ADD THESE MODAL COMPONENTS (after your existing KYC modal components)

  const BraDocumentUpdateModal = ({
    isOpen,
    onClose,
    jobId,
    stage,
    onUpdate,
  }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [notes, setNotes] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (file) => {
      setSelectedFile(file);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    };

    const handleSubmit = () => {
      if (selectedFile) {
        onUpdate(jobId, stage, selectedFile, notes);
      }
    };

    const resetForm = () => {
      setSelectedFile(null);
      setNotes("");
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Replace {getStageDisplayName(stage)} Document
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-teal-400 bg-teal-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="text-sm">
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop a file here, or click to select
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id={`bra-file-input-${stage}`}
                  />
                  <label
                    htmlFor={`bra-file-input-${stage}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Add any notes about this document update..."
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedFile || braDocumentUploading[`${jobId}-${stage}`]
              }
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {braDocumentUploading[`${jobId}-${stage}`] ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Replace Document"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BraDocumentDeleteModal = ({
    isOpen,
    onClose,
    jobId,
    stage,
    onDelete,
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="px-6 py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Delete {getStageDisplayName(stage)} Document
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this document? This action
                  cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(jobId, stage)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Delete Document
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add this updated handleUploadInvoice function to your ClientProfile.jsx
  // Replace the existing handleUploadInvoice function with this one:

  const handleUploadInvoice = async (payment, isReplacing = false) => {
    try {
      console.log("handleUploadInvoice called with:", { payment, isReplacing });

      // Validate payment object and ID
      if (!payment || (!payment._id && !payment.id)) {
        toast.error(
          "Invalid payment record. Please refresh the page and try again."
        );
        return;
      }

      // Use _id as primary, fall back to id if _id doesn't exist
      const paymentId = payment._id || payment.id;

      if (!paymentId || paymentId === "undefined") {
        toast.error(
          "Payment ID is missing. Please refresh the page and try again."
        );
        return;
      }

      console.log("Using paymentId:", paymentId);

      // Create a file input element
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png";

      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          return;
        }

        try {
          // Create FormData for upload
          const formData = new FormData();
          formData.append("paymentId", paymentId);
          formData.append("invoiceFile", file);
          formData.append("replaceExisting", isReplacing.toString());
          formData.append(
            "description",
            `Supporting Document - ${payment.monthName} ${payment.year}`
          );
          formData.append(
            "invoiceDate",
            new Date().toISOString().split("T")[0]
          );
          formData.append("paymentMethod", "Document Only"); // Use proper enum value
          formData.append("amount", "0"); // Required field for schema
          formData.append("option", "DOCUMENT_ONLY"); // Special flag

          // Debug logging
          console.log("FormData being sent:");
          for (let [key, value] of formData.entries()) {
            console.log(key, value);
          }

          // Show loading state
          const loadingToast = toast.loading(
            isReplacing ? "Replacing document..." : "Uploading document..."
          );

          // Use the account service for consistency
          const response = await accountService.uploadInvoiceDocument(formData);

          // Dismiss loading toast
          toast.dismiss(loadingToast);

          console.log("Upload response:", response);

          if (response.success) {
            toast.success(
              isReplacing
                ? "Document replaced successfully!"
                : "Document uploaded successfully!"
            );

            // Trigger a refresh in the EnhancedMonthlyPaymentHistory component
            // The component will handle its own refresh through the modal success callback
          } else {
            toast.error(response.message || "Upload failed. Please try again.");
          }
        } catch (error) {
          console.error("Error uploading document:", error);

          // Enhanced error handling
          let errorMessage = "Failed to upload document";

          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          // Show specific error messages for common issues
          if (errorMessage.includes("API route not found")) {
            errorMessage = "Server route not found. Please contact support.";
          } else if (errorMessage.includes("undefined")) {
            errorMessage =
              "Invalid payment ID. Please refresh the page and try again.";
          }

          toast.error(errorMessage);
        }
      };

      // Trigger file selection dialog
      fileInput.click();
    } catch (error) {
      console.error("Error in handleUploadInvoice:", error);
      toast.error("Failed to initiate upload");
    }
  };

  // Add this function alongside the fetchKycStatus function:
  const fetchBraStatus = async (jobId) => {
    if (braStatuses[jobId]) return;
    setLoadingBraStatuses((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axiosInstance.get(`/bra/jobs/${jobId}/status`);
      setBraStatuses((prev) => ({ ...prev, [jobId]: response.data }));
    } catch (err) {
      console.error(`Error fetching BRA status for job ${jobId}:`, err);
    } finally {
      setLoadingBraStatuses((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Fetch person details when tab and expanded service change
  useEffect(() => {
    if (expandedService && activePersonTab) {
      fetchPersonDetails(expandedService, activePersonTab);
    }
  }, [expandedService, activePersonTab]);

  const fetchPersonDetails = async (jobId, personType) => {
    if (personType === "company") {
      fetchCompanyDetails(jobId);
    } else if (personType === "kyc") {
      fetchKycDetails(jobId);
    } else {
      fetchPersonTypeDetails(jobId, personType);
    }
  };

  const fetchCompanyDetails = async (jobId) => {
    setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/company-details`
      );
      setCompanyDetails((prev) => ({
        ...prev,
        [jobId]: response.data,
      }));
    } catch (err) {
      console.error(`Error fetching company details for job ${jobId}:`, err);
    } finally {
      setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const fetchKycDetails = async (jobId) => {
    setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/kyc-documents`
      );
      setKycDetails((prev) => ({
        ...prev,
        [jobId]: response.data,
      }));
    } catch (err) {
      console.error(`Error fetching KYC details for job ${jobId}:`, err);
    } finally {
      setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Add this function alongside getKYCStatusInfo:
  const getBRAStatusInfo = (braData) => {
    if (!braData.exists && braData.jobStatus === "completed") {
      return {
        label: "Ready for BRA",
        color: "bg-teal-50 text-teal-700 ring-teal-600/20",
        icon: <ArrowPathIcon className="h-5 w-5 text-teal-500" />,
        description: "KYC completed. Ready to initialize BRA process.",
      };
    }
    if (!braData.exists && braData.jobStatus === "bra_pending") {
      return {
        label: "LMRO Review Pending",
        color: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-yellow-500" />,
        description: "BRA has been initialized. Waiting for LMRO review.",
      };
    }
    if (!braData.exists) {
      return {
        label: "BRA Status Unknown",
        color: "bg-gray-50 text-gray-700 ring-gray-600/20",
        icon: <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />,
        description: "Unable to determine current BRA status.",
      };
    }
    const stage = braData.currentApprovalStage;
    if (braData.status === "rejected") {
      return {
        label: "BRA Rejected",
        color: "bg-red-50 text-red-700 ring-red-600/20",
        icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
        description:
          "BRA request has been rejected. See rejection reason below.",
      };
    } else if (braData.status === "completed") {
      return {
        label: "BRA Completed",
        color: "bg-green-50 text-green-700 ring-green-600/20",
        icon: <CheckIcon className="h-5 w-5 text-green-500" />,
        description: "BRA process is complete. All approvals obtained.",
      };
    } else if (stage === "lmro") {
      return {
        label: "LMRO Review",
        color: "bg-teal-50 text-teal-700 ring-teal-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-teal-500" />,
        description:
          "Currently under review by Local Money Laundering Reporting Officer.",
      };
    } else if (stage === "dlmro") {
      return {
        label: "DLMRO Review",
        color: "bg-purple-50 text-purple-700 ring-purple-600/20",
        icon: (
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
        ),
        description: "LMRO approved. Currently under review by Deputy LMRO.",
      };
    } else if (stage === "ceo") {
      return {
        label: "CEO Review",
        color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        icon: <LockClosedIcon className="h-5 w-5 text-indigo-500" />,
        description: "LMRO and DLMRO approved. Awaiting final CEO approval.",
      };
    }
    return {
      label: "Processing",
      color: "bg-gray-50 text-gray-700 ring-gray-600/20",
      icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
      description: "BRA process is in progress.",
    };
  };

  // Add this function alongside getBRAStatusInfo in your ClientProfile component

  const getKYCStatusInfo = (kycData) => {
    if (!kycData.exists && kycData.jobStatus === "completed") {
      return {
        label: "Ready for KYC",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        icon: <ArrowPathIcon className="h-5 w-5 text-blue-500" />,
        description: "Job completed. Ready to initialize KYC process.",
      };
    }
    if (!kycData.exists && kycData.jobStatus === "kyc_pending") {
      return {
        label: "KYC Review Pending",
        color: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-yellow-500" />,
        description: "KYC has been initialized. Waiting for LMRO review.",
      };
    }
    if (!kycData.exists) {
      return {
        label: "KYC Status Unknown",
        color: "bg-gray-50 text-gray-700 ring-gray-600/20",
        icon: <ShieldExclamationIcon className="h-5 w-5 text-gray-500" />,
        description: "Unable to determine current KYC status.",
      };
    }

    const stage = kycData.currentApprovalStage;

    if (kycData.status === "rejected") {
      return {
        label: "KYC Rejected",
        color: "bg-red-50 text-red-700 ring-red-600/20",
        icon: <XMarkIcon className="h-5 w-5 text-red-500" />,
        description:
          "KYC request has been rejected. See rejection reason below.",
      };
    } else if (kycData.status === "completed") {
      return {
        label: "KYC Completed",
        color: "bg-green-50 text-green-700 ring-green-600/20",
        icon: <CheckIcon className="h-5 w-5 text-green-500" />,
        description: "KYC process is complete. All approvals obtained.",
      };
    } else if (stage === "lmro") {
      return {
        label: "LMRO Review",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        icon: <UserGroupIcon className="h-5 w-5 text-blue-500" />,
        description:
          "Currently under review by Local Money Laundering Reporting Officer.",
      };
    } else if (stage === "dlmro") {
      return {
        label: "DLMRO Review",
        color: "bg-purple-50 text-purple-700 ring-purple-600/20",
        icon: (
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500" />
        ),
        description: "LMRO approved. Currently under review by Deputy LMRO.",
      };
    } else if (stage === "ceo") {
      return {
        label: "CEO Review",
        color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        icon: <LockClosedIcon className="h-5 w-5 text-indigo-500" />,
        description: "LMRO and DLMRO approved. Awaiting final CEO approval.",
      };
    }

    return {
      label: "Processing",
      color: "bg-gray-50 text-gray-700 ring-gray-600/20",
      icon: <ArrowPathIcon className="h-5 w-5 text-gray-500" />,
      description: "KYC process is in progress.",
    };
  };

  // Add this function alongside renderKycDocumentLink:
  const renderBraDocumentLink = (braData) => {
    let document = null;
    let stageLabel = "";
    if (braData.status === "completed" && braData.ceoApproval?.document) {
      document = braData.ceoApproval.document;
      stageLabel = "Final Approved";
    } else if (
      braData.currentApprovalStage === "ceo" &&
      braData.dlmroApproval?.document
    ) {
      document = braData.dlmroApproval.document;
      stageLabel = "DLMRO";
    } else if (
      braData.currentApprovalStage === "dlmro" &&
      braData.lmroApproval?.document
    ) {
      document = braData.lmroApproval.document;
      stageLabel = "LMRO";
    } else if (
      braData.currentApprovalStage === "lmro" &&
      braData.lmroApproval?.document
    ) {
      document = braData.lmroApproval.document;
      stageLabel = "LMRO";
    }
    if (!document || !document.fileUrl) return null;
    return (
      <a
        href={document.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center text-xs text-teal-600 hover:text-teal-800 mt-1"
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
        {stageLabel} Document: {document.fileName}
      </a>
    );
  };

  const fetchPersonTypeDetails = async (jobId, personType) => {
    setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: true }));
    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/person-details/${personType}`
      );
      switch (personType) {
        case "director":
          setDirectorDetails((prev) => ({
            ...prev,
            [jobId]: response.data,
          }));
          break;
        case "shareholder":
          setShareholderDetails((prev) => ({
            ...prev,
            [jobId]: response.data,
          }));
          break;
        case "secretary":
          setSecretaryDetails((prev) => ({
            ...prev,
            [jobId]: response.data,
          }));
          break;
        case "sef":
          setSefDetails((prev) => ({
            ...prev,
            [jobId]: response.data,
          }));
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(
        `Error fetching ${personType} details for job ${jobId}:`,
        err
      );
    } finally {
      setPersonDetailsLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Navigation handlers
  const handleViewJobDetails = (jobId, e) => {
    e.stopPropagation();
    navigate(`/job/${jobId}`);
  };

  const handleEditPersonDetails = (jobId, e) => {
    e.stopPropagation();
    navigate(`/job/${jobId}`, { state: { activeTab: activePersonTab } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100 ring-1 ring-green-600/20";
      case "in-progress":
        return "text-blue-600 bg-blue-100 ring-1 ring-blue-600/20";
      case "pending":
        return "text-yellow-600 bg-yellow-100 ring-1 ring-yellow-600/20";
      case "rejected":
        return "text-red-600 bg-red-100 ring-1 ring-red-600/20";
      default:
        return "text-gray-600 bg-gray-100 ring-1 ring-gray-600/20";
    }
  };

  const getTimelineStatusIcon = (status) => {
    switch (status) {
      case "created":
        return DocumentTextIcon;
      case "screening_done":
        return CheckCircleIcon;
      case "rejected":
        return XCircleIcon;
      case "corrected":
        return PencilIcon;
      default:
        return ClockIcon;
    }
  };

  const getTimelineStatus = (status) => {
    switch (status) {
      case "created":
      case "screening_done":
      case "rejected":
      case "corrected":
        return "completed";
      default:
        return "in-progress";
    }
  };

  const getTimelineTitle = (status) => {
    switch (status) {
      case "created":
        return "Service Requested";
      case "screening_done":
        return "Screening Done";
      case "rejected":
        return "Job Rejected";
      case "corrected":
        return "Job Resubmitted";
      default:
        return "Processing";
    }
  };

  const getServiceStatusBadge = (status) => {
    const colors = {
      approved: "bg-green-50 text-green-700 ring-green-600/20",
      rejected: "bg-red-50 text-red-700 ring-red-600/20",
      corrected: "bg-blue-50 text-blue-700 ring-blue-600/20",
      pending: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    };
    return colors[status] || colors["pending"];
  };

  // Screening info
  const getScreeningInfo = (jobId) => {
    const timeline = jobTimelines[jobId] || [];
    const screeningEvent = timeline.find(
      (event) => event.status === "screening_done"
    );
    if (screeningEvent) {
      return {
        date: format(new Date(screeningEvent.timestamp), "PPp"),
        person: screeningEvent.updatedBy ? "Compliance Officer" : "Unknown",
      };
    }
    return { date: "Not screened yet", person: "N/A" };
  };

  const mapTimelineData = (jobId) => {
    const timeline = jobTimelines[jobId] || [];
    if (!timeline.length && loadingTimelines[jobId]) {
      return [
        {
          id: "loading",
          title: "Loading timeline...",
          description: "Please wait",
          date: new Date(),
          status: "in-progress",
          icon: ClockIcon,
        },
      ];
    }
    if (!timeline.length) {
      const job = jobs.find((j) => j._id === jobId);
      return [
        {
          id: 1,
          title: "Service Requested",
          description: `Requested ${job?.serviceType}`,
          date: job?.createdAt,
          status: "completed",
          icon: DocumentTextIcon,
        },
      ];
    }
    return timeline.map((event, index) => ({
      id: index,
      title: getTimelineTitle(event.status),
      description: event.description,
      date: event.timestamp,
      status: getTimelineStatus(event.status),
      icon: getTimelineStatusIcon(event.status),
    }));
  };

  // Helper to render person details in view-only mode with complete data
  const renderViewOnlyPersonDetails = (jobId, personType) => {
    let personData = [];
    switch (personType) {
      case "director":
        personData = directorDetails[jobId] || [];
        break;
      case "shareholder":
        personData = shareholderDetails[jobId] || [];
        break;
      case "secretary":
        personData = secretaryDetails[jobId] || [];
        break;
      case "sef":
        personData = sefDetails[jobId] || [];
        break;
      default:
        personData = [];
    }

    // Get a proper title for the person type
    const getPersonTypeTitle = () => {
      switch (personType) {
        case "director":
          return "Director";
        case "shareholder":
          return "Shareholder";
        case "secretary":
          return "Company Secretary";
        case "sef":
          return "SEF Officer";
        default:
          return personType.charAt(0).toUpperCase() + personType.slice(1);
      }
    };

    // Get proper icon for the person type
    const getPersonTypeIcon = () => {
      switch (personType) {
        case "director":
          return <UserCircleIcon className="h-5 w-5" />;
        case "shareholder":
          return <BriefcaseIcon className="h-5 w-5" />;
        case "secretary":
          return <DocumentDuplicateIcon className="h-5 w-5" />;
        case "sef":
          return <LightBulbIcon className="h-5 w-5" />;
        default:
          return <UserIcon className="h-5 w-5" />;
      }
    };

    // Function to check if a date is valid and in the future
    const isDateValid = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date instanceof Date && !isNaN(date) && date > today;
    };

    // Function to generate expiry status UI elements
    const getExpiryStatus = (dateString) => {
      if (!dateString) return null;

      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expired
          </span>
        );
      } else if (diffDays < 30) {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Expires in {diffDays} days
          </span>
        );
      } else {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Valid
          </span>
        );
      }
    };

    // Loading state
    if (personDetailsLoading[jobId]) {
      return (
        <div className="py-10 text-center bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">
            Loading {getPersonTypeTitle()} details...
          </p>
        </div>
      );
    }

    // Empty state with proper styling
    if (!personData || personData.length === 0) {
      return (
        <div className="py-16 text-center bg-white/60 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {getPersonTypeIcon()}
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No {getPersonTypeTitle()} Details Found
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            No {getPersonTypeTitle().toLowerCase()} information has been added
            for this client yet.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {personData.map((person, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Card Header with Gradient */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-white rounded-full p-2 mr-3 shadow-md">
                    {getPersonTypeIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {person.name || `${getPersonTypeTitle()} ${index + 1}`}
                    </h3>
                    <p className="text-xs text-indigo-100">
                      {person.nationality || ""}{" "}
                      {person.nationality && person.email && "•"}{" "}
                      {person.email || ""}
                    </p>
                  </div>
                </div>
                {person.qidNo && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm">
                    <span className="font-medium">QID:</span> {person.qidNo}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Personal Information Card */}
                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 hover:shadow-md transition-all duration-300">
                  <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center">
                    <UserCircleIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <span className="flex h-6 w-6 rounded-full bg-indigo-100 items-center justify-center">
                          <UserIcon className="h-3.5 w-3.5 text-indigo-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </h5>
                        <p className="text-sm font-medium text-gray-900">
                          {person.name || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <span className="flex h-6 w-6 rounded-full bg-indigo-100 items-center justify-center">
                          <MapPinIcon className="h-3.5 w-3.5 text-indigo-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Nationality
                        </h5>
                        <p className="text-sm font-medium text-gray-900">
                          {person.nationality || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <span className="flex h-6 w-6 rounded-full bg-indigo-100 items-center justify-center">
                          <EnvelopeIcon className="h-3.5 w-3.5 text-indigo-600" />
                        </span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Email
                        </h5>
                        <p className="text-sm font-medium text-gray-900">
                          {person.email || "Not specified"}
                        </p>
                      </div>
                    </div>

                    {person.mobileNo && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <span className="flex h-6 w-6 rounded-full bg-indigo-100 items-center justify-center">
                            <DocumentTextIcon className="h-3.5 w-3.5 text-indigo-600" />
                          </span>
                        </div>
                        <div className="ml-3">
                          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Mobile Number
                          </h5>
                          <p className="text-sm font-medium text-gray-900">
                            {person.mobileNo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documents & IDs Card */}
                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 hover:shadow-md transition-all duration-300">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                    <IdentificationIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                    Identification
                  </h4>
                  <div className="space-y-3">
                    {/* QID Info */}
                    {person.qidNo && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <span className="flex h-6 w-6 rounded-full bg-blue-100 items-center justify-center">
                            <IdentificationIcon className="h-3.5 w-3.5 text-blue-600" />
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              QID Number
                            </h5>
                            {person.qidExpiry &&
                              getExpiryStatus(person.qidExpiry)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {person.qidNo}
                            {person.qidExpiry && (
                              <span className="ml-2 text-xs text-gray-500">
                                Expires:{" "}
                                {new Date(
                                  person.qidExpiry
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Passport Info */}
                    {person.passportNo && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <span className="flex h-6 w-6 rounded-full bg-blue-100 items-center justify-center">
                            <DocumentTextIcon className="h-3.5 w-3.5 text-blue-600" />
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Passport Number
                            </h5>
                            {person.passportExpiry &&
                              getExpiryStatus(person.passportExpiry)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {person.passportNo}
                            {person.passportExpiry && (
                              <span className="ml-2 text-xs text-gray-500">
                                Expires:{" "}
                                {new Date(
                                  person.passportExpiry
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* National Address Info */}
                    {person.nationalAddress && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <span className="flex h-6 w-6 rounded-full bg-blue-100 items-center justify-center">
                            <MapPinIcon className="h-3.5 w-3.5 text-blue-600" />
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center">
                            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              National Address
                            </h5>
                            {person.nationalAddressExpiry &&
                              getExpiryStatus(person.nationalAddressExpiry)}
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {person.nationalAddress}
                            {person.nationalAddressExpiry && (
                              <span className="ml-2 text-xs text-gray-500">
                                Expires:{" "}
                                {new Date(
                                  person.nationalAddressExpiry
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mt-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-1.5 text-indigo-600" />
                  Supporting Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {person.qidDoc ? (
                    <a
                      href={person.qidDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg hover:from-indigo-100 hover:to-blue-100 transition-colors border border-indigo-100 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-indigo-500 transition-colors">
                        <IdentificationIcon className="h-5 w-5 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-900 transition-colors">
                          QID Document
                        </span>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>
                    </a>
                  ) : null}

                  {person.passportDoc ? (
                    <a
                      href={person.passportDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-colors border border-purple-100 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-purple-500 transition-colors">
                        <DocumentTextIcon className="h-5 w-5 text-purple-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-purple-900 transition-colors">
                          Passport Document
                        </span>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>
                    </a>
                  ) : null}

                  {person.nationalAddressDoc ? (
                    <a
                      href={person.nationalAddressDoc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:from-blue-100 hover:to-cyan-100 transition-colors border border-blue-100 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-blue-500 transition-colors">
                        <MapPinIcon className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-900 transition-colors">
                          National Address
                        </span>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>
                    </a>
                  ) : null}

                  {person.visaCopy ? (
                    <a
                      href={person.visaCopy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg hover:from-green-100 hover:to-teal-100 transition-colors border border-green-100 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-green-500 transition-colors">
                        <DocumentIcon className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-green-900 transition-colors">
                          Visa Copy
                        </span>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>
                    </a>
                  ) : null}

                  {person.cv ? (
                    <a
                      href={person.cv}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg hover:from-amber-100 hover:to-yellow-100 transition-colors border border-amber-100 shadow-sm hover:shadow-md"
                    >
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3 group-hover:bg-amber-500 transition-colors">
                        <DocumentDuplicateIcon className="h-5 w-5 text-amber-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-amber-900 transition-colors">
                          CV Document
                        </span>
                        <p className="text-xs text-gray-500">View document</p>
                      </div>
                    </a>
                  ) : null}
                </div>

                {/* No documents message */}
                {!person.qidDoc &&
                  !person.passportDoc &&
                  !person.nationalAddressDoc &&
                  !person.visaCopy &&
                  !person.cv && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <DocumentIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No documents have been uploaded yet.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Helper to render view-only company details with comprehensive implementation
  // Update the renderViewOnlyCompanyDetails function to ensure CR Extract displays properly

  const renderViewOnlyCompanyDetails = (jobId) => {
    const company = companyDetails[jobId];

    // Function to check if a date is valid and in the future
    const isDateValid = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date instanceof Date && !isNaN(date) && date > today;
    };

    // Function to generate expiry status UI elements
    const getExpiryStatus = (dateString) => {
      if (!dateString) return null;

      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Expired
          </span>
        );
      } else if (diffDays < 30) {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Expires in {diffDays} days
          </span>
        );
      } else {
        return (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Valid
          </span>
        );
      }
    };

    // Loading state with animation
    if (personDetailsLoading[jobId]) {
      return (
        <div className="py-10 text-center bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">
            Loading company details...
          </p>
        </div>
      );
    }

    // Empty state with proper styling
    if (!company) {
      return (
        <div className="py-16 text-center bg-white/60 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BuildingOfficeIcon className="h-7 w-7 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No Company Details Found
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            No company information has been added for this client yet.
          </p>
        </div>
      );
    }

    // Debug logging for CR Extract (remove in production)
    console.log("Company data for CR Extract debug:", {
      jobId,
      crExtract: company.crExtract,
      crExtractExpiry: company.crExtractExpiry,
      allCompanyFields: Object.keys(company),
    });

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        {/* Company Header with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <div className="bg-white rounded-xl p-2.5 mr-4 shadow-md">
                <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {company.companyName || "Company Details"}
                </h3>
                {company.qfcNo && (
                  <p className="text-sm text-blue-100 mt-0.5 flex items-center">
                    <IdentificationIcon className="h-4 w-4 mr-1.5" />
                    QFC: {company.qfcNo}
                  </p>
                )}
              </div>
            </div>
            {company.serviceType && (
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <span className="font-medium">{company.serviceType}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Company Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information Card */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-xl p-5 border border-blue-100/40 shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-sm font-semibold text-blue-900 mb-4 pb-2 border-b border-blue-100 flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-blue-600" />
                Company Information
              </h4>

              <div className="space-y-4">
                {/* Company Name */}
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <span className="flex h-7 w-7 rounded-full bg-blue-100 items-center justify-center">
                      <BuildingOfficeIcon className="h-4 w-4 text-blue-600" />
                    </span>
                  </div>
                  <div className="ml-3">
                    <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Company Name
                    </h5>
                    <p className="text-sm font-medium text-gray-900">
                      {company.companyName || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Registered Address */}
                {company.registeredAddress && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-7 w-7 rounded-full bg-blue-100 items-center justify-center">
                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                      </span>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Registered Address
                      </h5>
                      <p className="text-sm font-medium text-gray-900">
                        {company.registeredAddress}
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Purpose */}
                {company.mainPurpose && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-7 w-7 rounded-full bg-blue-100 items-center justify-center">
                        <BriefcaseIcon className="h-4 w-4 text-blue-600" />
                      </span>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Main Purpose
                      </h5>
                      <p className="text-sm font-medium text-gray-900">
                        {company.mainPurpose}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dates & Expiry Card */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-xl p-5 border border-indigo-100/40 shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-sm font-semibold text-indigo-900 mb-4 pb-2 border-b border-indigo-100 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-indigo-600" />
                Dates & Status
              </h4>

              <div className="space-y-4">
                {/* Incorporation Date */}
                {company.incorporationDate && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-7 w-7 rounded-full bg-indigo-100 items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-indigo-600" />
                      </span>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Incorporation Date
                      </h5>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(company.incorporationDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expiry Date */}
                {company.expiryDate && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-7 w-7 rounded-full bg-indigo-100 items-center justify-center">
                        <CalendarIcon className="h-4 w-4 text-indigo-600" />
                      </span>
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Expiry Date
                        </h5>
                        {getExpiryStatus(company.expiryDate)}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(company.expiryDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* KYC Active Status */}
                {company.kycActiveStatus && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <span className="flex h-7 w-7 rounded-full bg-indigo-100 items-center justify-center">
                        <ShieldCheckIcon className="h-4 w-4 text-indigo-600" />
                      </span>
                    </div>
                    <div className="ml-3">
                      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        KYC Status
                      </h5>
                      <div className="flex items-center mt-1">
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            company.kycActiveStatus === "yes"
                              ? "bg-green-500"
                              : "bg-red-500"
                          } mr-2`}
                        ></div>
                        <p className="text-sm font-medium text-gray-900">
                          {company.kycActiveStatus === "yes"
                            ? "Active"
                            : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Cards */}
          <div className="mt-6">
            <h4 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Company Documents
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company Computer Card */}
              {company.companyComputerCard && (
                <a
                  href={company.companyComputerCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-indigo-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                            Computer Card
                          </h5>
                          {company.companyComputerCardExpiry &&
                            getExpiryStatus(company.companyComputerCardExpiry)}
                        </div>
                        {company.companyComputerCardExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(
                              company.companyComputerCardExpiry
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* Tax Card */}
              {company.taxCard && (
                <a
                  href={company.taxCard}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                            Tax Card
                          </h5>
                          {company.taxCardExpiry &&
                            getExpiryStatus(company.taxCardExpiry)}
                        </div>
                        {company.taxCardExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(
                              company.taxCardExpiry
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* CR Extract - Enhanced with proper validation */}
              {Array.isArray(company.crExtract) && company.crExtract.length > 0
                ? // Handle array format (new format)
                  company.crExtract.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-600"></div>
                      <div className="p-5">
                        <div className="flex items-start">
                          <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                            <DocumentTextIcon className="h-6 w-6 text-purple-600 group-hover:text-purple-700 transition-colors" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h5 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                                {doc.fileName || `CR Extract ${index + 1}`}
                              </h5>
                              {company.crExtractExpiry &&
                                getExpiryStatus(company.crExtractExpiry)}
                            </div>
                            {doc.description && (
                              <p className="text-xs text-gray-600 mt-1">
                                {doc.description}
                              </p>
                            )}
                            {doc.uploadedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded:{" "}
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            )}
                            {company.crExtractExpiry && (
                              <p className="text-xs text-gray-500 mt-1">
                                Expires:{" "}
                                {new Date(
                                  company.crExtractExpiry
                                ).toLocaleDateString()}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <EyeIcon className="h-3.5 w-3.5 mr-1" />
                              View CR Extract document
                            </p>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                : // Handle legacy single document format - only show if valid URL exists
                  (() => {
                    const crExtractUrl =
                      company.crExtract ||
                      company.CRExtract ||
                      company.cr_extract;

                    // Only show if there's a valid URL (not empty, null, undefined, or just whitespace)
                    if (
                      !crExtractUrl ||
                      typeof crExtractUrl !== "string" ||
                      crExtractUrl.trim() === ""
                    ) {
                      return null;
                    }

                    return (
                      <a
                        href={crExtractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-600"></div>
                        <div className="p-5">
                          <div className="flex items-start">
                            <div className="bg-purple-100 rounded-lg p-3 flex-shrink-0">
                              <DocumentTextIcon className="h-6 w-6 text-purple-600 group-hover:text-purple-700 transition-colors" />
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h5 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                                  CR Extract
                                </h5>
                                {(company.crExtractExpiry ||
                                  company.CRExtractExpiry ||
                                  company.cr_extract_expiry) &&
                                  getExpiryStatus(
                                    company.crExtractExpiry ||
                                      company.CRExtractExpiry ||
                                      company.cr_extract_expiry
                                  )}
                              </div>
                              {(company.crExtractExpiry ||
                                company.CRExtractExpiry ||
                                company.cr_extract_expiry) && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Expires:{" "}
                                  {new Date(
                                    company.crExtractExpiry ||
                                      company.CRExtractExpiry ||
                                      company.cr_extract_expiry
                                  ).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <EyeIcon className="h-3.5 w-3.5 mr-1" />
                                View CR Extract document
                              </p>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })()}

              {/* Scope of License */}
              {company.scopeOfLicense && (
                <a
                  href={company.scopeOfLicense}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-amber-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-amber-600 group-hover:text-amber-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                            Scope of License
                          </h5>
                          {company.scopeOfLicenseExpiry &&
                            getExpiryStatus(company.scopeOfLicenseExpiry)}
                        </div>
                        {company.scopeOfLicenseExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(
                              company.scopeOfLicenseExpiry
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* Article of Associate */}
              {company.articleOfAssociate && (
                <a
                  href={company.articleOfAssociate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-cyan-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-cyan-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-cyan-600 group-hover:text-cyan-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <h5 className="font-medium text-gray-900 group-hover:text-cyan-700 transition-colors">
                          Article of Associate
                        </h5>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <EyeIcon className="h-3.5 w-3.5 mr-1" />
                          View document
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              )}

              {/* Certificate of Incorporate */}
              {company.certificateOfIncorporate && (
                <a
                  href={company.certificateOfIncorporate}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-rose-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-rose-600 group-hover:text-rose-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <h5 className="font-medium text-gray-900 group-hover:text-rose-700 transition-colors">
                          Certificate of Incorporate
                        </h5>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <EyeIcon className="h-3.5 w-3.5 mr-1" />
                          View document
                        </p>
                      </div>
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* No documents message - Updated to include all possible CR Extract field names */}
            {!company.companyComputerCard &&
              !company.taxCard &&
              !(company.crExtract || company.CRExtract || company.cr_extract) &&
              !company.scopeOfLicense &&
              !company.articleOfAssociate &&
              !company.certificateOfIncorporate && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    No company documents have been uploaded yet.
                  </p>
                </div>
              )}
          </div>

          {/* Debug Information (remove in production) */}
          {/* {process.env.NODE_ENV === "development" && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="text-sm font-medium text-yellow-800 mb-2">
                Debug Info (Development Only)
              </h5>
              <pre className="text-xs text-yellow-700 overflow-x-auto">
                {JSON.stringify(
                  {
                    crExtract: company.crExtract,
                    CRExtract: company.CRExtract,
                    cr_extract: company.cr_extract,
                    crExtractExpiry: company.crExtractExpiry,
                    CRExtractExpiry: company.CRExtractExpiry,
                    cr_extract_expiry: company.cr_extract_expiry,
                    allFields: Object.keys(company),
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )} */}
        </div>
      </motion.div>
    );
  };

  // Render view-only KYC details with comprehensive implementation
  const renderViewOnlyKycDetails = (jobId) => {
    const kyc = kycDetails[jobId];

    // Loading state with animation
    if (personDetailsLoading[jobId]) {
      return (
        <div className="py-10 text-center bg-white rounded-xl shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading KYC details...</p>
        </div>
      );
    }

    // Empty state with proper styling
    if (!kyc) {
      return (
        <div className="py-16 text-center bg-white/60 backdrop-blur-sm rounded-xl shadow-md border border-gray-200">
          <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-7 w-7 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            No KYC Details Found
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            No KYC information has been added for this client yet.
          </p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        {/* KYC Header with Gradient */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-white rounded-xl p-2.5 mr-4 shadow-md">
                <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  KYC Verification
                </h3>
                <p className="text-sm text-green-100 mt-0.5">
                  Know Your Customer Documentation
                </p>
              </div>
            </div>
            <div
              className={`${
                kyc.activeStatus === "yes" ? "bg-green-500" : "bg-red-500"
              } px-4 py-2 rounded-full text-white shadow-sm`}
            >
              <span className="font-medium">
                {kyc.activeStatus === "yes" ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* KYC Status Card */}
          <div className="bg-gradient-to-br from-green-50/70 to-emerald-50/70 rounded-xl p-5 border border-green-100/40 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
            <h4 className="text-sm font-semibold text-green-900 mb-4 pb-2 border-b border-green-100 flex items-center">
              <ShieldCheckIcon className="h-4 w-4 mr-2 text-green-600" />
              KYC Status Information
            </h4>

            <div className="flex items-center p-3 bg-white rounded-lg shadow-sm">
              <div
                className={`flex h-10 w-10 rounded-full ${
                  kyc.activeStatus === "yes" ? "bg-green-100" : "bg-red-100"
                } items-center justify-center mr-4`}
              >
                {kyc.activeStatus === "yes" ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900">
                  KYC Verification Status
                </h5>
                <p
                  className={`text-sm ${
                    kyc.activeStatus === "yes"
                      ? "text-green-600"
                      : "text-red-600"
                  } font-medium`}
                >
                  {kyc.activeStatus === "yes"
                    ? "Verified and Active"
                    : "Not Verified"}
                </p>
              </div>
            </div>

            {/* Last Verification Date */}
            {kyc.lastVerificationDate && (
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm mt-3">
                <div className="flex h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-4">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900">
                    Last Verification Date
                  </h5>
                  <p className="text-sm text-gray-700">
                    {new Date(kyc.lastVerificationDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Verification Officer */}
            {kyc.verificationOfficer && (
              <div className="flex items-center p-3 bg-white rounded-lg shadow-sm mt-3">
                <div className="flex h-10 w-10 rounded-full bg-indigo-100 items-center justify-center mr-4">
                  <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-900">
                    Verification Officer
                  </h5>
                  <p className="text-sm text-gray-700">
                    {kyc.verificationOfficer}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* KYC Documents Section */}
          {kyc.documents && kyc.documents.length > 0 ? (
            <div>
              {/* <h4 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
                KYC Documents
              </h4> */}

              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kyc.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-green-600"></div>
                    <div className="p-5">
                      <div className="flex items-start">
                        <div className="bg-green-100 rounded-lg p-3 flex-shrink-0">
                          <DocumentTextIcon className="h-6 w-6 text-green-600 group-hover:text-green-700 transition-colors" />
                        </div>
                        <div className="ml-4">
                          <h5 className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                            {doc.name || `KYC Document ${idx + 1}`}
                          </h5>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <EyeIcon className="h-3.5 w-3.5 mr-1" />
                            View document
                          </p>
                          {doc.uploadDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Uploaded:{" "}
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </p>
                          )}
                          {doc.docType && (
                            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {doc.docType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div> */}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-center">
              {/* <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <DocumentDuplicateIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h5 className="text-base font-medium text-gray-700 mb-2">
                No KYC Documents
              </h5>
              <p className="text-sm text-gray-500">
                No KYC documents have been uploaded yet for this client.
              </p> */}
            </div>
          )}

          {/* KYC Approval Process Tracker */}
          {kyc.approvalProcess && (
            <div className="mt-6">
              <h4 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                Approval Process
              </h4>

              <div className="relative">
                {/* Process Timeline */}
                <div className="h-2 bg-gray-200 rounded-full w-full mb-8">
                  <div
                    className="h-2 bg-green-500 rounded-full"
                    style={{
                      width: `${kyc.approvalProcess.progressPercentage || 0}%`,
                    }}
                  ></div>
                </div>

                {/* Process Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* LMRO Step */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div
                        className={`flex h-8 w-8 rounded-full ${
                          kyc.approvalProcess.lmroApproved
                            ? "bg-green-100"
                            : "bg-gray-100"
                        } items-center justify-center mr-2`}
                      >
                        <UserGroupIcon
                          className={`h-5 w-5 ${
                            kyc.approvalProcess.lmroApproved
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <h5 className="text-sm font-medium text-gray-900">
                        LMRO Approval
                      </h5>
                    </div>
                    <p className="text-xs text-gray-500">
                      {kyc.approvalProcess.lmroApproved
                        ? `Approved on ${new Date(
                            kyc.approvalProcess.lmroApprovalDate
                          ).toLocaleDateString()}`
                        : "Pending approval"}
                    </p>
                  </div>

                  {/* DLMRO Step */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div
                        className={`flex h-8 w-8 rounded-full ${
                          kyc.approvalProcess.dlmroApproved
                            ? "bg-green-100"
                            : "bg-gray-100"
                        } items-center justify-center mr-2`}
                      >
                        <ClipboardDocumentCheckIcon
                          className={`h-5 w-5 ${
                            kyc.approvalProcess.dlmroApproved
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <h5 className="text-sm font-medium text-gray-900">
                        DLMRO Approval
                      </h5>
                    </div>
                    <p className="text-xs text-gray-500">
                      {kyc.approvalProcess.dlmroApproved
                        ? `Approved on ${new Date(
                            kyc.approvalProcess.dlmroApprovalDate
                          ).toLocaleDateString()}`
                        : kyc.approvalProcess.lmroApproved
                        ? "In progress"
                        : "Awaiting LMRO approval"}
                    </p>
                  </div>

                  {/* CEO Step */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div
                        className={`flex h-8 w-8 rounded-full ${
                          kyc.approvalProcess.ceoApproved
                            ? "bg-green-100"
                            : "bg-gray-100"
                        } items-center justify-center mr-2`}
                      >
                        <LockClosedIcon
                          className={`h-5 w-5 ${
                            kyc.approvalProcess.ceoApproved
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <h5 className="text-sm font-medium text-gray-900">
                        CEO Approval
                      </h5>
                    </div>
                    <p className="text-xs text-gray-500">
                      {kyc.approvalProcess.ceoApproved
                        ? `Approved on ${new Date(
                            kyc.approvalProcess.ceoApprovalDate
                          ).toLocaleDateString()}`
                        : kyc.approvalProcess.dlmroApproved
                        ? "In progress"
                        : "Awaiting previous approvals"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Box */}
          <div className="mt-6 bg-blue-50 rounded-lg border border-blue-100 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <InformationCircleIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h5 className="text-sm font-medium text-blue-800">
                  KYC Verification
                </h5>
                <p className="mt-1 text-sm text-blue-700">
                  KYC (Know Your Customer) verification is a mandatory process
                  to verify the identity of clients and assess potential risks
                  of illegal intentions for business relationships.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // Get KYC approval status - UPDATED to include compliance documents
  // const getKycStatus = asyncHandler(async (req, res) => {
  //   const { jobId } = req.params;

  //   try {
  //     // Check if the job exists first
  //     const job = await Job.findById(jobId);

  //     if (!job) {
  //       return res.status(404).json({
  //         message: "Job not found",
  //         jobId,
  //       });
  //     }

  //     // Now check for KYC approval with populated user details
  //     const kycApproval = await KycApproval.findOne({ jobId })
  //       .populate("lmroApproval.approvedBy", "name email")
  //       .populate("dlmroApproval.approvedBy", "name email")
  //       .populate("ceoApproval.approvedBy", "name email")
  //       .populate("rejectedBy", "name email")
  //       // Add document uploader population
  //       .populate("lmroApproval.document.uploadedBy", "name email")
  //       .populate("dlmroApproval.document.uploadedBy", "name email")
  //       .populate("ceoApproval.document.uploadedBy", "name email")
  //       // ADD THESE NEW LINES FOR MODIFIED BY FIELDS
  //       .populate("lmroApproval.modifiedBy", "name email")
  //       .populate("dlmroApproval.modifiedBy", "name email")
  //       .populate("ceoApproval.modifiedBy", "name email")
  //       // ADD THESE NEW LINES FOR DELETED BY FIELDS
  //       .populate("lmroApproval.deletedBy", "name email")
  //       .populate("dlmroApproval.deletedBy", "name email")
  //       .populate("ceoApproval.deletedBy", "name email");

  //     if (!kycApproval) {
  //       // Return 200 with exists:false instead of 404
  //       return res.status(200).json({
  //         exists: false,
  //         message: "KYC approval not initiated yet",
  //         jobId,
  //         jobStatus: job.status,
  //         canInitialize: job.status === "om_completed",
  //         jobInfo: {
  //           clientName: job.clientName,
  //           serviceType: job.serviceType,
  //           createdAt: job.createdAt,
  //           // Include compliance approval document and notes
  //           approvalDocument: job.approvalDocument,
  //           approvalNotes: job.approvalNotes
  //         },
  //       });
  //     }

  //     // When returning an existing KYC approval, include exists:true and job details
  //     res.status(200).json({
  //       exists: true,
  //       ...kycApproval.toObject(),
  //       // Include job details with compliance documents
  //       jobInfo: {
  //         clientName: job.clientName,
  //         serviceType: job.serviceType,
  //         createdAt: job.createdAt,
  //         approvalDocument: job.approvalDocument,
  //         approvalNotes: job.approvalNotes
  //       }
  //     });
  //   } catch (error) {
  //     console.error(`Error in getKycStatus for job ${jobId}:`, error);
  //     res.status(500).json({
  //       message: "Server error retrieving KYC status",
  //       error: error.message,
  //     });
  //   }
  // });

  // Helper function to safely get KYC status - UPDATED with better population
  const getKycStatusSafely = async (jobId) => {
    try {
      const kycApproval = await KycApproval.findOne({ jobId })
        .populate("lmroApproval.approvedBy", "name email")
        .populate("dlmroApproval.approvedBy", "name email")
        .populate("ceoApproval.approvedBy", "name email")
        .populate("rejectedBy", "name email")
        // Document uploader population
        .populate("lmroApproval.document.uploadedBy", "name email")
        .populate("dlmroApproval.document.uploadedBy", "name email")
        .populate("ceoApproval.document.uploadedBy", "name email")
        // FIXED: Modified by population
        .populate("lmroApproval.modifiedBy", "name email")
        .populate("dlmroApproval.modifiedBy", "name email")
        .populate("ceoApproval.modifiedBy", "name email")
        // FIXED: Deleted by population
        .populate("lmroApproval.deletedBy", "name email")
        .populate("dlmroApproval.deletedBy", "name email")
        .populate("ceoApproval.deletedBy", "name email");

      return kycApproval;
    } catch (error) {
      console.error(`Error getting KYC status for job ${jobId}:`, error);
      return null;
    }
  };

  const renderKycDocumentLink = (kycData) => {
    let document = null;
    let stageLabel = "";
    if (kycData.status === "completed" && kycData.ceoApproval?.document) {
      document = kycData.ceoApproval.document;
      stageLabel = "Final Approved";
    } else if (
      kycData.currentApprovalStage === "ceo" &&
      kycData.dlmroApproval?.document
    ) {
      document = kycData.dlmroApproval.document;
      stageLabel = "DLMRO";
    } else if (
      kycData.currentApprovalStage === "dlmro" &&
      kycData.lmroApproval?.document
    ) {
      document = kycData.lmroApproval.document;
      stageLabel = "LMRO";
    } else if (
      kycData.currentApprovalStage === "lmro" &&
      kycData.lmroApproval?.document
    ) {
      document = kycData.lmroApproval.document;
      stageLabel = "LMRO";
    }
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-blue-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Link
              to="/compliance-selection"
              className="inline-flex items-center px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Compliance
            </Link>
            <Link
              to="/operation-management"
              className="inline-flex items-center px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Operations
            </Link>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {}}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </motion.button>
        </motion.div>

        {/* Client Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500"
        >
          <div className="px-8 py-10">
            <div className="flex items-start space-x-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-4 ring-blue-100 shadow-lg"
              >
                <UserCircleIcon className="h-12 w-12 text-white" />
              </motion.div>
              <div className="flex-1">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent"
                >
                  {client.name}
                </motion.h1>
                <div className="flex items-center mt-1">
                  <EnvelopeIcon className="h-4 w-4 text-gray-500 mr-1" />
                  <motion.p
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-gray-500"
                  >
                    {client.gmail}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {jobs.map((job, index) => (
                    <motion.span
                      key={job._id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getServiceStatusBadge(
                        job.status
                      )} shadow-sm`}
                    >
                      <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                      {job.serviceType}
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 p-4 rounded-xl bg-green-50/50 border border-green-100/50"
                >
                  <MapPinIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Starting Point
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.startingPoint}
                    </p>
                  </div>
                </motion.div>
              </div>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center space-x-3 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/50"
                >
                  <BriefcaseIcon className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Services
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {jobs.length} active services
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        {renderEngagementLettersSection()}

        {/* Services Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <BriefcaseIcon className="h-6 w-6 mr-2 text-blue-600" />
            Client Services
          </h2>
          <div className="space-y-4">
            {jobs.map((job, index) => (
              <motion.div
                key={job._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden hover:shadow-2xl transition-all duration-500"
              >
                <motion.div
                  whileHover={{ backgroundColor: "rgba(249, 250, 251, 0.5)" }}
                  className="px-6 py-4 cursor-pointer transition-colors duration-200"
                  onClick={() =>
                    setExpandedService(
                      expandedService === job._id ? null : job._id
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`p-2 rounded-lg ${getServiceStatusBadge(
                          job.status
                        )}`}
                      >
                        <BriefcaseIcon className="h-5 w-5" />
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {job.serviceType}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Assigned to {job.assignedPerson}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleViewJobDetails(job._id, e)}
                        className="px-3 py-1.5 text-sm text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg flex items-center shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                        Edit Job Details
                      </motion.button>
                      <motion.div
                        animate={{
                          rotate: expandedService === job._id ? 180 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
                <AnimatePresence>
                  {expandedService === job._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-4 border-t border-gray-100">
                        {/* Service Information Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="bg-gray-50/70 rounded-xl p-5 mb-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-medium text-gray-900">
                              Service Information
                            </h4>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => handleViewJobDetails(job._id, e)}
                              className="px-3 py-1.5 text-sm text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg flex items-center shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              <EyeIcon className="h-4 w-4 mr-1.5" />
                              View/Edit Details
                            </motion.button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Service Type
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.serviceType}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <UserIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Assigned Person
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.assignedPerson}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <UserCircleIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Client Name
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.clientName}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <EnvelopeIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Email
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.gmail}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {/* Right Column */}
                            <div className="space-y-4">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <MapPinIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Starting Point
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    {job.startingPoint}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <DocumentIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Documents
                                  </h5>
                                  <div className="mt-1 space-y-1">
                                    <a
                                      href={job.documentPassport}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                    >
                                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                                      Passport
                                    </a>
                                    <a
                                      href={job.documentID}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                                    >
                                      <IdentificationIcon className="h-4 w-4 mr-1" />
                                      ID Document
                                    </a>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-0.5">
                                  <ClockIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                  <h5 className="text-sm font-medium text-gray-900">
                                    Screening Information
                                  </h5>
                                  <p className="text-sm text-gray-700">
                                    <span className="block">
                                      Date: {getScreeningInfo(job._id).date}
                                    </span>
                                    <span className="block">
                                      Person: {getScreeningInfo(job._id).person}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">
                              Job Details
                            </h5>
                            <p className="text-sm text-gray-700 bg-white/50 p-3 rounded-lg border border-gray-100">
                              {job.jobDetails}
                            </p>
                          </div>
                          {job.specialDescription && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-900 mb-2">
                                Special Description
                              </h5>
                              <p className="text-sm italic text-gray-600 bg-white/50 p-3 rounded-lg border border-gray-100">
                                {job.specialDescription}
                              </p>
                            </div>
                          )}
                        </motion.div>

                        {/* Person Details Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-gray-50/70 rounded-xl p-5 mb-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-medium text-gray-900">
                              Person Details
                            </h4>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) =>
                                handleEditPersonDetails(job._id, e)
                              }
                              className="px-3 py-1.5 text-sm text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg flex items-center shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                              Edit Person Details
                            </motion.button>
                          </div>
                          <div className="mb-6">
                            <div className="bg-gray-100/70 rounded-xl p-1.5 shadow-inner">
                              <nav
                                className="flex space-x-1 overflow-x-auto"
                                aria-label="Tabs"
                              >
                                <button
                                  onClick={() => setActivePersonTab("company")}
                                  className={`${
                                    activePersonTab === "company"
                                      ? "bg-white text-blue-700 shadow-sm border-blue-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <BuildingOfficeIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "company"
                                        ? "text-blue-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>Company</span>
                                </button>
                                <button
                                  onClick={() => setActivePersonTab("director")}
                                  className={`${
                                    activePersonTab === "director"
                                      ? "bg-white text-indigo-700 shadow-sm border-indigo-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <UserIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "director"
                                        ? "text-indigo-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>Directors</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setActivePersonTab("shareholder")
                                  }
                                  className={`${
                                    activePersonTab === "shareholder"
                                      ? "bg-white text-purple-700 shadow-sm border-purple-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <BriefcaseIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "shareholder"
                                        ? "text-purple-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>Shareholders</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setActivePersonTab("secretary")
                                  }
                                  className={`${
                                    activePersonTab === "secretary"
                                      ? "bg-white text-cyan-700 shadow-sm border-cyan-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <DocumentDuplicateIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "secretary"
                                        ? "text-cyan-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>Secretary</span>
                                </button>
                                <button
                                  onClick={() => setActivePersonTab("sef")}
                                  className={`${
                                    activePersonTab === "sef"
                                      ? "bg-white text-amber-700 shadow-sm border-amber-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <LightBulbIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "sef"
                                        ? "text-amber-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>SEF</span>
                                </button>
                                <button
                                  onClick={() => setActivePersonTab("kyc")}
                                  className={`${
                                    activePersonTab === "kyc"
                                      ? "bg-white text-green-700 shadow-sm border-green-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border-transparent"
                                  } flex-1 whitespace-nowrap py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center space-x-1 transition-all duration-200 border`}
                                >
                                  <ShieldCheckIcon
                                    className={`h-4 w-4 ${
                                      activePersonTab === "kyc"
                                        ? "text-green-600"
                                        : "text-gray-500"
                                    }`}
                                  />
                                  <span>KYC</span>
                                </button>
                              </nav>
                            </div>
                          </div>
                          <div className="mt-4">
                            {activePersonTab === "company" &&
                              renderViewOnlyCompanyDetails(job._id)}
                            {activePersonTab === "director" &&
                              renderViewOnlyPersonDetails(job._id, "director")}
                            {activePersonTab === "shareholder" &&
                              renderViewOnlyPersonDetails(
                                job._id,
                                "shareholder"
                              )}
                            {activePersonTab === "secretary" &&
                              renderViewOnlyPersonDetails(job._id, "secretary")}
                            {activePersonTab === "sef" &&
                              renderViewOnlyPersonDetails(job._id, "sef")}
                            {activePersonTab === "kyc" &&
                              renderViewOnlyKycDetails(job._id)}
                          </div>
                        </motion.div>

                        {/* Timeline Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="mt-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-medium text-gray-900">
                              Service Timeline
                            </h4>
                            <button
                              onClick={() => toggleTimelineVisibility(job._id)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title={showTimelines[job._id] === false ? "Show Timeline" : "Hide Timeline"}
                            >
                              {showTimelines[job._id] === false ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronUpIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <AnimatePresence mode="wait">
                          {showTimelines[job._id] !== false ? (
                            <motion.div 
                              key="timeline-visible"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="flow-root">
                            <ul className="-mb-8">
                              {mapTimelineData(job._id).map(
                                (event, eventIdx) => (
                                  <motion.li
                                    key={event.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 + eventIdx * 0.1 }}
                                  >
                                    <div className="relative pb-8">
                                      {eventIdx !==
                                      mapTimelineData(job._id).length - 1 ? (
                                        <span
                                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      <div className="relative flex space-x-3">
                                        <motion.div
                                          whileHover={{ scale: 1.1 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 10,
                                          }}
                                        >
                                          <span
                                            className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getStatusColor(
                                              event.status
                                            )}`}
                                          >
                                            <event.icon
                                              className="h-5 w-5"
                                              aria-hidden="true"
                                            />
                                          </span>
                                        </motion.div>
                                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                          <div>
                                            <p className="text-sm font-medium text-gray-900">
                                              {event.title}
                                              {event.status === "completed" && (
                                                <motion.span
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"
                                                >
                                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                  Done
                                                </motion.span>
                                              )}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                              {event.description}
                                            </p>
                                          </div>
                                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                            {format(
                                              new Date(event.date),
                                              "PPp"
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.li>
                                )
                              )}
                            </ul>
                          </motion.div>
                          ) : (
                            <motion.div
                              key="timeline-hidden"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="text-center py-3 bg-gray-50 rounded-lg"
                            >
                              <p className="text-sm text-gray-500">Timeline hidden. Click the arrow to show.</p>
                            </motion.div>
                          )}
                          </AnimatePresence>
                        </motion.div>

                        {/* Enhanced KYC Management Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-6 bg-gray-50/70 rounded-xl p-5 mb-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-medium text-gray-900 flex items-center">
                              <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-600" />
                              KYC Management
                            </h4>
                          </div>

                          {loadingKycStatuses[job._id] ? (
                            <div className="py-8 text-center">
                              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                              <p className="mt-3 text-sm text-gray-500">
                                Loading KYC data...
                              </p>
                            </div>
                          ) : kycStatuses[job._id] ? (
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
                              {/* Status Badge and Stage */}
                              <div className="flex flex-col gap-4 mb-5">
                                <div className="flex flex-wrap items-center justify-between">
                                  <div className="flex items-center">
                                    <span
                                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                        getKYCStatusInfo(kycStatuses[job._id])
                                          .color
                                      }`}
                                    >
                                      {
                                        getKYCStatusInfo(kycStatuses[job._id])
                                          .icon
                                      }
                                      <span className="ml-1">
                                        {
                                          getKYCStatusInfo(kycStatuses[job._id])
                                            .label
                                        }
                                      </span>
                                    </span>
                                  </div>

                                  {/* Status Date */}
                                  {kycStatuses[job._id].exists &&
                                    kycStatuses[job._id].updatedAt && (
                                      <div className="text-sm text-gray-500">
                                        Last Updated:{" "}
                                        {new Date(
                                          kycStatuses[job._id].updatedAt
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                </div>

                                {/* Status Description */}
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <p>
                                    {
                                      getKYCStatusInfo(kycStatuses[job._id])
                                        .description
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* KYC Progress Bar */}
                              {kycStatuses[job._id].exists && (
                                <div className="mb-6">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>MLRO</span>
                                    <span>DMLRO</span>
                                    <span>CEO</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* LMRO */}
                                    <div
                                      className={`h-2.5 flex-1 rounded-l-full ${
                                        kycStatuses[job._id].lmroApproval
                                          ?.approved
                                          ? "bg-green-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>

                                    {/* DLMRO */}
                                    <div
                                      className={`h-2.5 flex-1 ${
                                        kycStatuses[job._id].dlmroApproval
                                          ?.approved
                                          ? "bg-green-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>

                                    {/* CEO */}
                                    <div
                                      className={`h-2.5 flex-1 rounded-r-full ${
                                        kycStatuses[job._id].ceoApproval
                                          ?.approved
                                          ? "bg-green-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Enhanced KYC Documents Section */}
                              {kycStatuses[job._id].exists && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                                    KYC Documents
                                  </h5>
                                  {renderEnhancedKycDocumentSection(
                                    kycStatuses[job._id],
                                    job._id
                                  )}
                                </div>
                              )}

                              {/* KYC Document Update Modals */}
                              {Object.entries(kycDocumentModals).map(
                                ([key, isOpen]) => {
                                  const [jobId, stage] = key.split("-");
                                  return (
                                    <KycDocumentUpdateModal
                                      key={key}
                                      isOpen={isOpen}
                                      onClose={() =>
                                        setKycDocumentModals((prev) => ({
                                          ...prev,
                                          [key]: false,
                                        }))
                                      }
                                      jobId={jobId}
                                      stage={stage}
                                      onUpdate={handleUpdateKycDocument}
                                    />
                                  );
                                }
                              )}

                              {/* KYC Document Delete Confirmation Modals */}
                              {Object.entries(deleteConfirmModals).map(
                                ([key, isOpen]) => {
                                  const [jobId, stage] = key.split("-");
                                  return (
                                    <KycDocumentDeleteModal
                                      key={key}
                                      isOpen={isOpen}
                                      onClose={() =>
                                        setDeleteConfirmModals((prev) => ({
                                          ...prev,
                                          [key]: false,
                                        }))
                                      }
                                      jobId={jobId}
                                      stage={stage}
                                      onDelete={handleDeleteKycDocument}
                                    />
                                  );
                                }
                              )}

                              {/* Rejection Reason (if KYC is rejected) */}
                              {kycStatuses[job._id].exists &&
                                kycStatuses[job._id].status === "rejected" && (
                                  <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0">
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                      </div>
                                      <div className="ml-3">
                                        <h5 className="text-sm font-medium text-red-800">
                                          Rejection Reason
                                        </h5>
                                        <p className="text-sm text-red-700 mt-1">
                                          {kycStatuses[job._id]
                                            .rejectionReason ||
                                            "No reason provided"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6 text-center">
                              <ShieldExclamationIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 max-w-md mx-auto">
                                No KYC process has been initialized for this job
                                yet. KYC information will appear here once the
                                process begins.
                              </p>
                            </div>
                          )}
                        </motion.div>

                        {/* BRA Management Section */}
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="mt-6 bg-gray-50/70 rounded-xl p-5 mb-6"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-base font-medium text-gray-900 flex items-center">
                              <ClipboardIcon className="h-5 w-5 mr-2 text-teal-600" />
                              BRA Management
                            </h4>
                          </div>

                          {loadingBraStatuses[job._id] ? (
                            <div className="py-8 text-center">
                              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                              <p className="mt-3 text-sm text-gray-500">
                                Loading BRA data...
                              </p>
                            </div>
                          ) : braStatuses[job._id] ? (
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6">
                              {/* Status Badge and Stage */}
                              <div className="flex flex-col gap-4 mb-5">
                                <div className="flex flex-wrap items-center justify-between">
                                  <div className="flex items-center">
                                    <span
                                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                                        getBRAStatusInfo(braStatuses[job._id])
                                          .color
                                      }`}
                                    >
                                      {
                                        getBRAStatusInfo(braStatuses[job._id])
                                          .icon
                                      }
                                      <span className="ml-1">
                                        {
                                          getBRAStatusInfo(braStatuses[job._id])
                                            .label
                                        }
                                      </span>
                                    </span>
                                  </div>

                                  {/* Status Date */}
                                  {braStatuses[job._id].exists &&
                                    braStatuses[job._id].updatedAt && (
                                      <div className="text-sm text-gray-500">
                                        Last Updated:{" "}
                                        {new Date(
                                          braStatuses[job._id].updatedAt
                                        ).toLocaleDateString()}
                                      </div>
                                    )}
                                </div>

                                {/* Status Description */}
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                  <p>
                                    {
                                      getBRAStatusInfo(braStatuses[job._id])
                                        .description
                                    }
                                  </p>
                                </div>
                              </div>

                              {/* BRA Progress Bar */}
                              {braStatuses[job._id].exists && (
                                <div className="mb-6">
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>MLRO</span>
                                    <span>DMLRO</span>
                                    <span>CEO</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* LMRO */}
                                    <div
                                      className={`h-2.5 flex-1 rounded-l-full ${
                                        braStatuses[job._id].lmroApproval
                                          ?.approved
                                          ? "bg-teal-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>

                                    {/* DLMRO */}
                                    <div
                                      className={`h-2.5 flex-1 ${
                                        braStatuses[job._id].dlmroApproval
                                          ?.approved
                                          ? "bg-teal-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>

                                    {/* CEO */}
                                    <div
                                      className={`h-2.5 flex-1 rounded-r-full ${
                                        braStatuses[job._id].ceoApproval
                                          ?.approved
                                          ? "bg-teal-500"
                                          : "bg-gray-200"
                                      }`}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {/* Enhanced BRA Documents Section */}
                              {braStatuses[job._id].exists && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-teal-600" />
                                    BRA Documents
                                  </h5>
                                  {renderEnhancedBraDocumentSection(
                                    braStatuses[job._id],
                                    job._id
                                  )}
                                </div>
                              )}
                              {/* BRA Document Update Modals */}
                              {Object.entries(braDocumentModals).map(
                                ([key, isOpen]) => {
                                  const [jobId, stage] = key.split("-");
                                  return (
                                    <BraDocumentUpdateModal
                                      key={key}
                                      isOpen={isOpen}
                                      onClose={() =>
                                        setBraDocumentModals((prev) => ({
                                          ...prev,
                                          [key]: false,
                                        }))
                                      }
                                      jobId={jobId}
                                      stage={stage}
                                      onUpdate={handleUpdateBraDocument}
                                    />
                                  );
                                }
                              )}

                              {/* BRA Document Delete Confirmation Modals */}
                              {Object.entries(braDeleteConfirmModals).map(
                                ([key, isOpen]) => {
                                  const [jobId, stage] = key.split("-");
                                  return (
                                    <BraDocumentDeleteModal
                                      key={key}
                                      isOpen={isOpen}
                                      onClose={() =>
                                        setBraDeleteConfirmModals((prev) => ({
                                          ...prev,
                                          [key]: false,
                                        }))
                                      }
                                      jobId={jobId}
                                      stage={stage}
                                      onDelete={handleDeleteBraDocument}
                                    />
                                  );
                                }
                              )}
                              {/* Rejection Reason (if BRA is rejected) */}
                              {braStatuses[job._id].exists &&
                                braStatuses[job._id].status === "rejected" && (
                                  <div className="mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                                    <div className="flex items-start">
                                      <div className="flex-shrink-0">
                                        <XCircleIcon className="h-5 w-5 text-red-500" />
                                      </div>
                                      <div className="ml-3">
                                        <h5 className="text-sm font-medium text-red-800">
                                          Rejection Reason
                                        </h5>
                                        <p className="text-sm text-red-700 mt-1">
                                          {braStatuses[job._id]
                                            .rejectionReason ||
                                            "No reason provided"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 p-6 text-center">
                              <ClipboardIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-500 max-w-md mx-auto">
                                No BRA process has been initialized for this job
                                yet. BRA information will appear here once the
                                process begins.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Monthly Payment Records Section */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-medium text-gray-900 flex items-center">
                            <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Monthly Payment Records
                          </h4>
                          <div className="flex items-center space-x-2">
                            {/* Quick Stats */}
                            <div className="bg-blue-50 px-3 py-1 rounded-lg">
                              <span className="text-xs text-blue-700 font-medium">
                                Payment Management
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Tabbed Navigation */}
                        <div className="border-b border-gray-200 mb-4">
                          <nav className="flex space-x-8" aria-label="Tabs">
                            <button
                              onClick={() =>
                                setActivePaymentTab(job._id, "add")
                              }
                              className={`${
                                activePaymentTabs[job._id] === "add" ||
                                !activePaymentTabs[job._id]
                                  ? "border-blue-500 text-blue-600"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                              <PlusIcon className="h-4 w-4 mr-2" />
                              Add New Month
                            </button>
                            <button
                              onClick={() =>
                                setActivePaymentTab(job._id, "history")
                              }
                              className={`${
                                activePaymentTabs[job._id] === "history"
                                  ? "border-blue-500 text-blue-600"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-2" />
                              View & Manage History
                            </button>
                          </nav>
                        </div>

                        {/* Add New Month View */}
                        {(!activePaymentTabs[job._id] ||
                          activePaymentTabs[job._id] === "add") && (
                          <div>
                            <div className="mb-4">
                              <button
                                onClick={() =>
                                  setIsAddNewMonthOpen((prev) => ({
                                    ...prev,
                                    [job._id]: true,
                                  }))
                                }
                                className="w-full sm:w-auto px-6 py-3 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                              >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                <span className="font-medium">
                                  Add New Monthly Payment
                                </span>
                              </button>

                              {/* Information Box */}
                              <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                <div className="flex items-start">
                                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                                  <div>
                                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                                      Payment Record Management
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                      Add monthly payment records with multiple
                                      invoices. Each record can contain payment
                                      invoices and supporting documents. You can
                                      edit, add, or delete individual invoices
                                      after creating the monthly record.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isAddNewMonthOpen &&
                              isAddNewMonthOpen[job._id] && (
                                <MonthlyPaymentForm
                                  jobId={job._id}
                                  jobType={job.serviceType}
                                  onClose={() =>
                                    setIsAddNewMonthOpen((prev) => ({
                                      ...prev,
                                      [job._id]: false,
                                    }))
                                  }
                                  onSuccess={() => {
                                    setIsAddNewMonthOpen((prev) => ({
                                      ...prev,
                                      [job._id]: false,
                                    }));
                                    // Switch to history tab after successful creation
                                    setActivePaymentTab(job._id, "history");
                                    // Show success message
                                    toast.success(
                                      "Monthly payment record created successfully!"
                                    );
                                  }}
                                />
                              )}
                          </div>
                        )}

                        {/* History View with Enhanced Invoice Management */}
                        {activePaymentTabs[job._id] === "history" && (
                          <div>
                            {/* Management Instructions */}
                            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
                              <div className="flex items-start">
                                <SparklesIcon className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                                <div>
                                  <h4 className="text-sm font-medium text-indigo-800 mb-2">
                                    Invoice Management Features
                                  </h4>
                                  <ul className="text-sm text-indigo-700 space-y-1">
                                    <li className="flex items-center">
                                      <CheckIcon className="h-3 w-3 mr-2 text-indigo-500" />
                                      <strong>Edit Invoices:</strong> Click the
                                      "Edit" button on any invoice to modify
                                      details
                                    </li>
                                    <li className="flex items-center">
                                      <CheckIcon className="h-3 w-3 mr-2 text-indigo-500" />
                                      <strong>Add Invoices:</strong> Use "Add
                                      Invoice" to add new invoices to existing
                                      months
                                    </li>
                                    <li className="flex items-center">
                                      <CheckIcon className="h-3 w-3 mr-2 text-indigo-500" />
                                      <strong>Upload Documents:</strong> Use
                                      "Upload Document" for supporting files
                                    </li>
                                    <li className="flex items-center">
                                      <CheckIcon className="h-3 w-3 mr-2 text-indigo-500" />
                                      <strong>View Details:</strong> Click
                                      "View" to see invoice information in
                                      detail
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <EnhancedMonthlyPaymentHistory
                              jobId={job._id}
                              jobType={job.serviceType}
                              onUploadInvoice={handleUploadInvoice}
                              onInvoiceUpdate={() => {
                                // Callback for when invoices are updated
                                toast.success("Invoice updated successfully!");
                              }}
                              onInvoiceAdd={() => {
                                // Callback for when invoices are added
                                toast.success("Invoice added successfully!");
                              }}
                              onInvoiceDelete={() => {
                                // Callback for when invoices are deleted
                                toast.success("Invoice deleted successfully!");
                              }}
                            />
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ClientProfile;
