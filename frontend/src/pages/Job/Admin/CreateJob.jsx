import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance, { fileUploadInstance } from "../../../utils/axios";
import { compressImage } from "../../../utils/imageCompression"; // Import the compression utility
import {
  DocumentIcon,
  UserIcon,
  BriefcaseIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  CheckIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

function CreateJob() {
  const navigate = useNavigate();

  // Operation managers state
  const [operationManagers, setOperationManagers] = useState([]);

  // Services state - dynamic from service management
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // New state for checking existing clients
  const [existingClient, setExistingClient] = useState(null);
  const [checkingClient, setCheckingClient] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    serviceType: "",
    documentPassport: null,
    documentID: null,
    otherDocuments: [],
    assignedPerson: "",
    jobDetails: "",
    specialDescription: "",
    clientName: "",
    gmail: "",
    startingPoint: "",
  });

  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for drag and drop active status
  const [dragActive, setDragActive] = useState(false);
  // State for form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // New state for file processing
  const [processingFile, setProcessingFile] = useState(false);
  // New state for upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  // State for submission errors
  const [submissionError, setSubmissionError] = useState("");

  // Fetch operation managers
  useEffect(() => {
    const fetchOperationManagers = async () => {
      try {
        const response = await axiosInstance.get("/users/operation-managers");
        setOperationManagers(response.data);
      } catch (error) {
        console.error("Error fetching operation managers:", error);
      }
    };

    fetchOperationManagers();
  }, []);

  // Fetch services from service management
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
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Modified function to check if a client with the given email exists
  const checkExistingClient = async (email) => {
    if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      setExistingClient(null);
      return;
    }

    setCheckingClient(true);
    try {
      // Try to fetch client by email
      const response = await axiosInstance.get(
        `/clients/${encodeURIComponent(email)}`
      );

      if (response.data && response.data.client) {
        setExistingClient(response.data.client);

        // Auto-fill client name and starting point if available
        setFormData((prev) => ({
          ...prev,
          clientName: response.data.client.name || prev.clientName,
          startingPoint:
            response.data.client.startingPoint || prev.startingPoint,
        }));
      }
    } catch (error) {
      // 404 means client doesn't exist, which is fine
      if (error.response && error.response.status !== 404) {
        console.error("Error checking client:", error);
      }
      setExistingClient(null);
    } finally {
      setCheckingClient(false);
    }
  };

  // Debounce function for email checks
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Create debounced version of the client check
  const debouncedCheckClient = debounce(checkExistingClient, 500);

  // Handle text input changes with updated email checks
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Reset submission error whenever any input changes
    if (submissionError) {
      setSubmissionError("");
    }

    // Check for existing client when email changes
    if (
      name === "gmail" &&
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)
    ) {
      debouncedCheckClient(value);
    } else if (name === "gmail") {
      setExistingClient(null);
    }
  };

  // Handle email field blur for immediate checking
  const handleGmailBlur = () => {
    if (
      formData.gmail &&
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.gmail)
    ) {
      checkExistingClient(formData.gmail);
    }
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.serviceType)
      newErrors.serviceType = "Service type is required";
    // Passport is optional, so we don't validate it
    if (!formData.documentID) newErrors.documentID = "ID document is required";
    if (!formData.assignedPerson)
      newErrors.assignedPerson = "Assigned person is required";
    if (!formData.jobDetails) newErrors.jobDetails = "Job details are required";
    if (!formData.clientName) newErrors.clientName = "Client name is required";
    if (!formData.gmail) {
      newErrors.gmail = "Email address is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.gmail)
    ) {
      newErrors.gmail = "Invalid email address format";
    }
    if (!formData.startingPoint)
      newErrors.startingPoint = "Starting point is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Improved file handling with compression
  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setProcessingFile(true);

    try {
      // Compress image if it's an image file
      const processedFile = file.type.startsWith("image/")
        ? await compressImage(file)
        : file;

      setFormData((prev) => ({
        ...prev,
        [field]: processedFile,
      }));

      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setErrors((prev) => ({
        ...prev,
        [field]: "Error processing file. Please try again.",
      }));
    } finally {
      setProcessingFile(false);
    }
  };

  // Improved handler for multiple files
  const handleMultipleFileChange = async (files) => {
    if (!files || files.length === 0) return;

    setProcessingFile(true);

    try {
      const processedFiles = [];

      for (const file of files) {
        // Compress each image file individually
        const processedFile = file.type.startsWith("image/")
          ? await compressImage(file)
          : file;

        processedFiles.push(processedFile);
      }

      setFormData((prev) => ({
        ...prev,
        otherDocuments: [...prev.otherDocuments, ...processedFiles],
      }));
    } catch (error) {
      console.error("Error processing files:", error);
      setErrors((prev) => ({
        ...prev,
        otherDocuments: "Error processing files. Please try again.",
      }));
    } finally {
      setProcessingFile(false);
    }
  };

  // Drag & drop handlers for other documents
  const handleDrag = (e, isDragging) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isDragging);
  };

  // Improved drop handler with file compression
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleMultipleFileChange(files);
    }
  };

  // Remove a file from otherDocuments array
  const removeOtherDocument = (index) => {
    setFormData((prev) => ({
      ...prev,
      otherDocuments: prev.otherDocuments.filter((_, i) => i !== index),
    }));
  };

  // Enhanced form submission with better error handling and retry logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    setSubmissionError("");

    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("serviceType", formData.serviceType);
      formDataToSend.append("assignedPerson", formData.assignedPerson);
      formDataToSend.append("jobDetails", formData.jobDetails);
      formDataToSend.append(
        "specialDescription",
        formData.specialDescription || ""
      );
      formDataToSend.append("clientName", formData.clientName);
      formDataToSend.append("gmail", formData.gmail);
      formDataToSend.append("startingPoint", formData.startingPoint);

      // Add files with validation
      if (formData.documentPassport) {
        formDataToSend.append("documentPassport", formData.documentPassport);
      }

      if (formData.documentID) {
        formDataToSend.append("documentID", formData.documentID);
      } else {
        throw new Error("ID document is required");
      }

      // Add other documents
      formData.otherDocuments.forEach((file) => {
        formDataToSend.append("otherDocuments", file);
      });

      // Calculate total upload size for debugging
      let totalUploadSize = 0;
      for (const pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          totalUploadSize += pair[1].size;
        }
      }
      console.log(
        `Total upload size: ${(totalUploadSize / (1024 * 1024)).toFixed(2)} MB`
      );

      // Upload with progress monitoring
      const response = await fileUploadInstance.post("/jobs", formDataToSend, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Job created successfully:", response.data);
      // Navigate to admin jobs page to see the job
      navigate("/admin/jobs");
    } catch (error) {
      console.error("Error creating job:", error);

      let errorMessage = "An error occurred when creating the job.";

      if (error.response) {
        // The request was made and the server responded with an error status
        if (error.response.status === 413) {
          errorMessage =
            "Files are too large. Please upload smaller files or compress images further.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server error: ${error.response.status}`;
        }
      } else if (error.message && error.message.includes("Network Error")) {
        errorMessage =
          "Cannot connect to the server. Please check your internet connection or contact support for CORS issues.";
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage =
          "No response from server. Please try again or contact support.";
      } else {
        // Something happened in setting up the request
        errorMessage = error.message;
      }

      setSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Optional: Get status color for user
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "text-green-600 bg-green-50";
      case "Busy":
        return "text-red-600 bg-red-50";
      case "In Meeting":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="px-6 py-8 sm:p-10">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <BriefcaseIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Create New Job
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Fill in the details below to create a new job assignment
                </p>
              </div>
            </div>

            {/* Submission Error Message */}
            {submissionError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error Creating Job
                    </h3>
                    <p className="mt-1 text-sm text-red-700">
                      {submissionError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Client Auto-Approval Notice */}
            {existingClient && (
              <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Existing Client Detected
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      This client is already in our system. The job will be
                      auto-approved and bypass Compliance Management review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Service Type Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <BuildingOfficeIcon className="h-5 w-5 text-blue-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Service Information
                  </h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type <span className="text-red-500 text-xs">*</span>
                  </label>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className={`block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      errors.serviceType ? "border-red-300" : ""
                    }`}
                    disabled={loadingServices}
                  >
                    <option value="">Select a service type</option>
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
                  {errors.serviceType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.serviceType}
                    </p>
                  )}
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <DocumentIcon className="h-5 w-5 text-indigo-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Required Documents
                  </h2>
                  <span className="text-xs text-gray-500">
                    (* indicates required)
                  </span>
                </div>

                {/* Document Requirements Info */}
                <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        ID document is required, while passport document is
                        optional. You can upload other supporting documents if
                        needed. Large images will be automatically compressed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Passport Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Document{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        onChange={(e) =>
                          handleFileChange(e, "documentPassport")
                        }
                        className="hidden"
                        id="passport-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={processingFile || isSubmitting}
                      />
                      <label
                        htmlFor="passport-upload"
                        className={`flex items-center justify-center w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                          processingFile
                            ? "border-yellow-300 bg-yellow-50"
                            : formData.documentPassport
                            ? "border-green-500 bg-green-50 hover:bg-green-100"
                            : errors.documentPassport
                            ? "border-red-300 bg-red-50 hover:bg-red-100"
                            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        } ${
                          processingFile || isSubmitting
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {processingFile ? (
                            <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                          ) : (
                            <CloudArrowUpIcon
                              className={`h-6 w-6 ${
                                formData.documentPassport
                                  ? "text-green-500"
                                  : errors.documentPassport
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              processingFile
                                ? "text-yellow-700"
                                : formData.documentPassport
                                ? "text-green-700"
                                : errors.documentPassport
                                ? "text-red-700"
                                : "text-gray-600"
                            }`}
                          >
                            {processingFile
                              ? "Processing file..."
                              : formData.documentPassport
                              ? formData.documentPassport.name
                              : "Click to upload passport document (optional)"}
                          </span>
                        </div>
                      </label>
                    </div>
                    {errors.documentPassport && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.documentPassport}
                      </p>
                    )}
                  </div>

                  {/* ID Document */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Document{" "}
                      <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, "documentID")}
                        className="hidden"
                        id="id-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        disabled={processingFile || isSubmitting}
                      />
                      <label
                        htmlFor="id-upload"
                        className={`flex items-center justify-center w-full px-4 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                          processingFile
                            ? "border-yellow-300 bg-yellow-50"
                            : formData.documentID
                            ? "border-green-500 bg-green-50 hover:bg-green-100"
                            : errors.documentID
                            ? "border-red-300 bg-red-50 hover:bg-red-100"
                            : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                        } ${
                          processingFile || isSubmitting
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {processingFile ? (
                            <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />
                          ) : (
                            <CloudArrowUpIcon
                              className={`h-6 w-6 ${
                                formData.documentID
                                  ? "text-green-500"
                                  : errors.documentID
                                  ? "text-red-500"
                                  : "text-gray-400"
                              }`}
                            />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              processingFile
                                ? "text-yellow-700"
                                : formData.documentID
                                ? "text-green-700"
                                : errors.documentID
                                ? "text-red-700"
                                : "text-gray-600"
                            }`}
                          >
                            {processingFile
                              ? "Processing file..."
                              : formData.documentID
                              ? formData.documentID.name
                              : "Click to upload ID document (required)"}
                          </span>
                        </div>
                      </label>
                    </div>
                    {errors.documentID && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.documentID}
                      </p>
                    )}
                  </div>

                  {/* Other Documents (Drag and Drop) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Other Documents{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                        processingFile
                          ? "border-yellow-300 bg-yellow-50"
                          : dragActive
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                      } ${
                        processingFile || isSubmitting
                          ? "cursor-not-allowed opacity-70"
                          : ""
                      }`}
                      onDragEnter={(e) =>
                        !processingFile && !isSubmitting && handleDrag(e, true)
                      }
                      onDragLeave={(e) =>
                        !processingFile && !isSubmitting && handleDrag(e, false)
                      }
                      onDragOver={(e) =>
                        !processingFile && !isSubmitting && handleDrag(e, true)
                      }
                      onDrop={(e) =>
                        !processingFile && !isSubmitting && handleDrop(e)
                      }
                    >
                      <div className="text-center">
                        {processingFile ? (
                          <div className="flex flex-col items-center">
                            <ArrowPathIcon className="h-12 w-12 text-yellow-500 animate-spin" />
                            <p className="mt-3 text-sm text-yellow-700">
                              Processing files...
                            </p>
                          </div>
                        ) : (
                          <>
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
                            <p className="mt-3 text-sm text-gray-600">
                              <span className="font-semibold">
                                Drag and drop files here
                              </span>
                              , or{" "}
                              <button
                                type="button"
                                onClick={() =>
                                  !processingFile &&
                                  !isSubmitting &&
                                  document.getElementById("other-docs").click()
                                }
                                className="text-blue-600 hover:text-blue-500 font-semibold"
                                disabled={processingFile || isSubmitting}
                              >
                                browse
                              </button>
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                            </p>
                          </>
                        )}
                        <input
                          type="file"
                          id="other-docs"
                          multiple
                          className="hidden"
                          onChange={(e) =>
                            handleMultipleFileChange(Array.from(e.target.files))
                          }
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          disabled={processingFile || isSubmitting}
                        />
                      </div>
                    </div>
                    {errors.otherDocuments && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.otherDocuments}
                      </p>
                    )}
                    {formData.otherDocuments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.otherDocuments.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <DocumentIcon className="h-5 w-5 text-gray-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {doc.name} (
                                {(doc.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOtherDocument(index)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors duration-200"
                              disabled={isSubmitting}
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Job Details Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-xl">
                    <UserIcon className="h-5 w-5 text-purple-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Job Details
                  </h2>
                </div>
                <div className="space-y-6">
                  {/* Assigned Person (Dynamic) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Person{" "}
                      <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="assignedPerson"
                        value={formData.assignedPerson}
                        onChange={handleInputChange}
                        className={`block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.assignedPerson ? "border-red-300" : ""
                        }`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select an assigned person</option>
                        {operationManagers.map((manager) => (
                          <option key={manager._id} value={manager._id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>

                      {/* User status badge */}
                      {formData.assignedPerson && (
                        <div className="mt-2">
                          {operationManagers
                            .filter((m) => m._id === formData.assignedPerson)
                            .map((person) => (
                              <div
                                key={person._id}
                                className="flex items-center space-x-2"
                              >
                                {person.status && (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                      person.status
                                    )}`}
                                  >
                                    {person.status}
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {errors.assignedPerson && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.assignedPerson}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Job Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Details{" "}
                      <span className="text-red-500 text-xs">*</span>
                      <span
                        className="ml-1 inline-block"
                        title="Provide detailed information about the job requirements"
                      >
                        <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 inline" />
                      </span>
                    </label>
                    <textarea
                      name="jobDetails"
                      value={formData.jobDetails}
                      onChange={handleInputChange}
                      rows={4}
                      className={`block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.jobDetails ? "border-red-300" : ""
                      }`}
                      placeholder="Enter detailed job requirements and specifications..."
                      disabled={isSubmitting}
                    />
                    {errors.jobDetails && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.jobDetails}
                      </p>
                    )}
                  </div>

                  {/* Special Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Description{" "}
                      <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      name="specialDescription"
                      value={formData.specialDescription}
                      onChange={handleInputChange}
                      rows={3}
                      className="block w-full rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any special instructions or additional information..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Client Information Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <BuildingOfficeIcon className="h-5 w-5 text-green-700" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Client Information
                  </h2>
                  {existingClient && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckIcon className="h-3.5 w-3.5 mr-1" />
                      Existing Client
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Client Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name{" "}
                      <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.clientName
                            ? "border-red-300"
                            : existingClient
                            ? "border-green-300 bg-green-50"
                            : ""
                        }`}
                        placeholder="Enter client's full name"
                        readOnly={!!existingClient}
                        disabled={isSubmitting}
                      />
                      {existingClient && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {errors.clientName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.clientName}
                      </p>
                    )}
                  </div>

                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address{" "}
                      <span className="text-red-500 text-xs">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="gmail"
                        value={formData.gmail}
                        onChange={handleInputChange}
                        onBlur={handleGmailBlur}
                        className={`block w-full pl-10 rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.gmail
                            ? "border-red-300"
                            : existingClient
                            ? "border-green-300 bg-green-50"
                            : ""
                        }`}
                        placeholder="Enter client's email address"
                        disabled={isSubmitting}
                      />
                      {checkingClient && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
                        </div>
                      )}
                      {existingClient && !checkingClient && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckIcon className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {errors.gmail && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.gmail}
                      </p>
                    )}
                    {existingClient && (
                      <p className="mt-1 text-sm text-green-600">
                        Existing client - job will be auto-approved
                      </p>
                    )}
                  </div>
                </div>

                {/* Starting Point */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Point{" "}
                    <span className="text-red-500 text-xs">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="startingPoint"
                      value={formData.startingPoint}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 rounded-xl border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.startingPoint
                          ? "border-red-300"
                          : existingClient
                          ? "border-green-300 bg-green-50"
                          : ""
                      }`}
                      placeholder="Enter the starting location"
                      readOnly={!!existingClient}
                      disabled={isSubmitting}
                    />
                    {existingClient && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {errors.startingPoint && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startingPoint}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Progress
                  </label>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 text-right">
                    {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || processingFile}
                  className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-semibold transition-all duration-200 ${
                    isSubmitting || processingFile
                      ? "opacity-80 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        <span>Creating Job...</span>
                      </>
                    ) : (
                      <>
                        <BriefcaseIcon className="h-5 w-5" />
                        <span>
                          {existingClient
                            ? "Create Auto-Approved Job"
                            : "Create Job"}
                        </span>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateJob;
