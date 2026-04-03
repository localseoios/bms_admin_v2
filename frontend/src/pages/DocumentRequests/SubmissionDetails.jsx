import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import axiosInstance from "../../utils/axios";
import toast from "react-hot-toast";

function SubmissionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/document-requests/submissions/${id}`);
      setSubmission(response.data.submission);
      setError(null);
    } catch (err) {
      console.error("Error fetching submission:", err);
      setError(err.response?.data?.message || "Failed to fetch submission");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      setIsSubmitting(true);
      const endpoint = `/document-requests/submissions/${id}/${actionType}`;
      await axiosInstance.put(endpoint, { notes: actionNotes });
      toast.success(`Submission ${actionType === "review" ? "reviewed" : actionType === "process" ? "processed" : "rejected"} successfully`);
      setIsActionModalOpen(false);
      setActionNotes("");
      fetchSubmission();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionModal = (type) => {
    setActionType(type);
    setIsActionModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      reviewed: "bg-blue-100 text-blue-800 border-blue-200",
      processed: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    const icons = {
      pending: ClockIcon,
      reviewed: EyeIcon,
      processed: CheckCircleIcon,
      rejected: XCircleIcon,
    };
    const Icon = icons[status] || ClockIcon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${styles[status] || "bg-gray-100 text-gray-800 border-gray-200"}`}>
        <Icon className="h-4 w-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["pdf"].includes(ext)) return "text-red-500";
    if (["doc", "docx"].includes(ext)) return "text-blue-500";
    if (["xls", "xlsx"].includes(ext)) return "text-green-500";
    if (["jpg", "jpeg", "png"].includes(ext)) return "text-purple-500";
    return "text-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/client-submissions")}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back to submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/client-submissions")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Submissions
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Submission Details</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {submission?.documentRequestId?.subject || "Document Submission"}
                </p>
              </div>
              {getStatusBadge(submission?.status)}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Client Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900">{submission?.clientId?.name || submission?.documentRequestId?.manualName || "Unknown"}</span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{submission?.clientId?.gmail || submission?.documentRequestId?.manualEmail || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Submission Info</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{formatDate(submission?.createdAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">
                      {submission?.submittedFields?.reduce((count, f) => {
                        if (f.fileUrl) return count + 1;
                        if (f.files?.length) return count + f.files.length;
                        return count;
                      }, 0) || 0} files uploaded
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {submission?.documentRequestId?.message && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Original Request Message</h3>
                <p className="text-blue-700 whitespace-pre-wrap">{submission.documentRequestId.message}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submitted Data</h3>
              <div className="space-y-4">
                {submission?.submittedFields?.map((field, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${field.addedByCustomer ? "border-green-200 bg-green-50" : "border-gray-200"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-700">
                          {field.fieldLabel}
                          {field.addedByCustomer && (
                            <span className="ml-2 text-xs text-green-600 font-normal">(Added by customer)</span>
                          )}
                        </h4>
                        {field.fieldType === "file" && field.fileUrl ? (
                          <div className="mt-2 flex items-center gap-3">
                            <DocumentArrowDownIcon className={`h-8 w-8 ${getFileIcon(field.fileName)}`} />
                            <div>
                              <p className="text-sm text-gray-900">{field.fileName}</p>
                              {field.fileSize && (
                                <p className="text-xs text-gray-500">
                                  {(field.fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                            <a
                              href={field.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View
                            </a>
                            <a
                              href={field.fileUrl}
                              download
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              Download
                            </a>
                          </div>
                        ) : field.fieldType === "multifile" && field.files?.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {field.files.map((file, fileIdx) => (
                              <div key={fileIdx} className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200">
                                <DocumentArrowDownIcon className={`h-6 w-6 ${getFileIcon(file.fileName)}`} />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{file.fileName}</p>
                                  {file.fileSize && (
                                    <p className="text-xs text-gray-500">
                                      {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  )}
                                </div>
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium"
                                >
                                  <EyeIcon className="h-3 w-3" />
                                  View
                                </a>
                                <a
                                  href={file.fileUrl}
                                  download
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-xs font-medium"
                                >
                                  <ArrowDownTrayIcon className="h-3 w-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-1 text-gray-900">
                            {field.value || <span className="text-gray-400 italic">No value provided</span>}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(submission?.reviewNotes || submission?.processingNotes) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                {submission?.reviewNotes && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Review Notes:</span>
                    <p className="text-gray-700">{submission.reviewNotes}</p>
                  </div>
                )}
                {submission?.processingNotes && (
                  <div>
                    <span className="text-xs text-gray-500">Processing Notes:</span>
                    <p className="text-gray-700">{submission.processingNotes}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {submission?.status === "pending" && (
                <>
                  <button
                    onClick={() => openActionModal("review")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <EyeIcon className="h-5 w-5" />
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => openActionModal("reject")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Reject
                  </button>
                </>
              )}
              {submission?.status === "reviewed" && (
                <button
                  onClick={() => openActionModal("process")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Mark as Processed
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <Transition appear show={isActionModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={() => setIsActionModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {actionType === "review" && "Mark as Reviewed"}
                      {actionType === "process" && "Mark as Processed"}
                      {actionType === "reject" && "Reject Submission"}
                    </Dialog.Title>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add any notes..."
                      />
                    </div>
                    <div className="mt-6 flex gap-3 justify-end">
                      <button
                        onClick={() => setIsActionModalOpen(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAction}
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-white rounded-lg ${
                          actionType === "reject"
                            ? "bg-red-600 hover:bg-red-700"
                            : actionType === "process"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        } disabled:opacity-50`}
                      >
                        {isSubmitting ? "Processing..." : "Confirm"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  );
}

export default SubmissionDetails;
