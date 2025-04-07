import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  PlusIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import axiosInstance from "../../utils/axios";
import EnhancedMonthlyPaymentForm from "../MonthlyPaymentForm/EnhancedMonthlyPaymentForm";
import EnhancedMonthlyPaymentHistory from "../MonthlyPaymentForm/EnhancedMonthlyPaymentHistory";


// This component displays Accounting-specific information in the client profile
const AccountManagementSection = ({ client, jobs }) => {
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeJobId, setActiveJobId] = useState(null);
  const [isAddNewMonthOpen, setIsAddNewMonthOpen] = useState(false);
  const [viewMode, setViewMode] = useState("pending"); // 'pending' or 'all'
  const [paymentData, setPaymentData] = useState({});

  // Find completed jobs that need payment processing
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        setLoading(true);

        // Filter jobs with "om_completed" status
        const completed = jobs.filter((job) => job.status === "om_completed");
        setCompletedJobs(completed);

        // If we have completed jobs, set the first one as active
        if (completed.length > 0 && !activeJobId) {
          setActiveJobId(completed[0]._id);
        }

        // Fetch payment data for all jobs
        const paymentPromises = jobs.map(async (job) => {
          try {
            const response = await axiosInstance.get(
              `/monthlypayment/history/${job._id}`
            );
            return {
              jobId: job._id,
              payments: response.data,
              hasPayments: response.data && response.data.length > 0,
            };
          } catch (err) {
            console.log(`No payment data for job ${job._id}`);
            return { jobId: job._id, payments: [], hasPayments: false };
          }
        });

        const paymentResults = await Promise.all(paymentPromises);
        const paymentDataMap = {};
        paymentResults.forEach((result) => {
          paymentDataMap[result.jobId] = {
            payments: result.payments,
            hasPayments: result.hasPayments,
          };
        });

        setPaymentData(paymentDataMap);
        setError(null);
      } catch (err) {
        console.error("Error loading job payment data:", err);
        setError("Failed to load payment information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (jobs && jobs.length > 0) {
      fetchJobData();
    }
  }, [jobs]);

  // Handler for refreshing payment data
  const handleRefresh = async () => {
    try {
      setLoading(true);

      // Fetch payment data for all jobs again
      const paymentPromises = jobs.map(async (job) => {
        try {
          const response = await axiosInstance.get(
            `/monthlypayment/history/${job._id}`
          );
          return {
            jobId: job._id,
            payments: response.data,
            hasPayments: response.data && response.data.length > 0,
          };
        } catch (err) {
          return { jobId: job._id, payments: [], hasPayments: false };
        }
      });

      const paymentResults = await Promise.all(paymentPromises);
      const paymentDataMap = {};
      paymentResults.forEach((result) => {
        paymentDataMap[result.jobId] = {
          payments: result.payments,
          hasPayments: result.hasPayments,
        };
      });

      setPaymentData(paymentDataMap);
      setError(null);
    } catch (err) {
      console.error("Error refreshing payment data:", err);
      setError("Failed to refresh payment information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter jobs based on view mode
  const filteredJobs = viewMode === "pending" ? completedJobs : jobs;

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">
          Loading payment information...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 bg-red-50 rounded-xl border border-red-200 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Error Loading Payment Data
        </h3>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 mr-2 text-indigo-600" />
          Account Management
        </h2>
        <div className="flex items-center space-x-3">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode("pending")}
              className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                viewMode === "pending"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              Pending Payments
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 text-sm font-medium border rounded-r-lg ${
                viewMode === "all"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Jobs
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
            title="Refresh payment data"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-gray-200">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            {viewMode === "pending"
              ? "No Jobs Pending Payment"
              : "No Jobs Found"}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {viewMode === "pending"
              ? "There are no jobs marked as 'Operation Complete' that require payment processing."
              : "This client doesn't have any jobs in the system."}
          </p>
        </div>
      ) : (
        <>
          {/* Job selection tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav
                className="-mb-px flex space-x-2 overflow-x-auto"
                aria-label="Tabs"
              >
                {filteredJobs.map((job) => (
                  <button
                    key={job._id}
                    onClick={() => {
                      setActiveJobId(job._id);
                      setIsAddNewMonthOpen(false);
                    }}
                    className={`${
                      activeJobId === job._id
                        ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all`}
                  >
                    <span>
                      {job.serviceType}{" "}
                      {job.status === "om_completed" && (
                        <span className="ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Active job payment management */}
          {activeJobId && (
            <div>
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {
                          filteredJobs.find((j) => j._id === activeJobId)
                            ?.serviceType
                        }
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Job ID: {activeJobId}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            filteredJobs.find((j) => j._id === activeJobId)
                              ?.status === "om_completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {filteredJobs.find((j) => j._id === activeJobId)
                            ?.status === "om_completed" ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Ready for Payment
                            </>
                          ) : (
                            <>
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {
                                filteredJobs.find((j) => j._id === activeJobId)
                                  ?.status
                              }
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 lg:mt-0">
                      {filteredJobs.find((j) => j._id === activeJobId)
                        ?.status === "om_completed" && (
                        <button
                          onClick={() =>
                            setIsAddNewMonthOpen(!isAddNewMonthOpen)
                          }
                          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 shadow-sm"
                        >
                          {isAddNewMonthOpen ? (
                            "Cancel"
                          ) : (
                            <>
                              <PlusIcon className="h-5 w-5 mr-2" />
                              Add Payment Record
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Payment Form (when opened) */}
              <AnimatePresence>
                {isAddNewMonthOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EnhancedMonthlyPaymentForm
                      jobId={activeJobId}
                      jobType={
                        filteredJobs.find((j) => j._id === activeJobId)
                          ?.serviceType
                      }
                      onClose={() => setIsAddNewMonthOpen(false)}
                      onSuccess={() => {
                        setIsAddNewMonthOpen(false);
                        handleRefresh();
                      }}
                      isAccountingMode={true}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Monthly Payment History */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Payment History
                </h3>
                <EnhancedMonthlyPaymentHistory
                  jobId={activeJobId}
                  jobType={
                    filteredJobs.find((j) => j._id === activeJobId)?.serviceType
                  }
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccountManagementSection;
