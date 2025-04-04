import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../utils/axios";
import { useAuth } from "../../../context/AuthContext";
import {
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

function KYCJobDetail({ jobId }) {
  const [kycApproval, setKycApproval] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [job, setJob] = useState(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  // Check user permissions for KYC roles
  const isLMRO = user?.role?.permissions?.kycManagement?.lmro;
  const isDLMRO = user?.role?.permissions?.kycManagement?.dlmro;
  const isCEO = user?.role?.permissions?.kycManagement?.ceo;
  const hasKYCRole = isLMRO || isDLMRO || isCEO;
  const hasOperationManagement = user?.role?.permissions?.operationManagement;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get job details
        const jobResponse = await axios.get(`/api/jobs/${jobId}`);
        setJob(jobResponse.data);

        // Try to get KYC approval if it exists
        try {
          const kycResponse = await axios.get(`/api/kyc/jobs/${jobId}/status`);
          setKycApproval(kycResponse.data);
        } catch (err) {
          // KYC approval might not exist yet, which is fine
          if (err.response && err.response.status !== 404) {
            throw err;
          }
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching KYC data:", err);
        setError("Failed to load KYC data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId]);

  // Function to initialize KYC process
  const handleInitializeKYC = async () => {
    try {
      setSubmitting(true);
      await axios.post(`/api/kyc/jobs/${jobId}/initialize`);

      // Refresh the data
      const kycResponse = await axios.get(`/api/kyc/jobs/${jobId}/status`);
      setKycApproval(kycResponse.data);

      // Update job status
      const jobResponse = await axios.get(`/api/jobs/${jobId}`);
      setJob(jobResponse.data);

      alert("KYC process initialized successfully!");
    } catch (err) {
      console.error("Error initializing KYC:", err);
      alert("Failed to initialize KYC process. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user can approve current stage
  const canApprove = () => {
    if (!kycApproval) return false;

    const stage = kycApproval.currentApprovalStage;

    if (stage === "lmro" && isLMRO) return true;
    if (stage === "dlmro" && isDLMRO) return true;
    if (stage === "ceo" && isCEO) return true;

    return false;
  };

  // Handle approval submission
  const handleSubmitApproval = async () => {
    if (!kycApproval) return;

    try {
      setSubmitting(true);
      const stage = kycApproval.currentApprovalStage;
      let endpoint = "";

      if (stage === "lmro") {
        endpoint = `/api/kyc/jobs/${jobId}/lmro-approve`;
      } else if (stage === "dlmro") {
        endpoint = `/api/kyc/jobs/${jobId}/dlmro-approve`;
      } else if (stage === "ceo") {
        endpoint = `/api/kyc/jobs/${jobId}/ceo-approve`;
      }

      await axios.put(endpoint, { notes: approvalNotes });

      // Refresh the data
      const kycResponse = await axios.get(`/api/kyc/jobs/${jobId}/status`);
      setKycApproval(kycResponse.data);

      // Update job status
      const jobResponse = await axios.get(`/api/jobs/${jobId}`);
      setJob(jobResponse.data);

      // Close modal and reset form
      setApprovalModalOpen(false);
      setApprovalNotes("");

      alert("Approval submitted successfully!");
    } catch (err) {
      console.error("Error submitting approval:", err);
      alert("Failed to submit approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle rejection submission
  const handleSubmitRejection = async () => {
    if (!kycApproval || !rejectionReason) return;

    try {
      setSubmitting(true);
      await axios.put(`/api/kyc/jobs/${jobId}/reject`, {
        rejectionReason,
      });

      // Refresh the data
      const kycResponse = await axios.get(`/api/kyc/jobs/${jobId}/status`);
      setKycApproval(kycResponse.data);

      // Update job status
      const jobResponse = await axios.get(`/api/jobs/${jobId}`);
      setJob(jobResponse.data);

      // Close modal and reset form
      setRejectionModalOpen(false);
      setRejectionReason("");

      alert("KYC approval rejected successfully!");
    } catch (err) {
      console.error("Error rejecting KYC:", err);
      alert("Failed to reject KYC approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="text-red-500 flex items-center">
          <XMarkIcon className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  // If job is not in a KYC-related state and user has operation permission, show initialize option
  if (
    !kycApproval &&
    job?.status === "om_completed" &&
    hasOperationManagement
  ) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          KYC Management
        </h2>
        <p className="text-gray-600 mb-4">
          This job has completed the operation management phase and is ready for
          KYC review.
        </p>
        <button
          onClick={handleInitializeKYC}
          disabled={submitting}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {submitting ? (
            <>
              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Initializing...
            </>
          ) : (
            <>
              <DocumentTextIcon className="-ml-1 mr-2 h-4 w-4" />
              Initialize KYC Process
            </>
          )}
        </button>
      </div>
    );
  }

  // If no KYC approval and job is not in right state
  if (!kycApproval) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          KYC Management
        </h2>
        <p className="text-gray-600">
          No KYC approval process has been started for this job yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">KYC Management</h2>

      {/* KYC Status */}
      <div className="mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {kycApproval.status === "completed" ? (
              <CheckIcon className="h-5 w-5 text-green-500" />
            ) : kycApproval.status === "rejected" ? (
              <XMarkIcon className="h-5 w-5 text-red-500" />
            ) : (
              <ArrowPathIcon className="h-5 w-5 text-blue-500" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">
              Status:{" "}
              {kycApproval.status.charAt(0).toUpperCase() +
                kycApproval.status.slice(1)}
            </h3>
            <p className="text-sm text-gray-500">
              Current stage:{" "}
              {kycApproval.currentApprovalStage === "completed"
                ? "Completed"
                : kycApproval.currentApprovalStage.toUpperCase() + " Review"}
            </p>
          </div>
        </div>
      </div>

      {/* Approval Steps */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Approval Progress
        </h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>LMRO</span>
              <span>DLMRO</span>
              <span>CEO</span>
            </div>
            <div className="flex items-center gap-1">
              {/* LMRO */}
              <div
                className={`h-2 flex-1 rounded-l-full ${
                  kycApproval.lmroApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>

              {/* DLMRO */}
              <div
                className={`h-2 flex-1 ${
                  kycApproval.dlmroApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>

              {/* CEO */}
              <div
                className={`h-2 flex-1 rounded-r-full ${
                  kycApproval.ceoApproval.approved
                    ? "bg-green-500"
                    : "bg-gray-200"
                }`}
              ></div>
            </div>
          </div>

          {/* LMRO Status */}
          <div
            className={`p-3 rounded mb-2 ${
              kycApproval.lmroApproval.approved ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-blue-500 mr-2" />
              <h4 className="text-sm font-medium">LMRO Approval</h4>
              {kycApproval.lmroApproval.approved && (
                <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
              )}
            </div>
            {kycApproval.lmroApproval.approved ? (
              <div className="mt-1 text-xs text-gray-600">
                <p>
                  Approved by:{" "}
                  {kycApproval.lmroApproval.approvedBy?.name || "N/A"}
                </p>
                <p>
                  Date:{" "}
                  {new Date(
                    kycApproval.lmroApproval.approvedAt
                  ).toLocaleString()}
                </p>
                {kycApproval.lmroApproval.notes && (
                  <p>Notes: {kycApproval.lmroApproval.notes}</p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-600">
                {kycApproval.currentApprovalStage === "lmro"
                  ? "Pending approval"
                  : "Not started"}
              </p>
            )}
          </div>

          {/* DLMRO Status */}
          <div
            className={`p-3 rounded mb-2 ${
              kycApproval.dlmroApproval.approved ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="text-sm font-medium">DLMRO Approval</h4>
              {kycApproval.dlmroApproval.approved && (
                <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
              )}
            </div>
            {kycApproval.dlmroApproval.approved ? (
              <div className="mt-1 text-xs text-gray-600">
                <p>
                  Approved by:{" "}
                  {kycApproval.dlmroApproval.approvedBy?.name || "N/A"}
                </p>
                <p>
                  Date:{" "}
                  {new Date(
                    kycApproval.dlmroApproval.approvedAt
                  ).toLocaleString()}
                </p>
                {kycApproval.dlmroApproval.notes && (
                  <p>Notes: {kycApproval.dlmroApproval.notes}</p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-600">
                {kycApproval.currentApprovalStage === "dlmro"
                  ? "Pending approval"
                  : kycApproval.currentApprovalStage === "lmro"
                  ? "Awaiting LMRO approval"
                  : "Complete"}
              </p>
            )}
          </div>

          {/* CEO Status */}
          <div
            className={`p-3 rounded ${
              kycApproval.ceoApproval.approved ? "bg-green-50" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center">
              <LockClosedIcon className="h-5 w-5 text-indigo-500 mr-2" />
              <h4 className="text-sm font-medium">CEO Approval</h4>
              {kycApproval.ceoApproval.approved && (
                <CheckIcon className="h-4 w-4 text-green-500 ml-2" />
              )}
            </div>
            {kycApproval.ceoApproval.approved ? (
              <div className="mt-1 text-xs text-gray-600">
                <p>
                  Approved by:{" "}
                  {kycApproval.ceoApproval.approvedBy?.name || "N/A"}
                </p>
                <p>
                  Date:{" "}
                  {new Date(
                    kycApproval.ceoApproval.approvedAt
                  ).toLocaleString()}
                </p>
                {kycApproval.ceoApproval.notes && (
                  <p>Notes: {kycApproval.ceoApproval.notes}</p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-600">
                {kycApproval.currentApprovalStage === "ceo"
                  ? "Pending approval"
                  : kycApproval.currentApprovalStage === "completed"
                  ? "Complete"
                  : "Awaiting previous approvals"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canApprove() &&
        kycApproval.status !== "rejected" &&
        kycApproval.status !== "completed" && (
          <div className="flex space-x-2">
            <button
              onClick={() => setApprovalModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckIcon className="-ml-1 mr-2 h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => setRejectionModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <XMarkIcon className="-ml-1 mr-2 h-4 w-4" />
              Reject
            </button>
          </div>
        )}

      {/* Approval Modal */}
      <AnimatePresence>
        {approvalModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Approve KYC
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder="Add any notes about this approval..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setApprovalModalOpen(false);
                    setApprovalNotes("");
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {submitting ? "Submitting..." : "Confirm Approval"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {rejectionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reject KYC
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder="Provide a reason for rejection..."
                  required
                ></textarea>
                {!rejectionReason && (
                  <p className="mt-1 text-sm text-red-600">
                    Rejection reason is required
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setRejectionModalOpen(false);
                    setRejectionReason("");
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRejection}
                  disabled={submitting || !rejectionReason}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {submitting ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default KYCJobDetail;
