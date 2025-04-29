import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import axiosInstance from "../../utils/axios"; // CHANGED: Use axiosInstance instead of axios

function AddService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [authInfo, setAuthInfo] = useState(null); // DEBUG: Added to check auth state

  // DEBUG: Check authentication state on load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setAuthInfo({
      isLoggedIn: !!user.token,
      hasToken: !!user.token,
      roles: user.roles || []
    });
    console.log('Current user state:', user);
  }, []);

  // Fetch service data if editing
  useEffect(() => {
    const fetchService = async () => {
      if (id) {
        try {
          setLoading(true);
          console.log('Fetching service with ID:', id);
          
          const res = await axiosInstance.get(`services/${id}`); // CHANGED: Use axiosInstance & removed /api prefix
          
          if (res.data && typeof res.data === 'object') {
            setService({
              name: res.data.name || "",
              description: res.data.description || "",
              status: res.data.status || "active",
            });
            setError(null);
          } else {
            throw new Error("Invalid data format received from server");
          }
        } catch (err) {
          console.error("Error fetching service:", err.response || err);
          setError(
            err.response?.data?.message || 
            "Failed to load service details. Please try again."
          );
        } finally {
          setLoading(false);
        }
      }
    };

    fetchService();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Debug: Log the request details
      console.log('Submitting service with data:', service);
      console.log('Auth info:', authInfo);
      
      if (id) {
        // Update existing service
        await axiosInstance.put(`services/${id}`, service); // CHANGED: Use axiosInstance & removed /api prefix
      } else {
        // Create new service
        await axiosInstance.post("services", service); // CHANGED: Use axiosInstance & removed /api prefix
      }

      navigate("/admin/services");
    } catch (err) {
      console.error("Error saving service:", err.response || err);
      
      // More detailed error handling
      let errorMessage = "Failed to save service. Please check your inputs and try again.";
      
      if (err.response) {
        console.error("Response status:", err.response.status);
        console.error("Response data:", err.response.data);
        
        if (err.response.status === 401) {
          errorMessage = "Authentication error. Please log in again.";
        } else if (err.response.status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (err.response.status === 405) {
          errorMessage = "This operation is not allowed. Please contact support.";
        }
        
        errorMessage = err.response.data?.message || errorMessage;
      }
      
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-all duration-200"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {id ? "Edit Service" : "Add New Service"}
            </h1>
          </div>
        </div>

        {/* Auth Debug Info - Remove in production */}
        {authInfo && (
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-md text-xs">
            <p><strong>Debug Auth Info:</strong></p>
            <p>Logged in: {authInfo.isLoggedIn ? 'Yes' : 'No'}</p>
            <p>Token exists: {authInfo.hasToken ? 'Yes' : 'No'}</p>
            <p>Roles: {authInfo.roles.length > 0 ? authInfo.roles.join(', ') : 'None'}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-8 w-8 border-4 border-t-blue-500 border-gray-200 rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">
              Loading service details...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon
                  className="h-5 w-5 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) =>
                      setService({ ...service, name: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter service name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={service.description}
                    onChange={(e) =>
                      setService({ ...service, description: e.target.value })
                    }
                    rows={4}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe the service..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={service.status}
                    onChange={(e) =>
                      setService({ ...service, status: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm font-medium transition-all duration-200 ${
                    submitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center">
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
                      Saving...
                    </span>
                  ) : id ? (
                    "Update Service"
                  ) : (
                    "Create Service"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AddService;