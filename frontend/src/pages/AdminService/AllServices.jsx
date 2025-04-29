import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

function AllServices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch services from the API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/services");
        // Ensure we're always setting an array
        const servicesData = Array.isArray(res.data) ? res.data : [];
        setServices(servicesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching services:", err);
        setError("Failed to load services. Please try again.");
        // Set services to empty array on error
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleDelete = async (serviceId) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await axios.delete(`/api/services/${serviceId}`);
        setServices(services.filter((service) => service._id !== serviceId));
      } catch (err) {
        console.error("Error deleting service:", err);
        alert("Failed to delete service. Please try again.");
      }
    }
  };

  const handleEdit = (serviceId) => {
    navigate(`/admin/services/edit/${serviceId}`);
  };

  // Only filter if services is an array
  const filteredServices = Array.isArray(services) 
    ? services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Safely calculate stats
  const totalServices = Array.isArray(services) ? services.length : 0;
  const totalUsage = Array.isArray(services) 
    ? services.reduce((sum, service) => sum + (service.usageCount || 0), 0)
    : 0;
  const activeServices = Array.isArray(services)
    ? services.filter((service) => service.status === "active").length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <BuildingStorefrontIcon className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Services Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage and monitor your service offerings
              </p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => navigate("/admin/services/add")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group"
            >
              <PlusIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Add New Service
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Services
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalServices}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckBadgeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Services
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeServices}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalUsage}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
              placeholder="Search services by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Loading services...
            </h3>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-12 h-12 flex items-center justify-center">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Error Loading Services
            </h3>
            <p className="mt-1 text-sm text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-200 group"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                          {service.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                          <CheckBadgeIcon className="h-4 w-4 mr-1" />
                          {service.status === "inactive"
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(service._id)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-end pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        {service.usageCount || 0} uses
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredServices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No services found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or add a new service.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default AllServices;