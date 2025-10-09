import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  BriefcaseIcon,
  ArrowDownTrayIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../../utils/axios";

function AllClients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [sortBy, setSortBy] = useState("latest"); // Sort options: latest, name, jobCount

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset pagination when search query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return; // Only reset when debounced query matches current query
    
    setPagination(prev => ({
      ...prev,
      currentPage: 1 // Reset to first page when searching
    }));
  }, [debouncedSearchQuery]);

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      
      // If there's a search query, fetch ALL clients to search through them
      // Otherwise, use normal pagination
      const params = debouncedSearchQuery 
        ? {
            page: 1,
            limit: 1000, // Fetch all clients when searching
          }
        : {
            page: pagination.currentPage,
            limit: pagination.itemsPerPage,
          };

      const response = await axiosInstance.get("/clients/all", { params });

      console.log("API Response:", response.data);
      setClients(response.data.clients || []);
      
      // Only update pagination if we're not searching (to maintain normal pagination)
      if (!debouncedSearchQuery) {
        setPagination(response.data.pagination || pagination);
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.response?.data?.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchQuery, sortBy]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filter and sort clients (now works on all fetched clients)
  const filteredAndSortedClients = clients
    .filter((client) => {
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        return (
          client.name?.toLowerCase().includes(searchLower) ||
          client.gmail?.toLowerCase().includes(searchLower) ||
          client.startingPoint?.toLowerCase().includes(searchLower) ||
          // Add search by latest service type
          client.latestServiceType?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return (
            new Date(b.latestJobDate || 0) - new Date(a.latestJobDate || 0)
          );
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "jobCount":
          return (b.jobCount || 0) - (a.jobCount || 0);
        default:
          return 0;
      }
    });

  // When searching, show all results. When not searching, show paginated results.
  const displayedClients = debouncedSearchQuery 
    ? filteredAndSortedClients 
    : filteredAndSortedClients;

  // Convert clients data to CSV format
// Modified convertToCSV function - QFC Number, Client Name, Services only
const convertToCSV = (data) => {
  const headers = [
    "QFC Number", 
    "Client Name", 
    "Services"
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((client) => {
      // Extract all service types from jobs array
      let services = "N/A";
      
      if (client.jobs && client.jobs.length > 0) {
        // Get all unique service types from client's jobs
        const allServices = client.jobs
          .map(job => job.serviceType)
          .filter(Boolean)
          .join("; ");
        services = allServices || client.latestServiceType || "N/A";
      } else if (client.latestServiceType) {
        services = client.latestServiceType;
      }

      // For QFC Number, we'll use job numbers from jobs array or create a general client reference
      let qfcNumbers = "N/A";
      if (client.jobs && client.jobs.length > 0) {
        qfcNumbers = client.jobs
          .map(job => job.jobNumber || job._id)
          .filter(Boolean)
          .join("; ");
      }

      return [
        `"${qfcNumbers.replace(/"/g, '""')}"`,
        `"${(client.name || "").replace(/"/g, '""')}"`,
        `"${services.replace(/"/g, '""')}"`
      ].join(",");
    }),
  ].join("\n");

  return csvContent;
};

