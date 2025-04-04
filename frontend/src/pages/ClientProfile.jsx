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
} from "@heroicons/react/24/outline";

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

  // Fetch timeline data when a service is expanded
  useEffect(() => {
    if (expandedService) {
      fetchJobTimeline(expandedService);
      // Also fetch the KYC status when a job is expanded
      fetchKycStatus(expandedService);
      fetchBraStatus(expandedService);
    }
  }, [expandedService]);

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

  // KYC status fetch function
  const fetchKycStatus = async (jobId) => {
    if (kycStatuses[jobId]) return;
    setLoadingKycStatuses((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await axiosInstance.get(`/kyc/jobs/${jobId}/status`);
      setKycStatuses((prev) => ({ ...prev, [jobId]: response.data }));
    } catch (err) {
      console.error(`Error fetching KYC status for job ${jobId}:`, err);
    } finally {
      setLoadingKycStatuses((prev) => ({ ...prev, [jobId]: false }));
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
              {/* Engagement Letters */}
              {company.engagementLetters && (
                <a
                  href={company.engagementLetters}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
                  <div className="p-5">
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                      </div>
                      <div className="ml-4">
                        <h5 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          Engagement Letters
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

              {/* CR Extract */}
              {company.crExtract && (
                <a
                  href={company.crExtract}
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
                          {company.crExtractExpiry &&
                            getExpiryStatus(company.crExtractExpiry)}
                        </div>
                        {company.crExtractExpiry && (
                          <p className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {new Date(
                              company.crExtractExpiry
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </a>
              )}

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

            {/* No documents message */}
            {!company.engagementLetters &&
              !company.companyComputerCard &&
              !company.taxCard &&
              !company.crExtract &&
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
              <h4 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
                KYC Documents
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-100 p-6 text-center">
              <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <DocumentDuplicateIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h5 className="text-base font-medium text-gray-700 mb-2">
                No KYC Documents
              </h5>
              <p className="text-sm text-gray-500">
                No KYC documents have been uploaded yet for this client.
              </p>
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

  // Helper functions for KYC Management display
  const getKYCStatusInfo = (kycData) => {
    if (!kycData.exists && kycData.jobStatus === "om_completed") {
      return {
        label: "Ready for KYC",
        color: "bg-blue-50 text-blue-700 ring-blue-600/20",
        icon: <ArrowPathIcon className="h-5 w-5 text-blue-500" />,
        description: "Operations completed. Ready to initialize KYC process.",
      };
    }
    if (!kycData.exists && kycData.jobStatus === "kyc_pending") {
      return {
        label: "LMRO Review Pending",
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
              to="/compliance"
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
                          <h4 className="text-base font-medium text-gray-900 mb-4">
                            Service Timeline
                          </h4>
                          <div className="flow-root">
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
                          </div>
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
                                    <span>LMRO</span>
                                    <span>DLMRO</span>
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

                              {/* KYC Documents Section */}
                              {kycStatuses[job._id].exists && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                                    KYC Documents
                                  </h5>
                                  <div className="space-y-3">
                                    {/* LMRO Document */}
                                    {kycStatuses[job._id].lmroApproval?.document
                                      ?.fileUrl && (
                                      <div className="group relative bg-blue-50 rounded-lg p-3 transition-all duration-200 hover:bg-blue-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                                              <UserGroupIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-blue-800">
                                              LMRO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-blue-700 flex items-center">
                                              {kycStatuses[job._id].lmroApproval
                                                .document.fileName ||
                                                "Document"}
                                              <span className="mx-1">•</span>
                                              {kycStatuses[job._id].lmroApproval
                                                .approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                kycStatuses[job._id]
                                                  .lmroApproval.document.fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* DLMRO Document */}
                                    {kycStatuses[job._id].dlmroApproval
                                      ?.document?.fileUrl && (
                                      <div className="group relative bg-purple-50 rounded-lg p-3 transition-all duration-200 hover:bg-purple-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-600">
                                              <ClipboardDocumentCheckIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-purple-800">
                                              DLMRO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-purple-700 flex items-center">
                                              {kycStatuses[job._id]
                                                .dlmroApproval.document
                                                .fileName || "Document"}
                                              <span className="mx-1">•</span>
                                              {kycStatuses[job._id]
                                                .dlmroApproval.approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                kycStatuses[job._id]
                                                  .dlmroApproval.document
                                                  .fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-purple-600 hover:text-purple-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* CEO Document */}
                                    {kycStatuses[job._id].ceoApproval?.document
                                      ?.fileUrl && (
                                      <div className="group relative bg-indigo-50 rounded-lg p-3 transition-all duration-200 hover:bg-indigo-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                                              <LockClosedIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-indigo-800">
                                              CEO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-indigo-700 flex items-center">
                                              {kycStatuses[job._id].ceoApproval
                                                .document.fileName ||
                                                "Document"}
                                              <span className="mx-1">•</span>
                                              {kycStatuses[job._id].ceoApproval
                                                .approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                kycStatuses[job._id].ceoApproval
                                                  .document.fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* No Documents Message */}
                                    {!kycStatuses[job._id].lmroApproval
                                      ?.document?.fileUrl &&
                                      !kycStatuses[job._id].dlmroApproval
                                        ?.document?.fileUrl &&
                                      !kycStatuses[job._id].ceoApproval
                                        ?.document?.fileUrl && (
                                        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
                                          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                          <p className="text-sm text-gray-500">
                                            No KYC documents have been uploaded
                                            yet.
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>
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
                                    <span>LMRO</span>
                                    <span>DLMRO</span>
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

                              {/* BRA Documents Section */}
                              {braStatuses[job._id].exists && (
                                <div>
                                  <h5 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-1.5 text-teal-600" />
                                    BRA Documents
                                  </h5>
                                  <div className="space-y-3">
                                    {/* LMRO Document */}
                                    {braStatuses[job._id].lmroApproval?.document
                                      ?.fileUrl && (
                                      <div className="group relative bg-teal-50 rounded-lg p-3 transition-all duration-200 hover:bg-teal-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 text-teal-600">
                                              <UserGroupIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-teal-800">
                                              LMRO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-teal-700 flex items-center">
                                              {braStatuses[job._id].lmroApproval
                                                .document.fileName ||
                                                "Document"}
                                              <span className="mx-1">•</span>
                                              {braStatuses[job._id].lmroApproval
                                                .approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                braStatuses[job._id]
                                                  .lmroApproval.document.fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-teal-600 hover:text-teal-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* DLMRO Document */}
                                    {braStatuses[job._id].dlmroApproval
                                      ?.document?.fileUrl && (
                                      <div className="group relative bg-purple-50 rounded-lg p-3 transition-all duration-200 hover:bg-purple-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-100 text-purple-600">
                                              <ClipboardDocumentCheckIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-purple-800">
                                              DLMRO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-purple-700 flex items-center">
                                              {braStatuses[job._id]
                                                .dlmroApproval.document
                                                .fileName || "Document"}
                                              <span className="mx-1">•</span>
                                              {braStatuses[job._id]
                                                .dlmroApproval.approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                braStatuses[job._id]
                                                  .dlmroApproval.document
                                                  .fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-purple-600 hover:text-purple-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* CEO Document */}
                                    {braStatuses[job._id].ceoApproval?.document
                                      ?.fileUrl && (
                                      <div className="group relative bg-indigo-50 rounded-lg p-3 transition-all duration-200 hover:bg-indigo-100">
                                        <div className="flex items-start">
                                          <div className="flex-shrink-0">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
                                              <LockClosedIcon className="h-5 w-5" />
                                            </span>
                                          </div>
                                          <div className="ml-3">
                                            <h6 className="text-sm font-medium text-indigo-800">
                                              CEO Document
                                            </h6>
                                            <p className="mt-1 text-xs text-indigo-700 flex items-center">
                                              {braStatuses[job._id].ceoApproval
                                                .document.fileName ||
                                                "Document"}
                                              <span className="mx-1">•</span>
                                              {braStatuses[job._id].ceoApproval
                                                .approved ? (
                                                <span className="inline-flex items-center text-green-700">
                                                  <CheckIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Approved
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center text-yellow-700">
                                                  <ClockIcon className="h-3 w-3 mr-0.5" />{" "}
                                                  Pending
                                                </span>
                                              )}
                                            </p>
                                            <a
                                              href={
                                                braStatuses[job._id].ceoApproval
                                                  .document.fileUrl
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="mt-1 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800"
                                            >
                                              <ArrowDownTrayIcon className="h-3.5 w-3.5 mr-1" />
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* No Documents Message */}
                                    {!braStatuses[job._id].lmroApproval
                                      ?.document?.fileUrl &&
                                      !braStatuses[job._id].dlmroApproval
                                        ?.document?.fileUrl &&
                                      !braStatuses[job._id].ceoApproval
                                        ?.document?.fileUrl && (
                                        <div className="text-center py-6 bg-gray-50/80 rounded-lg border border-gray-200">
                                          <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                          <p className="text-sm text-gray-500">
                                            No BRA documents have been uploaded
                                            yet.
                                          </p>
                                        </div>
                                      )}
                                  </div>
                                </div>
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
