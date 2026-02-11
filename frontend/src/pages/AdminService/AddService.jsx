import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import axiosInstance from "../../utils/axios";

function AddService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [service, setService] = useState({
    name: "",
    description: "",
    status: "active",
    roles: [],
  });
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get("roles");
      setAllRoles(res.data || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  useEffect(() => {
    const fetchService = async () => {
      if (id) {
        try {
          setLoading(true);
          const res = await axiosInstance.get(`services/${id}`);

          if (res.data && typeof res.data === 'object') {
            setService({
              name: res.data.name || "",
              description: res.data.description || "",
              status: res.data.status || "active",
              roles: res.data.roles?.map(r => r._id || r) || [],
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
      if (id) {
        await axiosInstance.put(`services/${id}`, service);
      } else {
        await axiosInstance.post("services", service);
      }

      navigate("/admin/services");
    } catch (err) {
      console.error("Error saving service:", err.response || err);

      let errorMessage = "Failed to save service. Please check your inputs and try again.";

      if (err.response) {
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

  const toggleRole = (roleId) => {
    setService(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const isRoleSelected = (roleId) => {
    return service.roles.includes(roleId);
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Assigned Roles
                    </div>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Select the roles that can access this service
                  </p>

                  {allRoles.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 text-center">
                      No roles available. Please create roles first.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {allRoles.map((role) => (
                        <button
                          key={role._id}
                          type="button"
                          onClick={() => toggleRole(role._id)}
                          className={`relative flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            isRoleSelected(role._id)
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium text-sm capitalize">{role.name}</span>
                          {isRoleSelected(role._id) && (
                            <CheckIcon className="h-5 w-5 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {service.roles.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs text-gray-500">Selected:</span>
                      {service.roles.map((roleId) => {
                        const role = allRoles.find(r => r._id === roleId);
                        return role ? (
                          <span
                            key={roleId}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {role.name}
                            <button
                              type="button"
                              onClick={() => toggleRole(roleId)}
                              className="ml-1.5 hover:text-indigo-600"
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
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