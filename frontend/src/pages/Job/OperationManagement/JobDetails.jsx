import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  EnvelopeIcon,
  PencilIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  DocumentCheckIcon,
  LightBulbIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

function JobDetails() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  // Main state for the job
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [engagementLetter, setEngagementLetter] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Timeline state
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Action states
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState({
    type: null,
    message: null,
  }); // <-- Added closing parenthesis and semicolon here

  // Person details tabs
  const [activeTab, setActiveTab] = useState("company");

  // Edit mode state for company details
  const [editingCompanyDetails, setEditingCompanyDetails] = useState(false);
  const [originalCompanyDetails, setOriginalCompanyDetails] = useState(null);

  // KYC state
  const [kycDetails, setKycDetails] = useState({
    activeStatus: "yes",
    documents: [],
  });

  // Company details state
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    qfcNo: "",
    registeredAddress: "",
    incorporationDate: "",
    serviceType: "Please select",
    engagementLetters: null,
    mainPurpose: "",
    expiryDate: "",
    companyComputerCard: null,
    companyComputerCardExpiry: "",
    taxCard: null,
    taxCardExpiry: "",
    crExtract: null,
    crExtractExpiry: "",
    scopeOfLicense: null,
    scopeOfLicenseExpiry: "",
    articleOfAssociate: null,
    certificateOfIncorporate: null,
    kycActiveStatus: "yes",
  });

  // Person details states
  const [directorDetails, setDirectorDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    },
  ]);

  const [shareholderDetails, setShareholderDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    },
  ]);

  const [secretaryDetails, setSecretaryDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    },
  ]);

  const [sefDetails, setSefDetails] = useState([
    {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    },
  ]);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/jobs/${jobId}`);
        setJob(response.data);

        // Pre-populate company and director details with client data
        if (response.data) {
          setCompanyDetails((prevDetails) => ({
            ...prevDetails,
            ...response.data,
            incorporationDate: formatDateForInput(
              response.data.incorporationDate
            ),
            expiryDate: formatDateForInput(response.data.expiryDate),
            companyComputerCardExpiry: formatDateForInput(
              response.data.companyComputerCardExpiry
            ),
            taxCardExpiry: formatDateForInput(response.data.taxCardExpiry),
            crExtractExpiry: formatDateForInput(response.data.crExtractExpiry),
            scopeOfLicenseExpiry: formatDateForInput(
              response.data.scopeOfLicenseExpiry
            ),
          }));

          setDirectorDetails((prevForm) => [
            {
              ...prevForm[0],
              name: response.data.clientName || "",
              email: response.data.gmail || "",
            },
          ]);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.response?.data?.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    const fetchTimeline = async () => {
      try {
        setTimelineLoading(true);
        const response = await axiosInstance.get(`/jobs/${jobId}/timeline`);
        setTimeline(response.data);
      } catch (err) {
        console.error("Error fetching timeline:", err);
      } finally {
        setTimelineLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
      fetchTimeline();
    }
  }, [jobId]);

  // Add this utility function to JobDetails.jsx
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    // Handle both ISO strings and Date objects
    const date = new Date(dateString);
    // Check if date is valid before formatting
    if (isNaN(date.getTime())) return "";

    // Format as YYYY-MM-DD for HTML date inputs
    return date.toISOString().split("T")[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

  // Fetch company details
  // Enhance the useEffect that fetches company details
useEffect(() => {
  const fetchCompanyDetails = async () => {
    if (!jobId || !job) return;

    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/company-details`
      );

      // Log the raw response to check date formats
      console.log("Raw company details response:", response.data);

      // Process company details data
      const formattedDetails = {
        ...response.data,
        incorporationDate: formatDateForInput(response.data.incorporationDate),
        expiryDate: formatDateForInput(response.data.expiryDate),
        companyComputerCardExpiry: formatDateForInput(
          response.data.companyComputerCardExpiry
        ),
        taxCardExpiry: formatDateForInput(response.data.taxCardExpiry),
        crExtractExpiry: formatDateForInput(response.data.crExtractExpiry),
        scopeOfLicenseExpiry: formatDateForInput(
          response.data.scopeOfLicenseExpiry
        ),
      };

      // Log the formatted dates for debugging
      console.log(
        "Formatted incorporation date:",
        formattedDetails.incorporationDate
      );
      console.log("Formatted expiry date:", formattedDetails.expiryDate);

      setCompanyDetails((prevDetails) => ({
        ...prevDetails,
        ...formattedDetails,
      }));
    } catch (err) {
      console.error("Error fetching company details:", err);
    }
  };

  fetchCompanyDetails();
}, [jobId, job]);

  // Add this debugging code after setting companyDetails in the fetchCompanyDetails function
  useEffect(() => {
    if (companyDetails) {
      console.log("Current company details state:", companyDetails);
      console.log("Incorporation date:", companyDetails.incorporationDate);
      console.log("Expiry date:", companyDetails.expiryDate);
      console.log(
        "Right before render, incorporationDate:",
        companyDetails.incorporationDate
      );
      // Check other date fields as needed
    }
  }, [companyDetails]);

  // Enhance fetchPersonDetails function
  const fetchPersonDetails = async (personType, setStateFunction) => {
    if (!jobId) return;

    try {
      console.log(`Fetching ${personType} details for job ${jobId}`);
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/person-details/${personType}`
      );

      console.log(`Received ${personType} details:`, response.data);

      // Format dates for form inputs
      const formattedData = response.data.map((person) => ({
        ...person,
        qidExpiry: person.qidExpiry
          ? new Date(person.qidExpiry).toISOString().split("T")[0]
          : "",
        nationalAddressExpiry: person.nationalAddressExpiry
          ? new Date(person.nationalAddressExpiry).toISOString().split("T")[0]
          : "",
        passportExpiry: person.passportExpiry
          ? new Date(person.passportExpiry).toISOString().split("T")[0]
          : "",
      }));

      if (formattedData.length > 0) {
        console.log(`Setting ${personType} details with`, formattedData);
        setStateFunction(formattedData);

        // Check if this data was auto-populated
        const isAutoPopulated =
          job &&
          job.timeline?.some((event) =>
            event.description?.includes(`${personType} details auto-populated`)
          );

        // Show notification if data was auto-populated
        if (isAutoPopulated) {
          setActionMessage({
            type: "info",
            message: `${
              personType.charAt(0).toUpperCase() + personType.slice(1)
            } details were auto-populated from existing client records`,
          });
        }
      } else {
        console.log(`No ${personType} details received from API`);
      }
    } catch (err) {
      console.error(`Error fetching ${personType} details:`, err);
      // If no entries, the default empty state is already set
    }
  };

  // Update the useEffect hook for fetching person details
  useEffect(() => {
    if (activeTab === "director") {
      console.log("Fetching director details");
      fetchPersonDetails("director", setDirectorDetails);
    } else if (activeTab === "shareholder") {
      console.log("Fetching shareholder details");
      fetchPersonDetails("shareholder", setShareholderDetails);
    } else if (activeTab === "secretary") {
      console.log("Fetching secretary details");
      fetchPersonDetails("secretary", setSecretaryDetails);
    } else if (activeTab === "sef") {
      console.log("Fetching SEF details");
      fetchPersonDetails("sef", setSefDetails);
    } else if (activeTab === "kyc") {
      console.log("Fetching KYC details");
      fetchKycDetails();
    }
  }, [activeTab, jobId, job]); // Add job as a dependency to re-fetch when job data changes

  // Fetch KYC details
  const fetchKycDetails = async () => {
    if (!jobId) return;

    try {
      const response = await axiosInstance.get(
        `/operations/jobs/${jobId}/kyc-documents`
      );
      setKycDetails({
        activeStatus: response.data.activeStatus || "yes",
        documents: response.data.documents || [],
      });
    } catch (err) {
      console.error("Error fetching KYC details:", err);
    }
  };

  // File handling functions
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEngagementLetter(file);
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

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setEngagementLetter(file);
    }
  };

  const removeEngagementLetter = () => {
    setEngagementLetter(null);
  };

  // Update the handleUploadEngagementLetter function to inform the user about sharing
  const handleUploadEngagementLetter = async () => {
    if (!engagementLetter) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("engagementLetter", engagementLetter);

      const response = await axiosInstance.post(
        `/operations/jobs/${jobId}/engagement-letter`,
        formData
      );

      setActionMessage({
        type: "success",
        message:
          "Engagement letter uploaded successfully and will be shared across all jobs for this client",
      });

      // Refresh company details to reflect the upload
      if (response.data.engagementLetter) {
        setCompanyDetails((prev) => ({
          ...prev,
          engagementLetters: response.data.engagementLetter,
        }));
      }

      setEngagementLetter(null);

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 5000);
    } catch (err) {
      console.error("Error uploading engagement letter:", err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || "Failed to upload engagement letter",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Enter edit mode for Company Details form
  const handleEnterEditMode = () => {
    setOriginalCompanyDetails({ ...companyDetails });
    setEditingCompanyDetails(true);
  };

  // Cancel edit mode and restore original values
  const handleCancelEditMode = () => {
    setCompanyDetails(originalCompanyDetails);
    setEditingCompanyDetails(false);
  };

  // Company details form submission
  const handleSaveCompanyDetails = async () => {
    try {
      setSubmitting(true);

      const formData = new FormData();

      // Add text fields
      formData.append("companyName", companyDetails.companyName);
      formData.append("qfcNo", companyDetails.qfcNo);
      formData.append("registeredAddress", companyDetails.registeredAddress);
      formData.append("incorporationDate", companyDetails.incorporationDate);
      formData.append("serviceType", companyDetails.serviceType);
      formData.append("mainPurpose", companyDetails.mainPurpose);
      formData.append("expiryDate", companyDetails.expiryDate);
      formData.append("kycActiveStatus", companyDetails.kycActiveStatus);

      // By default, we want to sync changes across jobs
      formData.append("syncAcrossJobs", "true");

      // Add expiry dates
      if (companyDetails.companyComputerCardExpiry) {
        formData.append(
          "companyComputerCardExpiry",
          companyDetails.companyComputerCardExpiry
        );
      }
      if (companyDetails.taxCardExpiry) {
        formData.append("taxCardExpiry", companyDetails.taxCardExpiry);
      }
      if (companyDetails.crExtractExpiry) {
        formData.append("crExtractExpiry", companyDetails.crExtractExpiry);
      }
      if (companyDetails.scopeOfLicenseExpiry) {
        formData.append(
          "scopeOfLicenseExpiry",
          companyDetails.scopeOfLicenseExpiry
        );
      }

      // Add files if they exist and are File objects (not URLs)
      const fileFields = [
        "engagementLetters",
        "companyComputerCard",
        "taxCard",
        "crExtract",
        "scopeOfLicense",
        "articleOfAssociate",
        "certificateOfIncorporate",
      ];

      fileFields.forEach((field) => {
        if (companyDetails[field] && companyDetails[field] instanceof File) {
          formData.append(field, companyDetails[field]);
        }
      });

      // Send the update
      const response = await axiosInstance.put(
        `/operations/jobs/${jobId}/company-details`,
        formData
      );

      // Check if there was synchronization
      let successMessage = "Company details saved successfully";
      if (
        response.data &&
        response.data.syncResult &&
        response.data.syncResult.updatedRecords > 0
      ) {
        successMessage += ` and synchronized across ${response.data.syncResult.updatedRecords} other job(s) for this client`;
      }

      setActionMessage({
        type: "success",
        message: successMessage,
      });

      // Exit edit mode after successful save
      setEditingCompanyDetails(false);

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error saving company details:", err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || "Failed to save company details",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Save KYC Details
  const handleSaveKycDetails = async () => {
    try {
      setSubmitting(true);

      await axiosInstance.put(`/operations/jobs/${jobId}/kyc-documents`, {
        activeStatus: kycDetails.activeStatus,
      });

      setActionMessage({
        type: "success",
        message: "KYC status updated successfully",
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error updating KYC details:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to update KYC details",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Complete operation function
  const handleCompleteOperation = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.put(`/operations/jobs/${jobId}/complete`);

      setActionMessage({
        type: "success",
        message: "Operation marked as complete successfully",
      });

      // Refresh job data
      const response = await axiosInstance.get(`/jobs/${jobId}`);
      setJob(response.data);

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error completing operation:", err);
      setActionMessage({
        type: "error",
        message: err.response?.data?.message || "Failed to complete operation",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Company file handlers
  const handleCompanyFileChange = (field, file) => {
    setCompanyDetails((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  // Person details form handlers
  const handlePersonFileChange = (section, field, index, file) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: file,
      };
      return newDetails;
    });
  };

  const handlePersonDrop = (e, section, field, index) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePersonFileChange(section, field, index, file);
    }
  };

  const handleAddEntry = (section) => {
    const emptyEntry = {
      name: "",
      nationality: "",
      visaCopy: null,
      qidNo: "",
      qidDoc: null,
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressDoc: null,
      nationalAddressExpiry: "",
      passportNo: "",
      passportDoc: null,
      passportExpiry: "",
      mobileNo: "",
      email: "",
      cv: null,
    };

    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => [...prev, emptyEntry]);
  };

  const handleRemoveEntry = (section, index) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    updateState((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRenewDate = (section, field, index) => {
    const updateState = {
      director: setDirectorDetails,
      shareholder: setShareholderDetails,
      secretary: setSecretaryDetails,
      sef: setSefDetails,
    }[section];

    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 1);

    updateState((prev) => {
      const newDetails = [...prev];
      newDetails[index] = {
        ...newDetails[index],
        [field]: newDate.toISOString().split("T")[0],
      };
      return newDetails;
    });
  };

  // Save person details entry
  const handleSavePersonEntry = async (section, index) => {
    try {
      setSubmitting(true);

      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      const entry = details[index];

      // Create FormData for the request
      const formData = new FormData();

      // Add text fields
      formData.append("name", entry.name || "");
      formData.append("nationality", entry.nationality || "");
      formData.append("qidNo", entry.qidNo || "");
      formData.append("qidExpiry", entry.qidExpiry || "");
      formData.append("nationalAddress", entry.nationalAddress || "");
      formData.append(
        "nationalAddressExpiry",
        entry.nationalAddressExpiry || ""
      );
      formData.append("passportNo", entry.passportNo || "");
      formData.append("passportExpiry", entry.passportExpiry || "");
      formData.append("mobileNo", entry.mobileNo || "");
      formData.append("email", entry.email || "");

      // Add synchronization option - ALWAYS sync across jobs by default
      formData.append("syncAcrossJobs", "true");

      // Add file fields if they are File objects (not URLs)
      const fileFields = [
        "visaCopy",
        "qidDoc",
        "nationalAddressDoc",
        "passportDoc",
        "cv",
      ];

      fileFields.forEach((field) => {
        if (entry[field] && entry[field] instanceof File) {
          formData.append(field, entry[field]);
        }
      });

      let response;

      // Update or create entry based on whether _id exists
      if (entry._id) {
        // Update existing entry
        response = await axiosInstance.put(
          `/operations/jobs/${jobId}/person-details/${section}/${entry._id}`,
          formData
        );

        // Update the entry in state with returned data
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[section];

        updateState((prev) => {
          const newEntries = [...prev];
          // Keep file references in the UI state
          newEntries[index] = {
            ...response.data,
            visaCopy: response.data.visaCopy || entry.visaCopy,
            qidDoc: response.data.qidDoc || entry.qidDoc,
            nationalAddressDoc:
              response.data.nationalAddressDoc || entry.nationalAddressDoc,
            passportDoc: response.data.passportDoc || entry.passportDoc,
            cv: response.data.cv || entry.cv,
          };
          return newEntries;
        });

        // Show sync information if returned from API
        if (response.data.syncResult && response.data.syncResult.success) {
          setActionMessage({
            type: "success",
            message: `${
              section.charAt(0).toUpperCase() + section.slice(1)
            } details saved successfully and synchronized across ${
              response.data.syncResult.updatedRecords
            } other jobs for the same client.`,
          });

          // If we have a successful sync, refresh data for other tabs
          // This ensures the UI is updated with synchronized data
          if (response.data.syncResult.updatedRecords > 0) {
            // Refresh data for all person types to get updated synchronized data
            await Promise.all([
              fetchPersonDetails("director", setDirectorDetails),
              fetchPersonDetails("shareholder", setShareholderDetails),
              fetchPersonDetails("secretary", setSecretaryDetails),
              fetchPersonDetails("sef", setSefDetails),
            ]);
          }
        } else {
          setActionMessage({
            type: "success",
            message: `${
              section.charAt(0).toUpperCase() + section.slice(1)
            } details saved successfully.`,
          });
        }
      } else {
        // Create new entry
        response = await axiosInstance.post(
          `/operations/jobs/${jobId}/person-details/${section}`,
          formData
        );

        // Update the entry in state with returned data including _id
        const updateState = {
          director: setDirectorDetails,
          shareholder: setShareholderDetails,
          secretary: setSecretaryDetails,
          sef: setSefDetails,
        }[section];

        updateState((prev) => {
          const newEntries = [...prev];
          // Keep file references in the UI state
          newEntries[index] = {
            ...response.data,
            visaCopy: response.data.visaCopy || entry.visaCopy,
            qidDoc: response.data.qidDoc || entry.qidDoc,
            nationalAddressDoc:
              response.data.nationalAddressDoc || entry.nationalAddressDoc,
            passportDoc: response.data.passportDoc || entry.passportDoc,
            cv: response.data.cv || entry.cv,
          };
          return newEntries;
        });

        setActionMessage({
          type: "success",
          message: `${
            section.charAt(0).toUpperCase() + section.slice(1)
          } details saved successfully.`,
        });

        // After creating a new entry, refresh all person data
        // This ensures consistent data across tabs
        await Promise.all([
          fetchPersonDetails("director", setDirectorDetails),
          fetchPersonDetails("shareholder", setShareholderDetails),
          fetchPersonDetails("secretary", setSecretaryDetails),
          fetchPersonDetails("sef", setSefDetails),
        ]);
      }

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error saving ${section} details:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to save ${section} details`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add this right after the person details form but before the Add button
  const SyncInformationBox = ({ personType, gmail }) => {
    const [showSyncInfo, setShowSyncInfo] = useState(false);
    const [syncData, setSyncData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const checkInconsistencies = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `/clients/${gmail}/check-inconsistencies`
        );
        setSyncData(response.data);
        setShowSyncInfo(true);
      } catch (err) {
        console.error("Error checking inconsistencies:", err);
        setActionMessage({
          type: "error",
          message: "Failed to check for data inconsistencies",
        });
      } finally {
        setLoading(false);
      }
    };

    // New function to trigger manual synchronization
    const handleForceSync = async () => {
      try {
        setSyncing(true);

        // Call the sync API endpoint without specifying a source record
        // This will use the most recently updated record as the source of truth
        const response = await axiosInstance.post(
          `/clients/${gmail}/sync/${personType}`
        );

        if (response.data.success) {
          setActionMessage({
            type: "success",
            message: `Successfully synchronized ${response.data.updatedRecords} ${personType} records across all jobs for this client.`,
          });

          // Refresh all person details to reflect the changes
          await Promise.all([
            fetchPersonDetails("director", setDirectorDetails),
            fetchPersonDetails("shareholder", setShareholderDetails),
            fetchPersonDetails("secretary", setSecretaryDetails),
            fetchPersonDetails("sef", setSefDetails),
          ]);

          // Re-check inconsistencies
          await checkInconsistencies();
        } else {
          setActionMessage({
            type: "error",
            message: `Synchronization failed: ${response.data.message}`,
          });
        }
      } catch (err) {
        console.error("Error during forced synchronization:", err);
        setActionMessage({
          type: "error",
          message:
            err.response?.data?.message || "Failed to synchronize records",
        });
      } finally {
        setSyncing(false);

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    };

    if (!gmail) return null;

    return (
      <div className="mt-4 border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-sm font-medium text-indigo-800">
              Client Data Synchronization
            </h3>
          </div>
          {!showSyncInfo ? (
            <button
              onClick={checkInconsistencies}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-indigo-600 rounded-full"></span>{" "}
                  Checking...
                </>
              ) : (
                <>
                  View Details
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSyncInfo(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Hide Details
              <ChevronUpIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {showSyncInfo && syncData && (
          <div className="mt-3 text-sm">
            {syncData.records[personType] > 1 ? (
              <div>
                <p className="text-indigo-800">
                  <strong>Found {syncData.records[personType]} records</strong>{" "}
                  for this {personType} across different jobs for the same
                  client.
                </p>

                {syncData.hasInconsistencies &&
                  syncData.inconsistencies[personType] && (
                    <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="font-medium text-yellow-800">
                        Inconsistencies detected:
                      </p>
                      <ul className="mt-1 list-disc pl-5 space-y-1 text-yellow-700">
                        {Object.entries(
                          syncData.inconsistencies[personType]
                        ).map(([field, values]) => (
                          <li key={field}>
                            <strong>{field}:</strong> has {values.length}{" "}
                            different values ({values.join(", ")})
                          </li>
                        ))}
                      </ul>

                      {/* New Force Sync button */}
                      <div className="mt-3">
                        <button
                          onClick={handleForceSync}
                          disabled={syncing}
                          className={`px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors ${
                            syncing ? "opacity-70 cursor-not-allowed" : ""
                          }`}
                        >
                          {syncing ? (
                            <span className="flex items-center">
                              <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-white rounded-full"></span>{" "}
                              Synchronizing...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <ArrowPathIcon className="h-4 w-4 mr-1" />
                              Force Synchronization
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                <p className="mt-2 text-indigo-700">
                  Changes to this form will be automatically synchronized across
                  all jobs for this client.
                </p>
              </div>
            ) : (
              <p className="text-indigo-700">
                There is only one {personType} record for this client. No
                synchronization needed.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // CompanySyncInformationBox component for JobDetails.jsx
  const CompanySyncInformationBox = ({ gmail }) => {
    const [showSyncInfo, setShowSyncInfo] = useState(false);
    const [syncData, setSyncData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const checkCompanyDetails = async () => {
      try {
        setLoading(true);

        // Call the dedicated endpoint to check company details status
        const response = await axiosInstance.get(
          `/clients/${gmail}/company-details-status`
        );

        if (response.data) {
          setSyncData(response.data);
        } else {
          setSyncData({
            totalJobs: 0,
            jobsWithCompanyDetails: 0,
            hasMultipleJobs: false,
          });
        }

        setShowSyncInfo(true);
      } catch (err) {
        console.error("Error checking company details:", err);
        setActionMessage({
          type: "error",
          message: "Failed to check for company details across jobs",
        });
      } finally {
        setLoading(false);
      }
    };

    // Function to trigger manual synchronization of company details
    const handleForceSync = async () => {
      try {
        setSyncing(true);

        // Call the updateCompanyDetails endpoint with syncAcrossJobs=true
        const formData = new FormData();
        formData.append("syncAcrossJobs", "true");

        // We're just triggering a sync with current values, not changing anything
        const response = await axiosInstance.put(
          `/operations/jobs/${jobId}/company-details`,
          formData
        );

        if (
          response.data &&
          response.data.syncResult &&
          response.data.syncResult.success
        ) {
          setActionMessage({
            type: "success",
            message: `Successfully synchronized company details across ${response.data.syncResult.updatedRecords} job(s) for this client.`,
          });

          // Refresh company details
          const companyResponse = await axiosInstance.get(
            `/operations/jobs/${jobId}/company-details`
          );
          setCompanyDetails(companyResponse.data);

          // Re-check company details
          await checkCompanyDetails();
        } else {
          setActionMessage({
            type: "info",
            message:
              "No synchronization needed or no other jobs found for this client.",
          });
        }
      } catch (err) {
        console.error("Error during company details synchronization:", err);
        setActionMessage({
          type: "error",
          message:
            err.response?.data?.message ||
            "Failed to synchronize company details",
        });
      } finally {
        setSyncing(false);

        setTimeout(() => {
          setActionMessage({ type: null, message: null });
        }, 3000);
      }
    };

    if (!gmail) return null;

    return (
      <div className="mt-4 border border-indigo-100 rounded-lg p-4 bg-indigo-50/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-sm font-medium text-indigo-800">
              Company Data Synchronization
            </h3>
          </div>
          {!showSyncInfo ? (
            <button
              onClick={checkCompanyDetails}
              disabled={loading}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-indigo-600 rounded-full"></span>{" "}
                  Checking...
                </>
              ) : (
                <>
                  View Details
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowSyncInfo(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              Hide Details
              <ChevronUpIcon className="h-4 w-4 ml-1" />
            </button>
          )}
        </div>

        {showSyncInfo && syncData && (
          <div className="mt-3 text-sm">
            {syncData.hasMultipleJobs ? (
              <div>
                <p className="text-indigo-800">
                  <strong>Found {syncData.totalJobs} job(s)</strong> for this
                  client, with {syncData.jobsWithCompanyDetails} having company
                  details.
                </p>

                <p className="mt-2 text-indigo-700">
                  Changes to company details will be automatically synchronized
                  across all jobs for this client.
                </p>

                {/* Force sync button */}
                <div className="mt-3">
                  <button
                    onClick={handleForceSync}
                    disabled={syncing}
                    className={`px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors ${
                      syncing ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {syncing ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-1 border-b-2 border-white rounded-full"></span>{" "}
                        Synchronizing...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Force Synchronization
                      </span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-indigo-700">
                This is the only job for this client. No synchronization needed.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Bulk update all entries of a person type
  const handleBulkUpdatePersonEntries = async (section) => {
    try {
      setSubmitting(true);

      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      // Create FormData
      const formData = new FormData();

      // Add entries as JSON
      formData.append(
        "entries",
        JSON.stringify(
          details.map((entry) => ({
            _id: entry._id, // Include _id for existing entries
            name: entry.name || "",
            nationality: entry.nationality || "",
            qidNo: entry.qidNo || "",
            qidExpiry: entry.qidExpiry || "",
            nationalAddress: entry.nationalAddress || "",
            nationalAddressExpiry: entry.nationalAddressExpiry || "",
            passportNo: entry.passportNo || "",
            passportExpiry: entry.passportExpiry || "",
            mobileNo: entry.mobileNo || "",
            email: entry.email || "",
          }))
        )
      );

      // Add files with proper naming pattern
      details.forEach((entry, index) => {
        const fileFields = [
          "visaCopy",
          "qidDoc",
          "nationalAddressDoc",
          "passportDoc",
          "cv",
        ];

        fileFields.forEach((field) => {
          if (entry[field] && entry[field] instanceof File) {
            formData.append(`entry${index}_${field}`, entry[field]);
          }
        });
      });

      // Send bulk update request
      const response = await axiosInstance.post(
        `/operations/jobs/${jobId}/bulk-update/${section}`,
        formData
      );

      // Update state with response data
      const updateState = {
        director: setDirectorDetails,
        shareholder: setShareholderDetails,
        secretary: setSecretaryDetails,
        sef: setSefDetails,
      }[section];

      // Keep file references in the UI state
      updateState((prev) => {
        return response.data.map((updatedEntry, index) => {
          const originalEntry = prev[index] || {};
          return {
            ...updatedEntry,
            visaCopy: updatedEntry.visaCopy || originalEntry.visaCopy,
            qidDoc: updatedEntry.qidDoc || originalEntry.qidDoc,
            nationalAddressDoc:
              updatedEntry.nationalAddressDoc ||
              originalEntry.nationalAddressDoc,
            passportDoc: updatedEntry.passportDoc || originalEntry.passportDoc,
            cv: updatedEntry.cv || originalEntry.cv,
          };
        });
      });

      setActionMessage({
        type: "success",
        message: `All ${section} entries saved successfully`,
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error saving ${section} entries:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to save ${section} entries`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete person entry
  const handleDeletePersonEntry = async (section, index) => {
    try {
      const details = {
        director: directorDetails,
        shareholder: shareholderDetails,
        secretary: secretaryDetails,
        sef: sefDetails,
      }[section];

      const entry = details[index];

      // Only call API if entry has an _id (exists in database)
      if (entry._id) {
        await axiosInstance.delete(
          `/operations/jobs/${jobId}/person-details/${section}/${entry._id}`
        );
      }

      // Remove from state
      handleRemoveEntry(section, index);

      setActionMessage({
        type: "success",
        message: `${
          section.charAt(0).toUpperCase() + section.slice(1)
        } entry removed successfully`,
      });

      setTimeout(() => {
        setActionMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error(`Error deleting ${section} entry:`, err);
      setActionMessage({
        type: "error",
        message:
          err.response?.data?.message || `Failed to delete ${section} entry`,
      });
    }
  };

  // Render person details form
  const renderPersonDetails = (section, details, setDetails) => (
    <div className="space-y-6">
      {/* Add this at the top of your component's return statement */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes("auto-populated")
        ) && (
          <div className="sticky top-0 z-50 bg-blue-100 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <InformationCircleIcon
                  className="h-5 w-5 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Some information has been auto-populated from other jobs for
                  the same client ({job.gmail}).
                </p>
              </div>
            </div>
          </div>
        )}

      {details.map((entry, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <div className="bg-indigo-100 rounded-lg p-2 mr-3">
                <UserIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Entry {index + 1}
                </h3>
                {/* Auto-populated badge */}
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) && (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      Auto-populated
                    </span>
                  )}
              </div>
            </div>
            {details.length > 1 && (
              <button
                onClick={() => handleDeletePersonEntry(section, index)}
                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Remove entry"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Name
                {/* Pre-filled indicator */}
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.name && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="text"
                value={entry.name}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].name = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.name
                    ? "bg-indigo-50 border-indigo-300" // Highlight auto-populated fields
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Nationality
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="text"
                value={entry.nationality}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].nationality = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationality
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter nationality"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Visa Copy
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.visaCopy && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.visaCopy
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "visaCopy", index)}
              >
                {entry.visaCopy ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.visaCopy instanceof File
                            ? entry.visaCopy.name
                            : "Visa Copy Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.visaCopy === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {typeof entry.visaCopy === "string" && (
                        <a
                          href={entry.visaCopy}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      <button
                        onClick={() =>
                          handlePersonFileChange(
                            section,
                            "visaCopy",
                            index,
                            null
                          )
                        }
                        className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                        title="Remove document"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Choose File
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "visaCopy",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your Visa Copy document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <UserIcon className="h-4 w-4 mr-1 text-indigo-500" />
                QID Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.qidNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Number
                  </label>
                  <input
                    type="text"
                    placeholder="QID Number"
                    value={entry.qidNo}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].qidNo = e.target.value;
                      setDetails(newDetails);
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.qidNo
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={entry.qidExpiry}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index].qidExpiry = e.target.value;
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.qidExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "qidExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    QID Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.qidDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "qidDoc", index)
                    }
                  >
                    {entry.qidDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.qidDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center">
                          {typeof entry.qidDoc === "string" && (
                            <a
                              href={entry.qidDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() =>
                              handlePersonFileChange(
                                section,
                                "qidDoc",
                                index,
                                null
                              )
                            }
                            className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Remove document"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload QID</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "qidDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1 text-indigo-500" />
                National Address
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.nationalAddress && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div
                    className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                      isDragging
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : entry.nationalAddressDoc
                        ? "border-green-400 bg-green-50/40 shadow-md"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "nationalAddressDoc", index)
                    }
                  >
                    {entry.nationalAddressDoc ? (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block">
                              {entry.nationalAddressDoc instanceof File
                                ? entry.nationalAddressDoc.name
                                : "National Address Document"}
                            </span>
                            <span className="text-xs text-green-600 flex items-center">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />{" "}
                              Uploaded
                              {job &&
                                job.timeline?.some((event) =>
                                  event.description?.includes(
                                    `${section} details auto-populated`
                                  )
                                ) &&
                                typeof entry.nationalAddressDoc ===
                                  "string" && (
                                  <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                    Auto-filled
                                  </span>
                                )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center ml-4">
                          {typeof entry.nationalAddressDoc === "string" && (
                            <a
                              href={entry.nationalAddressDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View Document
                            </a>
                          )}
                          <button
                            onClick={() =>
                              handlePersonFileChange(
                                section,
                                "nationalAddressDoc",
                                index,
                                null
                              )
                            }
                            className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Remove document"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="bg-gray-100/80 mx-auto rounded-full w-12 h-12 flex items-center justify-center mb-2">
                          <CloudArrowUpIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="mt-1">
                          <label className="cursor-pointer block">
                            <span className="relative px-4 py-1.5 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                              Upload Address Document
                            </span>
                            <input
                              type="file"
                              className="sr-only"
                              onChange={(e) =>
                                handlePersonFileChange(
                                  section,
                                  "nationalAddressDoc",
                                  index,
                                  e.target.files[0]
                                )
                              }
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">
                            or drag and drop here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-full space-y-1">
                    <label className="block text-xs text-gray-500">
                      Expiry Date
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={entry.nationalAddressExpiry}
                        onChange={(e) => {
                          const newDetails = [...details];
                          newDetails[index].nationalAddressExpiry =
                            e.target.value;
                          setDetails(newDetails);
                        }}
                        className={`block w-full rounded-lg ${
                          job &&
                          job.timeline?.some((event) =>
                            event.description?.includes(
                              `${section} details auto-populated`
                            )
                          ) &&
                          entry.nationalAddressExpiry
                            ? "bg-indigo-50 border-indigo-300"
                            : "border-gray-300"
                        } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                      />
                      <button
                        onClick={() =>
                          handleRenewDate(
                            section,
                            "nationalAddressExpiry",
                            index
                          )
                        }
                        className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Renew for one year"
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passport Document - Compact Beautiful Card */}
            <div className="col-span-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 rounded-lg border border-indigo-100/50">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                <DocumentDuplicateIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Passport Details
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.passportNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Number
                  </label>
                  <input
                    type="text"
                    placeholder="Passport Number"
                    value={entry.passportNo}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].passportNo = e.target.value;
                      setDetails(newDetails);
                    }}
                    className={`block w-full rounded-lg ${
                      job &&
                      job.timeline?.some((event) =>
                        event.description?.includes(
                          `${section} details auto-populated`
                        )
                      ) &&
                      entry.passportNo
                        ? "bg-indigo-50 border-indigo-300"
                        : "border-gray-300"
                    } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Expiry Date
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={entry.passportExpiry}
                      onChange={(e) => {
                        const newDetails = [...details];
                        newDetails[index].passportExpiry = e.target.value;
                        setDetails(newDetails);
                      }}
                      className={`block w-full rounded-lg ${
                        job &&
                        job.timeline?.some((event) =>
                          event.description?.includes(
                            `${section} details auto-populated`
                          )
                        ) &&
                        entry.passportExpiry
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-300"
                      } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                    />
                    <button
                      onClick={() =>
                        handleRenewDate(section, "passportExpiry", index)
                      }
                      className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Renew for one year"
                    >
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Passport Document
                  </label>
                  <div
                    className={`border-2 rounded-lg p-2 h-10 flex items-center justify-center transition-all duration-300 ${
                      entry.passportDoc
                        ? "border-green-400 bg-green-50/40 shadow-sm"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) =>
                      handlePersonDrop(e, section, "passportDoc", index)
                    }
                  >
                    {entry.passportDoc ? (
                      <div className="flex items-center justify-between w-full px-2">
                        <div className="flex items-center text-xs text-green-600">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.passportDoc === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </div>
                        <div className="flex items-center">
                          {typeof entry.passportDoc === "string" && (
                            <a
                              href={entry.passportDoc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() =>
                              handlePersonFileChange(
                                section,
                                "passportDoc",
                                index,
                                null
                              )
                            }
                            className="p-0.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                            title="Remove document"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="cursor-pointer text-center block w-full">
                        <div className="flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-colors">
                          <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Upload Passport</span>
                        </div>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "passportDoc",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Mobile Number
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.mobileNo && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="tel"
                value={entry.mobileNo}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].mobileNo = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.mobileNo
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.email && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <input
                type="email"
                value={entry.email}
                onChange={(e) => {
                  const newDetails = [...details];
                  newDetails[index].email = e.target.value;
                  setDetails(newDetails);
                }}
                className={`mt-1 block w-full rounded-lg ${
                  job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.email
                    ? "bg-indigo-50 border-indigo-300"
                    : "border-gray-300"
                } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
                placeholder="Enter email address"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-500" />
                Curriculum Vitae (CV)
                {job &&
                  job.timeline?.some((event) =>
                    event.description?.includes(
                      `${section} details auto-populated`
                    )
                  ) &&
                  entry.cv && (
                    <span className="ml-2 text-xs text-indigo-600">
                      <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
                    </span>
                  )}
              </label>
              <div
                className={`border-2 rounded-lg p-3 transition-all duration-300 ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                    : entry.cv
                    ? "border-green-400 bg-green-50/40 shadow-md"
                    : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handlePersonDrop(e, section, "cv", index)}
              >
                {entry.cv ? (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate block">
                          {entry.cv instanceof File
                            ? entry.cv.name
                            : "CV Document"}
                        </span>
                        <span className="text-xs text-green-600 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-1" /> Uploaded
                          {job &&
                            job.timeline?.some((event) =>
                              event.description?.includes(
                                `${section} details auto-populated`
                              )
                            ) &&
                            typeof entry.cv === "string" && (
                              <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-xs">
                                Auto-filled
                              </span>
                            )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {typeof entry.cv === "string" && (
                        <a
                          href={entry.cv}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      )}
                      <button
                        onClick={() =>
                          handlePersonFileChange(section, "cv", index, null)
                        }
                        className="p-1.5 text-red-400 hover:text-white hover:bg-red-500 rounded-lg hover:shadow-md transition-all duration-200"
                        title="Remove document"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="bg-gray-100/80 mx-auto rounded-full w-14 h-14 flex items-center justify-center mb-2">
                      <CloudArrowUpIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <div className="mt-2">
                      <label className="cursor-pointer block">
                        <span className="relative px-4 py-2 rounded-md font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-sm transition-all duration-200 hover:shadow-md">
                          Upload CV
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          onChange={(e) =>
                            handlePersonFileChange(
                              section,
                              "cv",
                              index,
                              e.target.files[0]
                            )
                          }
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        or drag and drop your CV document here
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => handleSavePersonEntry(section, index)}
              disabled={submitting}
              className={`px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Information note about changes affecting only current job */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes(`${section} details auto-populated`)
        ) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 flex items-start">
              <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" />
              <span>
                Changes made to these details will only affect this specific
                job. The original data used for auto-population remains
                unchanged for other jobs.
              </span>
            </p>
          </div>
        )}

      {/* Add synchronization information box for person data */}
      {job && job.gmail && (
        <SyncInformationBox personType={section} gmail={job.gmail} />
      )}

      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => handleAddEntry(section)}
          className="inline-flex items-center px-5 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105"
        >
          <PencilIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Add Another Entry
        </button>
      </div>
    </div>
  );

  const renderCompanyDetailsSection = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">a. Company Details</h3>
        <div className="flex items-center gap-2">
          {companyDetails && companyDetails.companyName && (
            <div className="flex items-center text-sm text-indigo-600">
              <CheckCircleIcon className="h-5 w-5 mr-1" />
              <span>Pre-filled from records</span>
            </div>
          )}

          {/* Edit mode toggle */}
          {!editingCompanyDetails ? (
            <button
              onClick={handleEnterEditMode}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
          ) : (
            <button
              onClick={handleCancelEditMode}
              className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancel
            </button>
          )}
        </div>
      </div>
      {/* Add the synchronization component */}
      {job && job.gmail && <CompanySyncInformationBox gmail={job.gmail} />}
      {/* Auto-population notification */}
      {job &&
        job.timeline?.some((event) =>
          event.description?.includes("Company details auto-populated")
        ) && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-1 flex-shrink-0 mt-0.5" />
              These fields have been auto-filled with existing company data from
              another job for this client. Any changes you make will be
              synchronized across all jobs for this client.
            </p>
          </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            Company Name
            {companyDetails.companyName && !editingCompanyDetails && (
              <span className="ml-2 text-xs text-indigo-600">
                <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
              </span>
            )}
          </label>
          <input
            type="text"
            value={companyDetails.companyName}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                companyName: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              companyDetails.companyName && !editingCompanyDetails
                ? "bg-indigo-50 border-indigo-300"
                : ""
            }`}
            placeholder="Enter company name"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            QFC NO
            {companyDetails.qfcNo && !editingCompanyDetails && (
              <span className="ml-2 text-xs text-indigo-600">
                <CheckCircleIcon className="h-4 w-4 inline" /> Pre-filled
              </span>
            )}
          </label>
          <input
            type="text"
            value={companyDetails.qfcNo}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                qfcNo: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              companyDetails.qfcNo && !editingCompanyDetails
                ? "bg-indigo-50 border-indigo-300"
                : ""
            }`}
            placeholder="Enter QFC number"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registered Address
          </label>
          <input
            type="text"
            value={companyDetails.registeredAddress}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                registeredAddress: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            placeholder="Enter registered address"
            readOnly={!editingCompanyDetails}
          />
        </div>

        {/* Fix for Incorporation Date input */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Incorporation Date
            {companyDetails.incorporationDate
              ? ` (Value: ${companyDetails.incorporationDate})`
              : " (Empty)"}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={companyDetails.incorporationDate || ""}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  incorporationDate: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    incorporationDate: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Services types (1)
          </label>
          <select
            value={companyDetails.serviceType}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                serviceType: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            disabled={!editingCompanyDetails}
          >
            <option value="Please select">Please select</option>
            <option value="Accounting">Accounting</option>
            <option value="Tax">Tax</option>
            <option value="Audit">Audit</option>
            <option value="Advisory">Advisory</option>
            <option value="Consulting">Consulting</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Engagement Letters
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              isDragging && editingCompanyDetails
                ? "border-indigo-500 bg-indigo-50"
                : companyDetails.engagementLetters
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file)
                setCompanyDetails({
                  ...companyDetails,
                  engagementLetters: file,
                });
            }}
          >
            {companyDetails.engagementLetters ? (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">
                    {companyDetails.engagementLetters instanceof File
                      ? companyDetails.engagementLetters.name
                      : "Engagement Letter Document"}
                  </span>
                </div>

                {editingCompanyDetails && (
                  <button
                    onClick={() =>
                      setCompanyDetails({
                        ...companyDetails,
                        engagementLetters: null,
                      })
                    }
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
                <div className="mt-2">
                  <span className="text-xs text-gray-500 block">
                    (attached sign letters)
                  </span>
                  {editingCompanyDetails ? (
                    <label className="cursor-pointer block mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      Upload file
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          handleCompanyFileChange(
                            "engagementLetters",
                            e.target.files?.[0]
                          )
                        }
                      />
                    </label>
                  ) : (
                    <span className="block mt-1 text-sm text-gray-500">
                      No document uploaded
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main purpose
          </label>
          <input
            type="text"
            value={companyDetails.mainPurpose}
            onChange={(e) =>
              setCompanyDetails({
                ...companyDetails,
                mainPurpose: e.target.value,
              })
            }
            className={`block w-full rounded-lg ${
              editingCompanyDetails
                ? "border-indigo-500 ring-1 ring-indigo-500"
                : "border-gray-300"
            } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
            placeholder="Enter main purpose"
            readOnly={!editingCompanyDetails}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={companyDetails.expiryDate}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  expiryDate: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    expiryDate: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Documents with expiry dates */}
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Company Computer card
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.companyComputerCard
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange("companyComputerCard", file);
            }}
          >
            {companyDetails.companyComputerCard ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-xs text-gray-900 font-medium truncate max-w-[120px]">
                    {companyDetails.companyComputerCard instanceof File
                      ? companyDetails.companyComputerCard.name
                      : "Computer Card Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.companyComputerCard === "string" && (
                    <a
                      href={companyDetails.companyComputerCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() =>
                        handleCompanyFileChange("companyComputerCard", null)
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(
                          "companyComputerCard",
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <span className="text-xs text-gray-500">No document</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="date"
              value={companyDetails.companyComputerCardExpiry}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  companyComputerCardExpiry: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    companyComputerCardExpiry: newDate
                      .toISOString()
                      .split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Tax card
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.taxCard
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange("taxCard", file);
            }}
          >
            {companyDetails.taxCard ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-xs text-gray-900 font-medium truncate max-w-[120px]">
                    {companyDetails.taxCard instanceof File
                      ? companyDetails.taxCard.name
                      : "Tax Card Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.taxCard === "string" && (
                    <a
                      href={companyDetails.taxCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() => handleCompanyFileChange("taxCard", null)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange("taxCard", e.target.files?.[0])
                      }
                    />
                  </label>
                ) : (
                  <span className="text-xs text-gray-500">No document</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="date"
              value={companyDetails.taxCardExpiry}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  taxCardExpiry: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    taxCardExpiry: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            CR Extract
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.crExtract
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange("crExtract", file);
            }}
          >
            {companyDetails.crExtract ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-xs text-gray-900 font-medium truncate max-w-[120px]">
                    {companyDetails.crExtract instanceof File
                      ? companyDetails.crExtract.name
                      : "CR Extract Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.crExtract === "string" && (
                    <a
                      href={companyDetails.crExtract}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() => handleCompanyFileChange("crExtract", null)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(
                          "crExtract",
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <span className="text-xs text-gray-500">No document</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="date"
              value={companyDetails.crExtractExpiry}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  crExtractExpiry: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    crExtractExpiry: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Scope of License
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.scopeOfLicense
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange("scopeOfLicense", file);
            }}
          >
            {companyDetails.scopeOfLicense ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-xs text-gray-900 font-medium truncate max-w-[120px]">
                    {companyDetails.scopeOfLicense instanceof File
                      ? companyDetails.scopeOfLicense.name
                      : "Scope of License Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.scopeOfLicense === "string" && (
                    <a
                      href={companyDetails.scopeOfLicense}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() =>
                        handleCompanyFileChange("scopeOfLicense", null)
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(
                          "scopeOfLicense",
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <span className="text-xs text-gray-500">No document</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date
          </label>
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="date"
              value={companyDetails.scopeOfLicenseExpiry}
              onChange={(e) =>
                setCompanyDetails({
                  ...companyDetails,
                  scopeOfLicenseExpiry: e.target.value,
                })
              }
              className={`block w-full rounded-lg ${
                editingCompanyDetails
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-gray-300"
              } shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors`}
              disabled={!editingCompanyDetails}
            />
            {editingCompanyDetails && (
              <button
                onClick={() => {
                  const newDate = new Date();
                  newDate.setFullYear(newDate.getFullYear() + 1);
                  setCompanyDetails({
                    ...companyDetails,
                    scopeOfLicenseExpiry: newDate.toISOString().split("T")[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                title="Renew date"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-5">
          <label className="block text-sm font-medium text-gray-700">
            Article of Associate (AOA)
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.articleOfAssociate
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleCompanyFileChange("articleOfAssociate", file);
            }}
          >
            {companyDetails.articleOfAssociate ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">
                    {companyDetails.articleOfAssociate instanceof File
                      ? companyDetails.articleOfAssociate.name
                      : "Article of Associate Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.articleOfAssociate === "string" && (
                    <a
                      href={companyDetails.articleOfAssociate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View Document
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() =>
                        handleCompanyFileChange("articleOfAssociate", null)
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload AOA Document
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(
                          "articleOfAssociate",
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <span className="text-sm text-gray-500">
                    No document uploaded
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-5 items-center bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
        <div className="col-span-5">
          <label className="block text-sm font-medium text-gray-700">
            Certificate of Incorporate (COI)
          </label>
          <div
            className={`mt-1 border-2 border-dashed rounded-lg p-2 transition-colors ${
              companyDetails.certificateOfIncorporate
                ? "border-green-500 bg-green-50"
                : editingCompanyDetails
                ? "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                : "border-gray-300"
            }`}
            onDragOver={editingCompanyDetails ? handleDragOver : undefined}
            onDragLeave={editingCompanyDetails ? handleDragLeave : undefined}
            onDrop={(e) => {
              if (!editingCompanyDetails) return;
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file)
                handleCompanyFileChange("certificateOfIncorporate", file);
            }}
          >
            {companyDetails.certificateOfIncorporate ? (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm text-gray-900 font-medium">
                    {companyDetails.certificateOfIncorporate instanceof File
                      ? companyDetails.certificateOfIncorporate.name
                      : "Certificate of Incorporate Document"}
                  </span>
                </div>
                <div className="flex items-center">
                  {typeof companyDetails.certificateOfIncorporate ===
                    "string" && (
                    <a
                      href={companyDetails.certificateOfIncorporate}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-2 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                    >
                      View Document
                    </a>
                  )}
                  {editingCompanyDetails && (
                    <button
                      onClick={() =>
                        handleCompanyFileChange(
                          "certificateOfIncorporate",
                          null
                        )
                      }
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-xs text-gray-500 block">
                  (attached document)
                </span>
                {editingCompanyDetails ? (
                  <label className="cursor-pointer block mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Upload COI Document
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) =>
                        handleCompanyFileChange(
                          "certificateOfIncorporate",
                          e.target.files?.[0]
                        )
                      }
                    />
                  </label>
                ) : (
                  <span className="text-sm text-gray-500">
                    No document uploaded
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {companyDetails &&
        (companyDetails.companyName || companyDetails.qfcNo) && (
          <div className="mt-6 mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <InformationCircleIcon className="h-5 w-5 inline mr-1" />
              These fields have been pre-filled with existing company data.{" "}
              {editingCompanyDetails
                ? "You are currently in edit mode."
                : "Click the Edit button to modify values if needed."}
            </p>
          </div>
        )}
      {/* Save buttons - only shown in edit mode */}
      {editingCompanyDetails && (
        <div className="mt-8 flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancelEditMode}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCompanyDetails}
            disabled={submitting}
            className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? (
              <>
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      )}
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "om_completed":
      case "approved":
        return "bg-green-50 text-green-700 ring-green-600/20";
      case "rejected":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "pending":
        return "bg-yellow-50 text-yellow-700 ring-yellow-600/20";
      case "corrected":
        return "bg-purple-50 text-purple-700 ring-purple-600/20";
      case "cancelled":
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-600/20";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "om_completed":
      case "approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case "pending":
      case "in-progress":
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const tabs = [
    {
      id: "company",
      name: "Company Details",
      icon: <BuildingOfficeIcon className="h-4 w-4" />,
    },
    {
      id: "director",
      name: "Director Details",
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      id: "shareholder",
      name: "Shareholder Details",
      icon: <BriefcaseIcon className="h-4 w-4" />,
    },
    {
      id: "secretary",
      name: "Secretary Details",
      icon: <DocumentDuplicateIcon className="h-4 w-4" />,
    },
    {
      id: "sef",
      name: "SEF Details",
      icon: <LightBulbIcon className="h-4 w-4" />,
    },
    {
      id: "kyc",
      name: "Signed KYC",
      icon: <ShieldCheckIcon className="h-4 w-4" />,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading job details
          </h2>
          <p className="text-gray-600">
            Please wait while we fetch the information...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Job
          </h2>
          <p className="mt-2 text-gray-600 mb-8">{error}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/operation-management")}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
            >
              Back to Jobs
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Job not found state
  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="bg-yellow-100 p-4 rounded-full inline-flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h2>
          <p className="mt-2 text-gray-600 mb-8">
            The requested job could not be found or you don't have access.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate("/operation-management")}
              className="px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {actionMessage.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl ${
                actionMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : actionMessage.type === "error"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              <div className="flex items-center">
                {actionMessage.type === "success" ? (
                  <CheckCircleIcon className="h-6 w-6 mr-3" />
                ) : actionMessage.type === "error" ? (
                  <ExclamationTriangleIcon className="h-6 w-6 mr-3" />
                ) : (
                  <InformationCircleIcon className="h-6 w-6 mr-3" />
                )}
                <p className="font-medium">{actionMessage.message}</p>
                <button
                  onClick={() =>
                    setActionMessage({ type: null, message: null })
                  }
                  className="ml-6 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/operation-management")}
              className="inline-flex items-center px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Jobs
            </button>
            <div className="pl-2 border-l-2 border-gray-200">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Job Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {job._id} • {job.serviceType}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                job.status
              )} shadow-sm`}
            >
              {getStatusIcon(job.status)}
              <span className="ml-2 capitalize">{job.status}</span>
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                  Job Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Service Type
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {job.serviceType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Assigned To
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {job.assignedPerson?.name || "Not assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-green-50/50 border border-green-100">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Created At
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-yellow-50/50 border border-yellow-100">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <MapPinIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Starting Point
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {job.startingPoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Status
                        </p>
                        <p className="text-sm font-bold text-gray-900 capitalize">
                          {job.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Description
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {job.jobDetails}
                  </p>
                  {job.specialDescription && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <p className="text-sm text-gray-600 italic">
                        <span className="font-medium">Special Note:</span>{" "}
                        {job.specialDescription}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Documents
                  </h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          Passport Document
                        </span>
                      </div>
                      <a
                        href={job.documentPassport}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View
                      </a>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ID Document
                        </span>
                      </div>
                      <a
                        href={job.documentID}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        View
                      </a>
                    </div>

                    {job.otherDocuments &&
                      job.otherDocuments.length > 0 &&
                      job.otherDocuments.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              Additional Document {index + 1}
                            </span>
                          </div>
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                          >
                            View
                          </a>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Job Timeline */}
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Timeline
                  </h3>

                  {timelineLoading ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-500">
                        Loading timeline...
                      </p>
                    </div>
                  ) : timeline && timeline.length > 0 ? (
                    <div className="flow-root bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <ul className="-mb-8">
                        {timeline.map((event, index) => (
                          <li key={index}>
                            <div className="relative pb-8">
                              {index !== timeline.length - 1 ? (
                                <span
                                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-indigo-200"
                                  aria-hidden="true"
                                />
                              ) : null}
                              <div className="relative flex items-start space-x-3">
                                <div className="relative">
                                  <div
                                    className={`h-10 w-10 rounded-full flex items-center justify-center shadow-md ${
                                      getStatusColor(event.status).split(" ")[0]
                                    }`}
                                  >
                                    {getStatusIcon(event.status)}
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                  <div>
                                    <div className="text-sm font-bold text-gray-900">
                                      {event.status
                                        .replace("_", " ")
                                        .charAt(0)
                                        .toUpperCase() +
                                        event.status.replace("_", " ").slice(1)}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {new Date(
                                        event.timestamp
                                      ).toLocaleString()}
                                      {event.updatedBy &&
                                        ` • By: ${
                                          event.updatedBy.name || "System"
                                        }`}
                                    </p>
                                  </div>
                                  {event.description && (
                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-lg">
                                      <p>{event.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                      <p className="text-sm text-gray-500 italic">
                        No timeline events available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Person Details Form */}
            {!["cancelled"].includes(job.status) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100">
                    Person Details
                  </h2>

                  {/* Tabs */}
                  <div className="mb-8">
                    <div className="sm:hidden">
                      <select
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value)}
                        className="block w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                      >
                        {tabs.map((tab) => (
                          <option key={tab.id} value={tab.id}>
                            {tab.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="hidden sm:block">
                      <div className="border-b border-gray-200">
                        <nav
                          className="-mb-px flex space-x-2 overflow-x-auto"
                          aria-label="Tabs"
                        >
                          {tabs.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`${
                                activeTab === tab.id
                                  ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                              } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 rounded-t-lg`}
                              aria-current={
                                activeTab === tab.id ? "page" : undefined
                              }
                            >
                              <span
                                className={
                                  activeTab === tab.id
                                    ? "text-indigo-600"
                                    : "text-gray-400"
                                }
                              >
                                {tab.icon}
                              </span>
                              <span>{tab.name}</span>
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>

                  {/* Company Details Content */}
                  {activeTab === "company" && renderCompanyDetailsSection()}

                  {/* KYC Content */}
                  {activeTab === "kyc" && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 mb-6">
                        <div className="col-span-1 md:col-span-3 bg-gray-200 p-2 rounded-lg">
                          <h3 className="text-lg font-bold text-gray-900">
                            f. Signed KYC
                          </h3>
                        </div>
                        <div className="col-span-1 md:col-span-3 flex justify-end items-center">
                          <div className="flex items-center bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-100">
                            <span className="text-sm font-medium text-gray-700 mr-2">
                              Active Status
                            </span>
                            <select
                              value={kycDetails.activeStatus}
                              onChange={(e) =>
                                setKycDetails({
                                  ...kycDetails,
                                  activeStatus: e.target.value,
                                })
                              }
                              className="block rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            >
                              <option value="yes">yes</option>
                              <option value="no">no</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveKycDetails}
                          disabled={submitting}
                          className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {submitting ? (
                            <>
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                              Saving...
                            </>
                          ) : (
                            "Save"
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Person Details Content */}
                  {activeTab === "director" &&
                    renderPersonDetails(
                      "director",
                      directorDetails,
                      setDirectorDetails
                    )}
                  {activeTab === "shareholder" &&
                    renderPersonDetails(
                      "shareholder",
                      shareholderDetails,
                      setShareholderDetails
                    )}
                  {activeTab === "secretary" &&
                    renderPersonDetails(
                      "secretary",
                      secretaryDetails,
                      setSecretaryDetails
                    )}
                  {activeTab === "sef" &&
                    renderPersonDetails("sef", sefDetails, setSefDetails)}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
            >
              <div className="px-6 py-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                  <UserIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  Client Information
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <UserIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm font-bold text-gray-900">
                        {job.clientName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <EnvelopeIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-sm font-bold text-gray-900">
                        {job.gmail}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Engagement Letter Component */}
            {!["cancelled"].includes(job.status) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Engagement Letter
                    {companyDetails.engagementLetters &&
                      job.status === "pending" &&
                      job.timeline?.some((event) =>
                        event.description?.includes("auto-populated")
                      ) && (
                        <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          Auto-populated
                        </span>
                      )}
                  </h2>

                  {/* Info box for auto-populated letters */}
                  {companyDetails.engagementLetters &&
                    job.status === "pending" &&
                    job.timeline?.some((event) =>
                      event.description?.includes("auto-populated")
                    ) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex">
                          <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-2" />
                          <div>
                            <h3 className="text-sm font-medium text-blue-800">
                              Engagement Letter Auto-Populated
                            </h3>
                            <p className="mt-1 text-sm text-blue-700">
                              This engagement letter was automatically found
                              from another job for the same client. All jobs for
                              the same client use the same engagement letter.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {companyDetails.engagementLetters ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-center space-x-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                          <span className="font-medium text-green-800">
                            Engagement letter has been uploaded
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Engagement Letter Document
                          </span>
                        </div>
                        <a
                          href={companyDetails.engagementLetters}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-white rounded-lg shadow-sm border border-indigo-200 hover:shadow-md transition-all duration-200"
                        >
                          View Document
                        </a>
                      </div>

                      {/* Remove button shouldn't be shown for auto-populated letters as it would remove it from all jobs */}
                      {!job?.timeline?.some((event) =>
                        event.description?.includes("auto-populated")
                      ) && (
                        <div className="mt-4">
                          <button
                            onClick={() => {
                              setEngagementLetter(null);
                              setCompanyDetails((prev) => ({
                                ...prev,
                                engagementLetters: null,
                              }));
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Remove letter
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                        isDragging
                          ? "border-indigo-500 bg-indigo-50"
                          : engagementLetter
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {engagementLetter ? (
                        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {engagementLetter.name}
                            </span>
                          </div>
                          <button
                            onClick={removeEngagementLetter}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <CloudArrowUpIcon className="mx-auto h-14 w-14 text-gray-400" />
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-indigo-600 hover:text-indigo-500 cursor-pointer transition-colors">
                              <span>Upload a file</span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                              />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PDF, DOC up to 10MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Information about shared engagement letters */}
                  {!companyDetails.engagementLetters && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 flex items-start">
                        <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-1 flex-shrink-0 mt-0.5" />
                        <span>
                          An engagement letter uploaded here will be
                          automatically shared with all jobs for this client.
                        </span>
                      </p>
                    </div>
                  )}

                  {engagementLetter && !companyDetails.engagementLetters && (
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUploadEngagementLetter}
                        disabled={submitting}
                        className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md transition-all duration-200 transform hover:scale-105 font-medium ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {submitting ? (
                          <>
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            Uploading...
                          </>
                        ) : (
                          "Upload Letter"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Complete Operation Info Message - Only shown for approved jobs without engagement letter */}
            {job.status === "approved" && !companyDetails.engagementLetters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                    Operation Status
                  </h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-sm font-medium text-yellow-800">
                          Requirements to Complete Operation
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              Job Status:{" "}
                              {job.status === "approved" ? (
                                <span className="text-green-700">
                                  ✓ Approved
                                </span>
                              ) : (
                                <span className="text-red-700">
                                  ✗ Not Approved
                                </span>
                              )}
                            </li>
                            <li>
                              Engagement Letter:{" "}
                              {companyDetails.engagementLetters ? (
                                <span className="text-green-700">
                                  ✓ Uploaded
                                </span>
                              ) : (
                                <span className="text-red-700">
                                  ✗ Not Uploaded
                                </span>
                              )}
                            </li>
                          </ul>
                          <p className="mt-3 font-medium">
                            Please upload an engagement letter to mark this
                            operation as complete.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Complete Operation Button - Only shown for approved jobs with engagement letter */}
            {job.status === "approved" && companyDetails.engagementLetters && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentCheckIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Operation Status
                  </h2>
                  <div className="space-y-4">
                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={handleCompleteOperation}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Mark Operation as Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons Section */}
            {job.status === "pending" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                <div className="px-6 py-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-100 flex items-center">
                    <DocumentDuplicateIcon className="h-5 w-5 text-indigo-600 mr-2" />
                    Job Actions
                  </h2>
                  <div className="space-y-4">
                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={async () => {
                        try {
                          setSubmitting(true);
                          await axiosInstance.put(`/jobs/${jobId}/approve`);
                          setActionMessage({
                            type: "success",
                            message: "Job approved successfully",
                          });

                          // Refresh job data
                          const response = await axiosInstance.get(
                            `/jobs/${jobId}`
                          );
                          setJob(response.data);

                          setTimeout(() => {
                            setActionMessage({ type: null, message: null });
                          }, 3000);
                        } catch (err) {
                          console.error("Error approving job:", err);
                          setActionMessage({
                            type: "error",
                            message:
                              err.response?.data?.message ||
                              "Failed to approve job",
                          });
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5 mr-2" />
                          Approve Job
                        </>
                      )}
                    </button>

                    <button
                      className="w-full px-6 py-3 bg-gradient-to-r from-rose-500 to-red-500 text-white rounded-lg hover:from-rose-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center shadow-md transform hover:scale-105 font-medium"
                      onClick={() => {
                        // This would typically open a modal to enter rejection reason
                        setActionMessage({
                          type: "error",
                          message:
                            "Rejection requires a reason. Please implement a modal for this action.",
                        });

                        setTimeout(() => {
                          setActionMessage({ type: null, message: null });
                        }, 3000);
                      }}
                      disabled={submitting}
                    >
                      <XMarkIcon className="h-5 w-5 mr-2" />
                      Reject Job
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetails;
