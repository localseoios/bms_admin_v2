import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";

const getApiUrl = () => {
  let url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  if (!url.endsWith("/api")) {
    url = url.replace(/\/$/, "") + "/api";
  }
  return url;
};

const API_URL = getApiUrl();

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long Text" },
  { value: "file", label: "File Upload" },
  { value: "multifile", label: "Multiple Files" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
];

function ClientSubmissionForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [multiFiles, setMultiFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [customerAddedFields, setCustomerAddedFields] = useState([]);
  const [showPreviousSubmissions, setShowPreviousSubmissions] = useState(false);
  const [showAddFieldForm, setShowAddFieldForm] = useState(false);
  const [newField, setNewField] = useState({ label: "", type: "text" });
  const [editMode, setEditMode] = useState(false);
  const [editSubmissionId, setEditSubmissionId] = useState(null);
  const [existingFiles, setExistingFiles] = useState({});
  const [existingMultiFiles, setExistingMultiFiles] = useState({});
  const [deletedExistingFiles, setDeletedExistingFiles] = useState({});
  const [deletedExistingMultiFiles, setDeletedExistingMultiFiles] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [token]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/public/submit/${token}`);
      setFormData(response.data);

      const initialValues = {};
      response.data.fields.forEach((field) => {
        initialValues[field.name] = field.type === "checkbox" ? false : "";
      });

      if (response.data.lastSubmission) {
        setEditMode(true);
        setEditSubmissionId(response.data.lastSubmission._id);

        const existingFilesData = {};
        const existingMultiFilesData = {};

        response.data.lastSubmission.submittedFields.forEach((submittedField) => {
          if (submittedField.fieldType === "checkbox") {
            initialValues[submittedField.fieldName] = submittedField.value === true || submittedField.value === "true";
          } else if (submittedField.fieldType === "file" && submittedField.fileUrl) {
            existingFilesData[submittedField.fieldName] = {
              fileName: submittedField.fileName,
              fileUrl: submittedField.fileUrl,
            };
          } else if (submittedField.fieldType === "multifile" && submittedField.files?.length > 0) {
            existingMultiFilesData[submittedField.fieldName] = submittedField.files;
          } else if (submittedField.fieldType !== "file" && submittedField.fieldType !== "multifile") {
            initialValues[submittedField.fieldName] = submittedField.value || "";
          }
        });

        setExistingFiles(existingFilesData);
        setExistingMultiFiles(existingMultiFilesData);

        const existingFieldNames = response.data.fields.map(f => f.name);
        const customerFields = response.data.lastSubmission.submittedFields
          .filter((f) => f.addedByCustomer && !existingFieldNames.includes(f.fieldName))
          .map((f) => ({
            name: f.fieldName,
            label: f.fieldLabel,
            type: f.fieldType,
            required: false,
            addedByCustomer: true,
          }));
        setCustomerAddedFields(customerFields);
      }

      setValues(initialValues);
      setError(null);
    } catch (err) {
      console.error("Error fetching form:", err);
      setError(err.response?.data?.message || "Failed to load form");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleFileChange = (fieldName, file) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleMultiFileChange = (fieldName, newFiles) => {
    setMultiFiles((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), ...Array.from(newFiles)],
    }));
  };

  const removeMultiFile = (fieldName, index) => {
    setMultiFiles((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const removeFile = (fieldName) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const deleteExistingFile = (fieldName) => {
    setDeletedExistingFiles((prev) => ({ ...prev, [fieldName]: true }));
    setExistingFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const deleteExistingMultiFile = (fieldName, index) => {
    setDeletedExistingMultiFiles((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), index],
    }));
    setExistingMultiFiles((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const addCustomerField = () => {
    if (!newField.label.trim()) {
      alert("Please enter a field label");
      return;
    }
    const fieldName = `customer_field_${Date.now()}`;
    setCustomerAddedFields((prev) => [
      ...prev,
      {
        name: fieldName,
        label: newField.label,
        type: newField.type,
        required: false,
        addedByCustomer: true,
      },
    ]);
    setValues((prev) => ({
      ...prev,
      [fieldName]: newField.type === "checkbox" ? false : "",
    }));
    setNewField({ label: "", type: "text" });
    setShowAddFieldForm(false);
  };

  const removeCustomerField = (fieldName) => {
    setCustomerAddedFields((prev) => prev.filter((f) => f.name !== fieldName));
    setValues((prev) => {
      const newValues = { ...prev };
      delete newValues[fieldName];
      return newValues;
    });
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
    setMultiFiles((prev) => {
      const newMultiFiles = { ...prev };
      delete newMultiFiles[fieldName];
      return newMultiFiles;
    });
  };

  const validateForm = () => {
    const requiredFields = formData.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (field.type === "file") {
        if (!files[field.name] && !existingFiles[field.name]) {
          alert(`Please upload ${field.label}`);
          return false;
        }
      } else if (field.type === "multifile") {
        const hasNewFiles = multiFiles[field.name] && multiFiles[field.name].length > 0;
        const hasExistingFiles = existingMultiFiles[field.name] && existingMultiFiles[field.name].length > 0;
        if (!hasNewFiles && !hasExistingFiles) {
          alert(`Please upload at least one file for ${field.label}`);
          return false;
        }
      } else if (field.type === "checkbox") {
        if (!values[field.name]) {
          alert(`Please check ${field.label}`);
          return false;
        }
      } else {
        if (!values[field.name]) {
          alert(`Please fill in ${field.label}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  const confirmSubmit = async () => {
    setShowConfirmModal(false);

    try {
      setIsSubmitting(true);

      const submitData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      Object.entries(files).forEach(([key, file]) => {
        submitData.append(key, file);
      });
      Object.entries(multiFiles).forEach(([key, fileArray]) => {
        fileArray.forEach((file, index) => {
          submitData.append(`${key}_${index}`, file);
        });
      });

      if (customerAddedFields.length > 0) {
        submitData.append("customerAddedFields", JSON.stringify(customerAddedFields));
      }

      if (editMode && editSubmissionId) {
        submitData.append("editSubmissionId", editSubmissionId);

        const preservedFiles = {};
        Object.entries(existingFiles).forEach(([fieldName, fileData]) => {
          if (!files[fieldName]) {
            preservedFiles[fieldName] = fileData;
          }
        });
        submitData.append("preservedFiles", JSON.stringify(preservedFiles));

        const preservedMultiFiles = {};
        Object.entries(existingMultiFiles).forEach(([fieldName, filesArray]) => {
          if (filesArray && filesArray.length > 0) {
            preservedMultiFiles[fieldName] = filesArray;
          }
        });
        submitData.append("preservedMultiFiles", JSON.stringify(preservedMultiFiles));
      }

      await axios.post(`${API_URL}/public/submit/${token}`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIsSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit form");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatExpiryDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Unable to Load Form</h1>
          <p className="mt-2 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Thank You!</h1>
          <p className="mt-2 text-gray-600">
            {editMode
              ? "Your documents have been updated successfully. We will review them and get back to you."
              : "Your documents have been submitted successfully. We will review them and get back to you."}
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setFiles({});
              setMultiFiles({});
              fetchForm();
            }}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {editMode ? "Edit Again" : "View Form"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold">{formData.subject}</h1>
            {formData.clientName && (
              <p className="mt-1 text-blue-100">Hello, {formData.clientName}</p>
            )}
          </div>

          <div className="p-6">
            {editMode && (
              <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">You have already submitted this form.</p>
                </div>
                <p className="text-green-700 text-sm mt-1">You can update your submission below. Your previous data has been pre-filled.</p>
              </div>
            )}

            {formData.message && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-blue-800 whitespace-pre-wrap">{formData.message}</p>
              </div>
            )}

            {!formData.noExpiry && formData.expiresAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <ClockIcon className="h-4 w-4" />
                <span>Please submit before {formatExpiryDate(formData.expiresAt)}</span>
              </div>
            )}

            {formData.allowMultipleSubmissions && formData.previousSubmissions?.length > 0 && (
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setShowPreviousSubmissions(!showPreviousSubmissions)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPreviousSubmissions ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                  View Previous Submissions ({formData.submissionCount})
                </button>
                {showPreviousSubmissions && (
                  <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-4">
                    {formData.previousSubmissions.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                        <span className="text-gray-600">
                          Submitted on {new Date(sub.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          sub.status === "processed" ? "bg-green-100 text-green-700" :
                          sub.status === "reviewed" ? "bg-blue-100 text-blue-700" :
                          sub.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {formData.fields.map((field, index) => (
                <div key={field.name || index}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}

                  {field.type === "email" && (
                    <input
                      type="email"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}

                  {field.type === "phone" && (
                    <input
                      type="tel"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    />
                  )}

                  {field.type === "select" && (
                    <select
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    >
                      <option value="">Select an option</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === "checkbox" && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={values[field.name] || false}
                        onChange={(e) => handleInputChange(field.name, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        required={field.required}
                      />
                      <span className="ml-2 text-gray-600">{field.placeholder || "Yes"}</span>
                    </div>
                  )}

                  {field.type === "file" && (
                    <div>
                      {files[field.name] ? (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                            <span className="text-sm text-gray-700">{files[field.name].name}</span>
                            <span className="text-xs text-green-600">(New)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(field.name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : existingFiles[field.name] ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <DocumentTextIcon className="h-5 w-5 text-green-600" />
                              <a
                                href={existingFiles[field.name].fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-green-700 hover:underline"
                              >
                                {existingFiles[field.name].fileName}
                              </a>
                              <span className="text-xs text-green-600">(Previously uploaded)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteExistingFile(field.name)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Delete this file"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                          <label className="flex items-center justify-center w-full py-2 border border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <ArrowUpTrayIcon className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-500">Replace with new file</span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ArrowUpTrayIcon className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">
                              <span className="font-medium text-blue-600">Click to upload</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max 50MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {field.type === "multifile" && (
                    <div>
                      {existingMultiFiles[field.name]?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-green-600 font-medium">Previously uploaded files:</p>
                          {existingMultiFiles[field.name].map((file, idx) => (
                            <div key={`existing-${idx}`} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2">
                                <DocumentDuplicateIcon className="h-4 w-4 text-green-600" />
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-green-700 hover:underline truncate max-w-xs"
                                >
                                  {file.fileName}
                                </a>
                              </div>
                              <button
                                type="button"
                                onClick={() => deleteExistingMultiFile(field.name, idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Delete this file"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {multiFiles[field.name]?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <p className="text-xs text-blue-600 font-medium">New files to upload:</p>
                          {multiFiles[field.name].map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center gap-2">
                                <DocumentDuplicateIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMultiFile(field.name, idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center py-4">
                          <DocumentDuplicateIcon className="w-7 h-7 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-blue-600">Click to add {existingMultiFiles[field.name]?.length ? "more " : ""}files</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            You can upload multiple files
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => handleMultiFileChange(field.name, e.target.files)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}

              {customerAddedFields.map((field, index) => (
                <div key={field.name} className="relative bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeCustomerField(field.name)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    <span className="ml-2 text-xs text-green-600">(Added by you)</span>
                  </label>

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {field.type === "email" && (
                    <input
                      type="email"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {field.type === "phone" && (
                    <input
                      type="tel"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {field.type === "date" && (
                    <input
                      type="date"
                      value={values[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}

                  {field.type === "file" && (
                    <div>
                      {files[field.name] ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                            <span className="text-sm text-gray-700">{files[field.name].name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(field.name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                          <ArrowUpTrayIcon className="w-6 h-6 mb-1 text-gray-400" />
                          <p className="text-sm text-gray-500">Click to upload</p>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {field.type === "multifile" && (
                    <div>
                      {multiFiles[field.name]?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {multiFiles[field.name].map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <DocumentDuplicateIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMultiFile(field.name, idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50">
                        <DocumentDuplicateIcon className="w-6 h-6 mb-1 text-gray-400" />
                        <p className="text-sm text-gray-500">Add multiple files</p>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          onChange={(e) => handleMultiFileChange(field.name, e.target.files)}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}

              {formData.allowCustomerFields && (
                <div className="border-t border-gray-200 pt-6">
                  {showAddFieldForm ? (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-3">Add Your Own Field</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Field Label</label>
                          <input
                            type="text"
                            value={newField.label}
                            onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                            placeholder="Enter field name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Field Type</label>
                          <select
                            value={newField.type}
                            onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            {fieldTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={addCustomerField}
                            className="flex-1 py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                          >
                            Add Field
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddFieldForm(false);
                              setNewField({ label: "", type: "text" });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddFieldForm(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Additional Field
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  editMode
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:ring-green-500"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {editMode ? "Updating..." : "Submitting..."}
                  </div>
                ) : editMode ? (
                  "Update Documents"
                ) : (
                  "Submit Documents"
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Powered by BMS | Developed by LocalSEO (Pvt) Ltd.
            </p>
          </div>
        </motion.div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
              <h3 className="text-lg font-semibold">Confirm Submission</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ExclamationCircleIcon className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-gray-700">
                  {editMode
                    ? "Are you sure you want to update your submission? Your previous data will be replaced with the new information."
                    : "Are you sure you want to submit this form? Please make sure all the information is correct before proceeding."}
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className={`flex-1 py-2.5 px-4 text-white font-medium rounded-lg transition-colors ${
                    editMode
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {editMode ? "Yes, Update" : "Yes, Submit"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default ClientSubmissionForm;
