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

function ClientSubmissionForm() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const removeFile = (fieldName) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fieldName];
      return newFiles;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = formData.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (field.type === "file") {
        if (!files[field.name]) {
          alert(`Please upload ${field.label}`);
          return;
        }
      } else if (field.type === "checkbox") {
        if (!values[field.name]) {
          alert(`Please check ${field.label}`);
          return;
        }
      } else {
        if (!values[field.name]) {
          alert(`Please fill in ${field.label}`);
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);

      const submitData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      Object.entries(files).forEach(([key, file]) => {
        submitData.append(key, file);
      });

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
            Your documents have been submitted successfully. We will review them and get back to you.
          </p>
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
            {formData.message && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-blue-800 whitespace-pre-wrap">{formData.message}</p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <ClockIcon className="h-4 w-4" />
              <span>Please submit before {formatExpiryDate(formData.expiresAt)}</span>
            </div>

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
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Submitting...
                  </div>
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
    </div>
  );
}

export default ClientSubmissionForm;
