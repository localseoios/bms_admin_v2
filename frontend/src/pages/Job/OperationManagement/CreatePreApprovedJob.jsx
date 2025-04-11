import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  BriefcaseIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  TrashIcon,
  PaperClipIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

const CreatePreApprovedJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [files, setFiles] = useState({
    documentPassport: null,
    documentID: null,
    otherDocuments: [],
    engagementLetters: null,
    companyComputerCard: null,
    taxCard: null,
    crExtract: null,
    scopeOfLicense: null,
    articleOfAssociate: null,
    certificateOfIncorporate: null,
    kycDocuments: [],
    braDocuments: [],
  });

  // Form state
  const [formData, setFormData] = useState({
    // Basic job info
    serviceType: "",
    assignedPerson: "",
    jobDetails: "",
    specialDescription: "",
    clientName: "",
    gmail: "",
    startingPoint: "QFC",

    // Company details
    companyDetails: {
      companyName: "",
      qfcNo: "",
      registeredAddress: "",
      incorporationDate: "",
      serviceType: "",
      mainPurpose: "",
      expiryDate: "",
      companyComputerCardExpiry: "",
      taxCardExpiry: "",
      crExtractExpiry: "",
      scopeOfLicenseExpiry: "",
      kycActiveStatus: "yes",
    },

    // Person details
    directors: [
      {
        name: "",
        nationality: "",
        qidNo: "",
        qidExpiry: "",
        nationalAddress: "",
        nationalAddressExpiry: "",
        passportNo: "",
        passportExpiry: "",
        mobileNo: "",
        email: "",
      },
    ],
    shareholders: [],
    secretaries: [],
    sefs: [],

    // KYC documents info
    kycDocumentInfo: [
      {
        description: "",
        date: "",
      },
    ],

    // BRA documents info
    braDocumentInfo: [
      {
        description: "",
        date: "",
      },
    ],
  });

  // Person document states
  const [directorDocs, setDirectorDocs] = useState([
    {
      visaCopy: null,
      qidDoc: null,
      nationalAddressDoc: null,
      passportDoc: null,
      cv: null,
    },
  ]);

  const [shareholderDocs, setShareholderDocs] = useState([]);
  const [secretaryDocs, setSecretaryDocs] = useState([]);
  const [sefDocs, setSefDocs] = useState([]);

  // Fetch assignable users for the dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/users?role=operation");
        setAssignableUsers(response.data);
      } catch (error) {
        console.error("Error fetching assignable users:", error);
        toast.error("Failed to load assignable users");
      }
    };

    fetchUsers();
  }, []);

  // Fetch services from the API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await axiosInstance.get("/services");
        // Only use active services
        const activeServices = response.data.filter(
          (service) => service.status === "active"
        );
        setServices(activeServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested fields with dot notation (e.g., "companyDetails.companyName")
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });

      // If company service type is being changed, update main service type for consistency
      if (name === "companyDetails.serviceType") {
        setFormData((prevState) => ({
          ...prevState,
          serviceType: value,
        }));
      }
    } else {
      // Handle flat fields
      setFormData({
        ...formData,
        [name]: value,
      });

      // If main service type is being changed, update company service type for consistency
      if (name === "serviceType") {
        setFormData((prevState) => ({
          ...prevState,
          companyDetails: {
            ...prevState.companyDetails,
            serviceType: value,
          },
        }));
      }

      // Auto-populate client name as company name when client name is changed
      if (name === "clientName" && value) {
        setFormData((prevState) => ({
          ...prevState,
          companyDetails: {
            ...prevState.companyDetails,
            companyName: value,
          },
        }));
      }
    }
  };

  // Handle array field changes (e.g., directors, shareholders)
  const handleArrayChange = (arrayName, index, field, value) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = {
      ...newArray[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      [arrayName]: newArray,
    });
  };

  // Add new item to an array field
  const addArrayItem = (arrayName, docsStateUpdater = null) => {
    const emptyItem = {
      name: "",
      nationality: "",
      qidNo: "",
      qidExpiry: "",
      nationalAddress: "",
      nationalAddressExpiry: "",
      passportNo: "",
      passportExpiry: "",
      mobileNo: "",
      email: "",
    };

    setFormData({
      ...formData,
      [arrayName]: [...formData[arrayName], emptyItem],
    });

    // If there's a document state updater, also add empty docs
    if (docsStateUpdater) {
      docsStateUpdater((prev) => [
        ...prev,
        {
          visaCopy: null,
          qidDoc: null,
          nationalAddressDoc: null,
          passportDoc: null,
          cv: null,
        },
      ]);
    }
  };

  // Remove item from an array field
  const removeArrayItem = (arrayName, index, docsStateUpdater = null) => {
    if (formData[arrayName].length <= 1) {
      return; // Keep at least one item
    }

    const newArray = [...formData[arrayName]];
    newArray.splice(index, 1);

    setFormData({
      ...formData,
      [arrayName]: newArray,
    });

    // If there's a document state updater, also remove docs
    if (docsStateUpdater) {
      docsStateUpdater((prev) => {
        const newDocs = [...prev];
        newDocs.splice(index, 1);
        return newDocs;
      });
    }
  };

  // Handle file upload changes
  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;

    if (
      name === "otherDocuments" ||
      name === "kycDocuments" ||
      name === "braDocuments"
    ) {
      // These fields accept multiple files
      setFiles({
        ...files,
        [name]: [...files[name], ...Array.from(uploadedFiles)],
      });
    } else {
      // Single file fields
      setFiles({
        ...files,
        [name]: uploadedFiles[0],
      });
    }
  };

  // Handle person document changes
  const handlePersonDocChange = (personType, index, docType, file) => {
    let updater;
    let stateArray;

    switch (personType) {
      case "director":
        updater = setDirectorDocs;
        stateArray = directorDocs;
        break;
      case "shareholder":
        updater = setShareholderDocs;
        stateArray = shareholderDocs;
        break;
      case "secretary":
        updater = setSecretaryDocs;
        stateArray = secretaryDocs;
        break;
      case "sef":
        updater = setSefDocs;
        stateArray = sefDocs;
        break;
      default:
        return;
    }

    const newDocs = [...stateArray];
    newDocs[index] = {
      ...newDocs[index],
      [docType]: file,
    };

    updater(newDocs);
  };

  // Remove a file from array
  const removeFile = (fieldName, index) => {
    const newFiles = [...files[fieldName]];
    newFiles.splice(index, 1);
    setFiles({
      ...files,
      [fieldName]: newFiles,
    });
  };

  // Add KYC document info field
  const addKycDocumentInfo = () => {
    setFormData({
      ...formData,
      kycDocumentInfo: [
        ...formData.kycDocumentInfo,
        { description: "", date: "" },
      ],
    });
  };

  // Remove KYC document info field
  const removeKycDocumentInfo = (index) => {
    if (formData.kycDocumentInfo.length <= 1) {
      return; // Keep at least one item
    }

    const newInfo = [...formData.kycDocumentInfo];
    newInfo.splice(index, 1);

    setFormData({
      ...formData,
      kycDocumentInfo: newInfo,
    });
  };

  // Handle KYC document info changes
  const handleKycInfoChange = (index, field, value) => {
    const newInfo = [...formData.kycDocumentInfo];
    newInfo[index] = {
      ...newInfo[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      kycDocumentInfo: newInfo,
    });
  };

  // Add BRA document info field
  const addBraDocumentInfo = () => {
    setFormData({
      ...formData,
      braDocumentInfo: [
        ...formData.braDocumentInfo,
        { description: "", date: "" },
      ],
    });
  };

  // Remove BRA document info field
  const removeBraDocumentInfo = (index) => {
    if (formData.braDocumentInfo.length <= 1) {
      return; // Keep at least one item
    }

    const newInfo = [...formData.braDocumentInfo];
    newInfo.splice(index, 1);

    setFormData({
      ...formData,
      braDocumentInfo: newInfo,
    });
  };

  // Handle BRA document info changes
  const handleBraInfoChange = (index, field, value) => {
    const newInfo = [...formData.braDocumentInfo];
    newInfo[index] = {
      ...newInfo[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      braDocumentInfo: newInfo,
    });
  };

  // Create the job
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.serviceType ||
        !formData.assignedPerson ||
        !formData.jobDetails ||
        !formData.clientName ||
        !formData.gmail ||
        !formData.startingPoint
      ) {
        toast.error("Please fill out all required fields");
        setLoading(false);
        return;
      }

      if (!files.documentPassport || !files.documentID) {
        toast.error("Passport and ID documents are required");
        setLoading(false);
        return;
      }

      // Email validation for Gmail
      if (!formData.gmail.endsWith("@gmail.com")) {
        toast.error(
          "Email must be a valid Gmail address (ending with @gmail.com)"
        );
        setLoading(false);
        return;
      }

      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Add basic job info
      formDataToSend.append("serviceType", formData.serviceType);
      formDataToSend.append("assignedPerson", formData.assignedPerson);
      formDataToSend.append("jobDetails", formData.jobDetails);
      formDataToSend.append("specialDescription", formData.specialDescription);
      formDataToSend.append("clientName", formData.clientName);
      formDataToSend.append("gmail", formData.gmail);
      formDataToSend.append("startingPoint", formData.startingPoint);

      // Add company details
      formDataToSend.append(
        "companyDetails",
        JSON.stringify(formData.companyDetails)
      );

      // Add person details
      formDataToSend.append("directors", JSON.stringify(formData.directors));
      formDataToSend.append(
        "shareholders",
        JSON.stringify(formData.shareholders)
      );
      formDataToSend.append(
        "secretaries",
        JSON.stringify(formData.secretaries)
      );
      formDataToSend.append("sefs", JSON.stringify(formData.sefs));

      // Add KYC document info
      formDataToSend.append(
        "kycDocumentInfo",
        JSON.stringify(formData.kycDocumentInfo)
      );

      // Add BRA document info
      formDataToSend.append(
        "braDocumentInfo",
        JSON.stringify(formData.braDocumentInfo)
      );

      // Add required job documents
      formDataToSend.append("documentPassport", files.documentPassport);
      formDataToSend.append("documentID", files.documentID);

      // Add other job documents
      if (files.otherDocuments.length > 0) {
        files.otherDocuments.forEach((file) => {
          formDataToSend.append("otherDocuments", file);
        });
      }

      // Add company documents
      if (files.engagementLetters)
        formDataToSend.append("engagementLetters", files.engagementLetters);
      if (files.companyComputerCard)
        formDataToSend.append("companyComputerCard", files.companyComputerCard);
      if (files.taxCard) formDataToSend.append("taxCard", files.taxCard);
      if (files.crExtract) formDataToSend.append("crExtract", files.crExtract);
      if (files.scopeOfLicense)
        formDataToSend.append("scopeOfLicense", files.scopeOfLicense);
      if (files.articleOfAssociate)
        formDataToSend.append("articleOfAssociate", files.articleOfAssociate);
      if (files.certificateOfIncorporate)
        formDataToSend.append(
          "certificateOfIncorporate",
          files.certificateOfIncorporate
        );

      // Add director documents
      formData.directors.forEach((_, index) => {
        if (directorDocs[index]) {
          if (directorDocs[index].visaCopy)
            formDataToSend.append(
              "directorVisaCopy",
              directorDocs[index].visaCopy
            );
          if (directorDocs[index].qidDoc)
            formDataToSend.append("directorQidDoc", directorDocs[index].qidDoc);
          if (directorDocs[index].nationalAddressDoc)
            formDataToSend.append(
              "directorNationalAddressDoc",
              directorDocs[index].nationalAddressDoc
            );
          if (directorDocs[index].passportDoc)
            formDataToSend.append(
              "directorPassportDoc",
              directorDocs[index].passportDoc
            );
          if (directorDocs[index].cv)
            formDataToSend.append("directorCv", directorDocs[index].cv);
        }
      });

      // Add shareholder documents
      formData.shareholders.forEach((_, index) => {
        if (shareholderDocs[index]) {
          if (shareholderDocs[index].visaCopy)
            formDataToSend.append(
              "shareholderVisaCopy",
              shareholderDocs[index].visaCopy
            );
          if (shareholderDocs[index].qidDoc)
            formDataToSend.append(
              "shareholderQidDoc",
              shareholderDocs[index].qidDoc
            );
          if (shareholderDocs[index].nationalAddressDoc)
            formDataToSend.append(
              "shareholderNationalAddressDoc",
              shareholderDocs[index].nationalAddressDoc
            );
          if (shareholderDocs[index].passportDoc)
            formDataToSend.append(
              "shareholderPassportDoc",
              shareholderDocs[index].passportDoc
            );
          if (shareholderDocs[index].cv)
            formDataToSend.append("shareholderCv", shareholderDocs[index].cv);
        }
      });

      // Add secretary documents
      formData.secretaries.forEach((_, index) => {
        if (secretaryDocs[index]) {
          if (secretaryDocs[index].visaCopy)
            formDataToSend.append(
              "secretaryVisaCopy",
              secretaryDocs[index].visaCopy
            );
          if (secretaryDocs[index].qidDoc)
            formDataToSend.append(
              "secretaryQidDoc",
              secretaryDocs[index].qidDoc
            );
          if (secretaryDocs[index].nationalAddressDoc)
            formDataToSend.append(
              "secretaryNationalAddressDoc",
              secretaryDocs[index].nationalAddressDoc
            );
          if (secretaryDocs[index].passportDoc)
            formDataToSend.append(
              "secretaryPassportDoc",
              secretaryDocs[index].passportDoc
            );
          if (secretaryDocs[index].cv)
            formDataToSend.append("secretaryCv", secretaryDocs[index].cv);
        }
      });

      // Add SEF documents
      formData.sefs.forEach((_, index) => {
        if (sefDocs[index]) {
          if (sefDocs[index].visaCopy)
            formDataToSend.append("sefVisaCopy", sefDocs[index].visaCopy);
          if (sefDocs[index].qidDoc)
            formDataToSend.append("sefQidDoc", sefDocs[index].qidDoc);
          if (sefDocs[index].nationalAddressDoc)
            formDataToSend.append(
              "sefNationalAddressDoc",
              sefDocs[index].nationalAddressDoc
            );
          if (sefDocs[index].passportDoc)
            formDataToSend.append("sefPassportDoc", sefDocs[index].passportDoc);
          if (sefDocs[index].cv)
            formDataToSend.append("sefCv", sefDocs[index].cv);
        }
      });

      // Add KYC documents
      if (files.kycDocuments.length > 0) {
        files.kycDocuments.forEach((file) => {
          formDataToSend.append("kycDocuments", file);
        });
      }

      // Add BRA documents
      if (files.braDocuments.length > 0) {
        files.braDocuments.forEach((file) => {
          formDataToSend.append("braDocuments", file);
        });
      }

      // Send request to the backend
      const response = await axiosInstance.post(
        "/operations/pre-approved-job",
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Pre-approved job created successfully!");

      // Navigate to the job details page
      navigate(`/job/${response.data.job._id}`);
    } catch (error) {
      console.error("Error creating pre-approved job:", error);

      // Handle API error response
      const errorMessage =
        error.response?.data?.message || "Failed to create pre-approved job";
      const detailedError = error.response?.data?.error;

      toast.error(errorMessage);

      if (detailedError) {
        console.error("Detailed error:", detailedError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Format the date string for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              <span>Back</span>
            </button>
            <h1 className="mt-2 text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              Create Pre-Approved Job
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Create a new job with all approvals pre-completed
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Job Information */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <BriefcaseIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Basic Job Information
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  required
                  disabled={loadingServices}
                >
                  <option value="">Select Service Type</option>
                  {loadingServices ? (
                    <option value="" disabled>
                      Loading services...
                    </option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assigned Person <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignedPerson"
                  value={formData.assignedPerson}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  required
                >
                  <option value="">Select Assigned Person</option>
                  {assignableUsers.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Gmail Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="gmail"
                  value={formData.gmail}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Must be a valid Gmail address
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Starting Point <span className="text-red-500">*</span>
                </label>
                <select
                  name="startingPoint"
                  value={formData.startingPoint}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  required
                >
                  <option value="QFC">QFC</option>
                  <option value="Ministry">Ministry</option>
                  <option value="Free Zone">Free Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Special Description
                </label>
                <input
                  type="text"
                  name="specialDescription"
                  value={formData.specialDescription}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                Job Details <span className="text-red-500">*</span>
              </label>
              <textarea
                name="jobDetails"
                value={formData.jobDetails}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Passport Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "documentPassport",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                  required={!files.documentPassport}
                />
                {files.documentPassport && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.documentPassport.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ID Document <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "documentID",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                  required={!files.documentID}
                />
                {files.documentID && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{files.documentID.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Other Documents
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "otherDocuments",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                  multiple
                />
                {files.otherDocuments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.otherDocuments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center truncate">
                          <PaperClipIcon className="h-4 w-4 mr-1" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile("otherDocuments", index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Company Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyDetails.companyName"
                  value={formData.companyDetails.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  QFC Number
                </label>
                <input
                  type="text"
                  name="companyDetails.qfcNo"
                  value={formData.companyDetails.qfcNo}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Registered Address
                </label>
                <input
                  type="text"
                  name="companyDetails.registeredAddress"
                  value={formData.companyDetails.registeredAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Incorporation Date
                </label>
                <input
                  type="date"
                  name="companyDetails.incorporationDate"
                  value={formatDateForInput(
                    formData.companyDetails.incorporationDate
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Type
                </label>
                <select
                  name="companyDetails.serviceType"
                  value={formData.companyDetails.serviceType}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  disabled={loadingServices}
                >
                  <option value="">Select Service Type</option>
                  {loadingServices ? (
                    <option value="" disabled>
                      Loading services...
                    </option>
                  ) : (
                    services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Main Purpose
                </label>
                <input
                  type="text"
                  name="companyDetails.mainPurpose"
                  value={formData.companyDetails.mainPurpose}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="companyDetails.expiryDate"
                  value={formatDateForInput(formData.companyDetails.expiryDate)}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  KYC Active Status
                </label>
                <select
                  name="companyDetails.kycActiveStatus"
                  value={formData.companyDetails.kycActiveStatus}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Engagement Letters
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "engagementLetters",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.engagementLetters && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.engagementLetters.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Computer Card
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "companyComputerCard",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.companyComputerCard && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.companyComputerCard.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Computer Card Expiry
                </label>
                <input
                  type="date"
                  name="companyDetails.companyComputerCardExpiry"
                  value={formatDateForInput(
                    formData.companyDetails.companyComputerCardExpiry
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tax Card
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "taxCard",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.taxCard && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{files.taxCard.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tax Card Expiry
                </label>
                <input
                  type="date"
                  name="companyDetails.taxCardExpiry"
                  value={formatDateForInput(
                    formData.companyDetails.taxCardExpiry
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CR Extract
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "crExtract",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.crExtract && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">{files.crExtract.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CR Extract Expiry
                </label>
                <input
                  type="date"
                  name="companyDetails.crExtractExpiry"
                  value={formatDateForInput(
                    formData.companyDetails.crExtractExpiry
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scope of License
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "scopeOfLicense",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.scopeOfLicense && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.scopeOfLicense.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Scope of License Expiry
                </label>
                <input
                  type="date"
                  name="companyDetails.scopeOfLicenseExpiry"
                  value={formatDateForInput(
                    formData.companyDetails.scopeOfLicenseExpiry
                  )}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Article of Associate
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "articleOfAssociate",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.articleOfAssociate && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.articleOfAssociate.name}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Certificate of Incorporate
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleFileChange({
                      target: {
                        name: "certificateOfIncorporate",
                        files: e.target.files,
                      },
                    })
                  }
                  className="mt-1 block w-full px-3 py-2"
                />
                {files.certificateOfIncorporate && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <PaperClipIcon className="h-4 w-4 mr-1" />
                    <span className="truncate">
                      {files.certificateOfIncorporate.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Directors */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Directors
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addArrayItem("directors", setDirectorDocs)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Director
              </button>
            </div>

            {formData.directors.map((director, index) => (
              <div
                key={index}
                className="mb-8 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Director {index + 1}
                  </h3>
                  {formData.directors.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayItem("directors", index, setDirectorDocs)
                      }
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={director.name}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "name",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={director.nationality}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationality",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Number
                    </label>
                    <input
                      type="text"
                      value={director.qidNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "qidNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.qidExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "qidExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address
                    </label>
                    <input
                      type="text"
                      value={director.nationalAddress}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationalAddress",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.nationalAddressExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "nationalAddressExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      value={director.passportNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "passportNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Expiry
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(director.passportExpiry)}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "passportExpiry",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      value={director.mobileNo}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "mobileNo",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={director.email}
                      onChange={(e) =>
                        handleArrayChange(
                          "directors",
                          index,
                          "email",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Visa Copy
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "visaCopy",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.visaCopy && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].visaCopy.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      QID Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "qidDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.qidDoc && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].qidDoc.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      National Address Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "nationalAddressDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.nationalAddressDoc && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].nationalAddressDoc.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Passport Document
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "passportDoc",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.passportDoc && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].passportDoc.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CV
                    </label>
                    <input
                      type="file"
                      onChange={(e) =>
                        handlePersonDocChange(
                          "director",
                          index,
                          "cv",
                          e.target.files[0]
                        )
                      }
                      className="mt-1 block w-full px-3 py-2"
                    />
                    {directorDocs[index]?.cv && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {directorDocs[index].cv.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shareholders */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Shareholders
                </h2>
              </div>
              <button
                type="button"
                onClick={() => addArrayItem("shareholders", setShareholderDocs)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Shareholder
              </button>
            </div>

            {formData.shareholders.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No shareholders added yet. Click the button above to add a
                shareholder.
              </p>
            ) : (
              formData.shareholders.map((shareholder, index) => (
                <div
                  key={index}
                  className="mb-8 pb-6 border-b border-gray-200 last:border-b-0 last:mb-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Shareholder {index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        removeArrayItem(
                          "shareholders",
                          index,
                          setShareholderDocs
                        )
                      }
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={shareholder.name}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "name",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={shareholder.nationality}
                        onChange={(e) =>
                          handleArrayChange(
                            "shareholders",
                            index,
                            "nationality",
                            e.target.value
                          )
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Add more fields as needed */}
                  </div>

                  {/* Add document upload fields for shareholders */}
                </div>
              ))
            )}
          </div>

          {/* KYC Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  KYC Documents
                </h2>
              </div>
              <button
                type="button"
                onClick={addKycDocumentInfo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Document Info
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload KYC Documents
              </label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange({
                    target: {
                      name: "kycDocuments",
                      files: e.target.files,
                    },
                  })
                }
                className="mt-1 block w-full px-3 py-2"
                multiple
              />
              {files.kycDocuments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.kycDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center truncate">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("kycDocuments", index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.kycDocumentInfo.map((info, index) => (
              <div key={index} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Document Info #{index + 1}
                  </h3>
                  {formData.kycDocumentInfo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKycDocumentInfo(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={info.description}
                      onChange={(e) =>
                        handleKycInfoChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(info.date)}
                      onChange={(e) =>
                        handleKycInfoChange(index, "date", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BRA Documents */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  BRA Documents
                </h2>
              </div>
              <button
                type="button"
                onClick={addBraDocumentInfo}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                Add Document Info
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700">
                Upload BRA Documents
              </label>
              <input
                type="file"
                onChange={(e) =>
                  handleFileChange({
                    target: {
                      name: "braDocuments",
                      files: e.target.files,
                    },
                  })
                }
                className="mt-1 block w-full px-3 py-2"
                multiple
              />
              {files.braDocuments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.braDocuments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex items-center truncate">
                        <PaperClipIcon className="h-4 w-4 mr-1" />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile("braDocuments", index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.braDocumentInfo.map((info, index) => (
              <div key={index} className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Document Info #{index + 1}
                  </h3>
                  {formData.braDocumentInfo.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBraDocumentInfo(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Description
                    </label>
                    <input
                      type="text"
                      value={info.description}
                      onChange={(e) =>
                        handleBraInfoChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(info.date)}
                      onChange={(e) =>
                        handleBraInfoChange(index, "date", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Create Pre-Approved Job
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePreApprovedJob;