// Modified exportClients function for QFC data export
const exportQFCData = async () => {
  try {
    setExporting(true);

    let clientsToExport;

    if (debouncedSearchQuery) {
      // If searching, fetch detailed data for filtered results
      console.log(`Fetching QFC data for ${filteredAndSortedClients.length} filtered clients...`);
      const detailedClients = [];
      
      // Process clients in batches
      const batchSize = 5;
      for (let i = 0; i < filteredAndSortedClients.length; i += batchSize) {
        const batch = filteredAndSortedClients.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filteredAndSortedClients.length/batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(client => fetchClientDetails(client))
        );
        
        detailedClients.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < filteredAndSortedClients.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      clientsToExport = detailedClients;
    } else {
      // Fetch all clients with their job details
      const response = await axiosInstance.get("/clients/all", {
        params: {
          page: 1,
          limit: 1000, // Get all clients
        },
      });
      
      const allClients = (response.data.clients || []).sort((a, b) => {
        switch (sortBy) {
          case "latest":
            return (
              new Date(b.latestJobDate || 0) - new Date(a.latestJobDate || 0)
            );
          case "name":
            return (a.name || "").localeCompare(b.name || "");
          case "jobCount":
            return (b.jobCount || 0) - (a.jobCount || 0);
          default:
            return 0;
        }
      });

      // Fetch detailed information for each client
      console.log(`Fetching QFC data for ${allClients.length} clients...`);
      const detailedClients = [];
      
      // Process in batches to avoid server overload
      const batchSize = 10;
      for (let i = 0; i < allClients.length; i += batchSize) {
        const batch = allClients.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allClients.length/batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(async (client) => {
            try {
              const response = await axiosInstance.get(`/clients/${client.gmail}`);
              return {
                ...client,
                jobs: response.data.jobs || [],
              };
            } catch (error) {
              console.error(`Error fetching details for ${client.gmail}:`, error);
              return {
                ...client,
                jobs: [],
              };
            }
          })
        );
        
        detailedClients.push(...batchResults);
        
        // Small delay between batches
        if (i + batchSize < allClients.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      clientsToExport = detailedClients;
    }

    // Convert to CSV with simplified format
    const csvContent = convertToCSV(clientsToExport);

    // Generate filename with current date
    const now = new Date();
    const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const searchSuffix = debouncedSearchQuery ? `_filtered_${debouncedSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
    const filename = `QFC_Data_${timestamp}${searchSuffix}.csv`;

    // Download the file
    downloadCSV(csvContent, filename);

    console.log(`QFC Data exported successfully: ${clientsToExport.length} records exported to ${filename}`);
    
  } catch (err) {
    console.error("QFC Export failed:", err);
    setError("Failed to export QFC data. Please try again.");
  } finally {
    setExporting(false);
  }
};

// Alternative version if you want to export ALL jobs separately (not grouped by client)
const exportAllJobsQFC = async () => {
  try {
    setExporting(true);
    
    // Fetch all jobs directly from jobs endpoint (if available)
    const response = await axiosInstance.get("/jobs/all", {
      params: {
        page: 1,
        limit: 1000,
      },
    });
    
    const allJobs = response.data.jobs || [];
    
    const headers = ["QFC Number", "Client Name", "Services"];
    
    const csvContent = [
      headers.join(","),
      ...allJobs.map((job) => {
        return [
          `"${(job.jobNumber || job._id || "").replace(/"/g, '""')}"`,
          `"${(job.clientName || "").replace(/"/g, '""')}"`,
          `"${(job.serviceType || "").replace(/"/g, '""')}"`
        ].join(",");
      }),
    ].join("\n");

    // Generate filename
    const now = new Date();
    const timestamp = now.toISOString().split("T")[0];
    const filename = `QFC_Jobs_${timestamp}.csv`;

    // Download the file
    downloadCSV(csvContent, filename);

    console.log(`QFC Jobs exported: ${allJobs.length} jobs exported to ${filename}`);
    
  } catch (err) {
    console.error("QFC Jobs Export failed:", err);
    setError("Failed to export QFC jobs data. Please try again.");
  } finally {
    setExporting(false);
  }
};

  // Download CSV file
  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Helper function to fetch client details with retry logic
  const fetchClientDetails = async (client, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add small delay to avoid overwhelming the server
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
        }
        
        const response = await axiosInstance.get(`/clients/${client.gmail}`);
        return {
          ...client,
          jobs: response.data.jobs || [],
        };
      } catch (error) {
        if (attempt === retries) {
          console.error(`Final attempt failed for ${client.gmail}:`, error);
          return {
            ...client,
            jobs: [],
          };
        }
        console.warn(`Attempt ${attempt + 1} failed for ${client.gmail}, retrying...`);
      }
    }
  };

  // Export clients function
  const exportClients = async () => {
    try {
      setExporting(true);

      let clientsToExport;

      if (debouncedSearchQuery) {
        // If searching, we need to fetch detailed data for filtered results
        console.log(`Fetching detailed information for ${filteredAndSortedClients.length} filtered clients...`);
        const detailedClients = [];
        
        // Process clients in batches to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < filteredAndSortedClients.length; i += batchSize) {
          const batch = filteredAndSortedClients.slice(i, i + batchSize);
          console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filteredAndSortedClients.length/batchSize)}`);
          
          const batchResults = await Promise.all(
            batch.map(client => fetchClientDetails(client))
          );
          
          detailedClients.push(...batchResults);
          
          // Small delay between batches
          if (i + batchSize < filteredAndSortedClients.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        clientsToExport = detailedClients;
      } else {
        // If not searching, fetch all clients first, then get detailed data for each
        const response = await axiosInstance.get("/clients/all", {
          params: {
            page: 1,
            limit: 1000, // Get all clients
          },
        });
        
        const allClients = (response.data.clients || []).sort((a, b) => {
          switch (sortBy) {
            case "latest":
              return (
                new Date(b.latestJobDate || 0) - new Date(a.latestJobDate || 0)
              );
            case "name":
              return (a.name || "").localeCompare(b.name || "");
            case "jobCount":
              return (b.jobCount || 0) - (a.jobCount || 0);
            default:
              return 0;
          }
        });

        // Fetch detailed information for each client
        console.log(`Fetching detailed information for ${allClients.length} clients...`);
        const detailedClients = await Promise.all(
          allClients.map(async (client, index) => {
            try {
              // Log progress for large exports
              if (index % 10 === 0) {
                console.log(`Processing client ${index + 1}/${allClients.length}: ${client.name}`);
              }
              
              // Fetch detailed client data including all jobs/services
              const response = await axiosInstance.get(`/clients/${client.gmail}`);
              return {
                ...client,
                jobs: response.data.jobs || [], // Add jobs array with all services
              };
            } catch (error) {
              console.error(`Error fetching details for ${client.gmail}:`, error);
              // Return client without detailed job info if fetch fails
              return {
                ...client,
                jobs: [],
              };
            }
          })
        );
        
        clientsToExport = detailedClients;
      }

      // Convert to CSV
      const csvContent = convertToCSV(clientsToExport);

      // Check if any clients failed to fetch detailed info
      const clientsWithoutDetails = clientsToExport.filter(client => !client.jobs || client.jobs.length === 0);
      if (clientsWithoutDetails.length > 0) {
        console.warn(`Warning: ${clientsWithoutDetails.length} clients may have incomplete service information due to fetch errors.`);
      }

      // Generate filename with current date
      const now = new Date();
      const timestamp = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      const searchSuffix = debouncedSearchQuery ? `_filtered_${debouncedSearchQuery.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
      const filename = `clients_export_${timestamp}${searchSuffix}.csv`;

      // Download the file
      downloadCSV(csvContent, filename);

      // Show success message (optional)
      const successMessage = clientsWithoutDetails.length > 0 
        ? `Exported ${clientsToExport.length} clients with detailed service information to ${filename}. Note: ${clientsWithoutDetails.length} clients may have incomplete service data.`
        : `Exported ${clientsToExport.length} clients with detailed service information to ${filename}`;
      
      console.log(successMessage);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export clients. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Handle client selection
  const handleViewClient = (gmail) => {
    navigate(`/clients/${gmail}`);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle sort change
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page when sorting
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  if (error && clients.length === 0) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900 mt-4">
            Error Loading Clients
          </h2>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-indigo-50 to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              All Clients
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              View and manage all clients in the system
              {debouncedSearchQuery && (
                <span className="ml-2 text-sm text-blue-600">
                  (Filtered by: "{debouncedSearchQuery}")
                </span>
              )}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:flex-none">
            <button
              onClick={exportClients}
              disabled={exporting}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm font-medium group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon
                className={`h-5 w-5 mr-2 ${
                  exporting ? "animate-bounce" : "group-hover:animate-bounce"
                }`}
              />
              {exporting ? "Exporting..." : "Export Clients"}
            </button>
          </div>
        </div>

        {/* Export Status Message */}
        {exporting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
              <p className="text-blue-700 text-sm">
                Fetching detailed client information for export... This may take a few moments.
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-xl">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {debouncedSearchQuery ? "Found Clients" : "Total Clients"}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {debouncedSearchQuery ? filteredAndSortedClients.length : (pagination.totalItems || clients.length)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BriefcaseIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(debouncedSearchQuery ? filteredAndSortedClients : clients).reduce(
                    (sum, client) => sum + (client.activeJobCount || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Engagement Letters
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(debouncedSearchQuery ? filteredAndSortedClients : clients).filter((client) => 
                    client.engagementLetter && 
                    (Array.isArray(client.engagementLetter) ? client.engagementLetter.length > 0 : client.engagementLetter)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Sort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                    placeholder="Search clients by name, email, starting point, or latest service type..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {loading && debouncedSearchQuery && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl text-sm transition-all duration-200"
                >
                  <option value="latest">Sort by Latest Job</option>
                  <option value="name">Sort by Name</option>
                  <option value="jobCount">Sort by Job Count</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Clients List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden relative"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {filteredAndSortedClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Client
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]"
                    >
                      Jobs & Services
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Latest Job
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Engagement Letter
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredAndSortedClients.map((client, index) => (
                      <motion.tr
                        key={client._id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => handleViewClient(client.gmail)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <EnvelopeIcon className="h-3.5 w-3.5 mr-1" />
                                {client.gmail}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <BuildingOfficeIcon className="h-3.5 w-3.5 mr-1" />
                                {client.startingPoint}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            {/* Job Counts */}
                            <div className="flex items-center space-x-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {client.jobCount || 0} Total
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.activeJobCount || 0} Active
                              </div>
                            </div>
                            
                            {/* Latest Service Type */}
                            <div className="flex flex-wrap gap-1">
                              {client.latestServiceType ? (
                                <div className="flex items-center space-x-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200">
                                    <BriefcaseIcon className="h-3 w-3 mr-1" />
                                    {client.latestServiceType}
                                  </span>
                                  {client.jobCount > 1 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                      +{client.jobCount - 1} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">
                                  No services available
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.latestJobDate ? (
                            <>
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  client.latestJobDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.latestServiceType || "N/A"}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {client.engagementLetter && 
                           (Array.isArray(client.engagementLetter) ? client.engagementLetter.length > 0 : client.engagementLetter) ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle multiple engagement letters
                                if (Array.isArray(client.engagementLetter) && client.engagementLetter.length > 0) {
                                  window.open(client.engagementLetter[0].fileUrl, "_blank");
                                } else if (typeof client.engagementLetter === 'string') {
                                  window.open(client.engagementLetter, "_blank");
                                }
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                            >
                              <DocumentTextIcon className="h-4 w-4 mr-1" />
                              View {Array.isArray(client.engagementLetter) && client.engagementLetter.length > 1 
                                ? `(${client.engagementLetter.length})` 
                                : ''}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Not available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewClient(client.gmail);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                              title="View Client Profile"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No clients found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {error
                  ? `Error: ${error}`
                  : debouncedSearchQuery
                  ? `No clients match your search for "${debouncedSearchQuery}".`
                  : "There are no clients in the system yet."}
              </p>
              {debouncedSearchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Pagination Controls - Hide when searching client-side */}
          {pagination.totalPages > 1 && !debouncedSearchQuery && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      currentPage: Math.max(1, pagination.currentPage - 1),
                    })
                  }
                  disabled={pagination.currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination({
                      ...pagination,
                      currentPage: Math.min(
                        pagination.totalPages,
                        pagination.currentPage + 1
                      ),
                    })
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">
                      {Math.min(
                        1 +
                          (pagination.currentPage - 1) *
                            pagination.itemsPerPage,
                        pagination.totalItems
                      )}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        pagination.currentPage * pagination.itemsPerPage,
                        pagination.totalItems
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.totalItems}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: Math.max(1, pagination.currentPage - 1),
                        })
                      }
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {Array.from({ length: pagination.totalPages }).map(
                      (_, i) => (
                        <button
                          key={i + 1}
                          onClick={() =>
                            setPagination({
                              ...pagination,
                              currentPage: i + 1,
                            })
                          }
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.currentPage === i + 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          currentPage: Math.min(
                            pagination.totalPages,
                            pagination.currentPage + 1
                          ),
                        })
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default AllClients;