import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";
import PaymentManagementTab from "./PaymentManagementTab";

const ClientPaymentDetails = () => {
  const { gmail } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [client, setClient] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedJobType, setSelectedJobType] = useState(null);

  // Fetch client and jobs data
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get client details - this won't throw errors now with our updated accountService
        const clientData = await accountService.getClientDetails(gmail);
        setClient(clientData);

        // Get client's jobs - also won't throw errors with updated accountService
        const jobsData = await accountService.getCompletedJobs(1, 100, gmail);

        console.log("Jobs data returned:", jobsData);

        // Handle different response formats
        let jobsArray = [];
        if (Array.isArray(jobsData)) {
          jobsArray = jobsData;
        } else if (jobsData?.jobs && Array.isArray(jobsData.jobs)) {
          jobsArray = jobsData.jobs;
        }

        // Filter to find jobs matching this client's email
        const clientJobs = jobsArray.filter(
          (job) =>
            job.gmail === gmail ||
            job.clientEmail === gmail ||
            (job.clientId && job.clientId.gmail === gmail)
        );

        console.log(`Found ${clientJobs.length} jobs for client ${gmail}`);

        // Filter only completed jobs
        const completedJobs = clientJobs.filter(
          (job) =>
            job.status === "om_completed" ||
            job.status === "completed" ||
            job.status.includes("kyc") ||
            job.status.includes("bra")
        );

        setJobs(completedJobs);

        // Set first job as selected by default if available
        if (completedJobs.length > 0) {
          setSelectedJobId(completedJobs[0]._id);
          setSelectedJobType(completedJobs[0].serviceType);
        }
      } catch (err) {
        console.error("Error fetching client data:", err);
        setError("Failed to load client information. Please try again.");

        // Set minimal client data even on error
        setClient({
          name: gmail.split("@")[0],
          email: gmail,
        });
      } finally {
        setLoading(false);
      }
    };

    if (gmail) {
      fetchClientData();
    }
  }, [gmail]);

  // Function to refresh data with error handling
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get client jobs - our updated service makes sure this doesn't throw
      let jobsData;
      try {
        // Try using the payment-eligible endpoint first
        const eligibleJobsResponse = await accountService.getCompletedJobs(
          1,
          100,
          gmail
        );

        // Extract jobs array
        if (Array.isArray(eligibleJobsResponse)) {
          jobsData = eligibleJobsResponse;
        } else if (eligibleJobsResponse?.jobs) {
          jobsData = eligibleJobsResponse.jobs;
        } else {
          jobsData = [];
        }
      } catch (jobsError) {
        console.warn(
          "Error with payment-eligible endpoint, trying search:",
          jobsError
        );
        // Fallback to regular jobs endpoint with search
        const response = await axiosInstance.get(`/jobs`, {
          params: { search: gmail },
        });
        jobsData = Array.isArray(response.data)
          ? response.data
          : response.data?.jobs
          ? response.data.jobs
          : [];
      }

      // Filter jobs for this client
      const clientJobs = jobsData.filter(
        (job) =>
          job.gmail === gmail ||
          job.clientEmail === gmail ||
          (job.clientId && job.clientId.gmail === gmail)
      );

      // Filter completed jobs
      const completedJobs = clientJobs.filter(
        (job) =>
          job.status === "om_completed" ||
          job.status === "completed" ||
          job.status.includes("kyc") ||
          job.status.includes("bra")
      );

      setJobs(completedJobs);

      // Keep the selected job if it still exists, otherwise select the first one
      if (completedJobs.length > 0) {
        const jobStillExists = completedJobs.find(
          (job) => job._id === selectedJobId
        );
        if (!jobStillExists) {
          setSelectedJobId(completedJobs[0]._id);
          setSelectedJobType(completedJobs[0].serviceType);
        }
      } else {
        setSelectedJobId(null);
        setSelectedJobType(null);
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError("Failed to refresh data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to select a job
  const handleSelectJob = (jobId, jobType) => {
    setSelectedJobId(jobId);
    setSelectedJobType(jobType);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button and header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/account-management")}
            className="mb-4 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Account Management
          </button>

          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 mr-2 text-indigo-600" />
            Client Payment Management
          </h1>

          <p className="mt-2 text-lg text-gray-600">
            Manage payment records for{" "}
            {client?.name || gmail.split("@")[0] || gmail}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-3"></div>
            <p className="text-gray-500 text-lg">
              Loading client information...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left column - Client info and job selection */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Client Information
                </h2>

                {client ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Client Name</p>
                      <p className="font-medium">{client.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{gmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{client.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{client.company || "N/A"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Client information not available
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Completed Jobs
                  </h2>
                  <button
                    onClick={handleRefresh}
                    className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                    title="Refresh job list"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                </div>

                {jobs.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">
                      No completed jobs found for this client
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job._id}
                        onClick={() =>
                          handleSelectJob(job._id, job.serviceType)
                        }
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedJobId === job._id
                            ? "bg-indigo-50 border border-indigo-200"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-100"
                        }`}
                      >
                        <div className="flex items-start">
                          <div
                            className={`p-2 rounded-md ${
                              selectedJobId === job._id
                                ? "bg-indigo-100"
                                : "bg-gray-200"
                            }`}
                          >
                            <BriefcaseIcon
                              className={`h-5 w-5 ${
                                selectedJobId === job._id
                                  ? "text-indigo-600"
                                  : "text-gray-500"
                              }`}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <p
                              className={`font-medium ${
                                selectedJobId === job._id
                                  ? "text-indigo-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {job.serviceType}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {job._id}
                            </p>
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                {job.status.replace(/_/g, " ")}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {job.updatedAt &&
                                  new Date(job.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right column - Payment management */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {selectedJobId ? (
                  <PaymentManagementTab
                    client={client}
                    jobId={selectedJobId}
                    jobType={selectedJobType}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Job Selected
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {jobs.length > 0
                        ? "Please select a completed job from the list to manage its payment records."
                        : "No completed jobs found for this client. Once jobs are marked as complete, you can manage their payment records here."}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPaymentDetails;
