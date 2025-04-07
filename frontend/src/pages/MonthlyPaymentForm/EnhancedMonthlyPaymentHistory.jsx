import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  DocumentIcon,
  DocumentPlusIcon,
  ArrowPathIcon,
  EyeIcon,
  ArrowPathIcon as RefreshIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";
import { toast } from "react-toastify";

const EnhancedMonthlyPaymentHistory = ({ jobId, jobType, onUploadInvoice }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [selectedYear, setSelectedYear] = useState("All Years");

  useEffect(() => {
    fetchPaymentHistory();
  }, [jobId]);

  const fetchPaymentHistory = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      const history = await accountService.getPaymentHistory(jobId);
      setPaymentHistory(history || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setError("Failed to load payment history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExpand = (paymentId) => {
    if (expandedPayment === paymentId) {
      setExpandedPayment(null);
    } else {
      setExpandedPayment(paymentId);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Paid":
        return (
          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1.5 flex-shrink-0" />
        );
      case "Pending":
        return (
          <ClockIcon className="h-5 w-5 text-yellow-500 mr-1.5 flex-shrink-0" />
        );
      case "Overdue":
        return (
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-1.5 flex-shrink-0" />
        );
      default:
        return (
          <DocumentIcon className="h-5 w-5 text-gray-500 mr-1.5 flex-shrink-0" />
        );
    }
  };

  // Get unique years from payment history for filtering
  const getYears = () => {
    const years = [...new Set(paymentHistory.map((payment) => payment.year))];
    return ["All Years", ...years.sort((a, b) => b - a)];
  };

  // Filter payments by selected year
  const filteredPayments =
    selectedYear === "All Years"
      ? paymentHistory
      : paymentHistory.filter(
          (payment) => payment.year.toString() === selectedYear.toString()
        );

  // Helper function to categorize invoices into payment invoices and document-only invoices
  const categorizeInvoices = (invoices) => {
    if (!invoices || invoices.length === 0)
      return { payment: [], document: [] };

    // Separate invoices into payment invoices and document-only invoices
    const paymentInvoices = invoices.filter(
      (invoice) =>
        invoice.option !== "DOCUMENT_ONLY" &&
        invoice.paymentMethod !== "Document Only"
    );

    const documentInvoices = invoices.filter(
      (invoice) =>
        invoice.option === "DOCUMENT_ONLY" ||
        invoice.paymentMethod === "Document Only"
    );

    return { payment: paymentInvoices, document: documentInvoices };
  };

  // Check if a payment already has a supporting document (invoice)
  const hasInvoiceDocument = (payment) => {
    if (!payment.invoices || payment.invoices.length === 0) return false;

    return payment.invoices.some(
      (invoice) =>
        invoice.option === "DOCUMENT_ONLY" ||
        invoice.paymentMethod === "Document Only"
    );
  };

  // Handle uploading or replacing an invoice
  const handleInvoiceAction = (payment) => {
    const isReplacing = hasInvoiceDocument(payment);
    onUploadInvoice(payment, isReplacing);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading payment history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-4 text-center">
        <ExclamationCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchPaymentHistory}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (paymentHistory.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No Payment Records
        </h3>
        <p className="text-gray-500 mb-4">
          No monthly payment records have been added for this job yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        </div>

        <div className="flex items-center space-x-3">
          {/* Year filter dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getYears().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDownIcon className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={fetchPaymentHistory}
            className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
            title="Refresh payment history"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Info message */}
      <div className="mb-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-700 flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
        <p>
          Click on a month row to expand and view detailed invoice information.
          You can upload one invoice document per month in the payment history.
        </p>
      </div>

      <div className="space-y-4">
        {filteredPayments
          .sort((a, b) => {
            // Sort by year and month in descending order (newest first)
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
          })
          .map((payment) => {
            const hasInvoice = hasInvoiceDocument(payment);
            return (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Payment header */}
                <div
                  className={`px-4 py-3 flex justify-between items-center ${
                    expandedPayment === payment.id
                      ? "bg-blue-50 border-b border-gray-200"
                      : ""
                  }`}
                >
                  <div
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() => handleToggleExpand(payment.id)}
                  >
                    <div
                      className={`mr-3 p-2 rounded-full ${
                        payment.status === "Paid"
                          ? "bg-green-100"
                          : payment.status === "Pending"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <CalendarIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {payment.monthName} {payment.year}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(payment.totalAmount)} •{" "}
                        <span
                          className={`${
                            payment.status === "Paid"
                              ? "text-green-600"
                              : payment.status === "Pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {payment.status}
                        </span>
                        {hasInvoice && (
                          <span className="ml-2 text-blue-600 text-xs">
                            • Invoice Attached
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {/* Upload invoice button for each month */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInvoiceAction(payment);
                      }}
                      className={`ml-2 mr-3 inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 transition-colors
                        ${
                          hasInvoice
                            ? "border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                            : ""
                        }`}
                      title={`${
                        hasInvoice ? "Replace" : "Upload"
                      } invoice for ${payment.monthName} ${payment.year}`}
                    >
                      {hasInvoice ? (
                        <>
                          <RefreshIcon className="h-4 w-4 mr-1" />
                          Replace Invoice
                        </>
                      ) : (
                        <>
                          <DocumentPlusIcon className="h-4 w-4 mr-1" />
                          Upload Invoice
                        </>
                      )}
                    </button>

                    {/* Expand/collapse button */}
                    <button
                      onClick={() => handleToggleExpand(payment.id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {expandedPayment === payment.id ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded payment details */}
                {expandedPayment === payment.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 py-3 bg-gray-50"
                  >
                    {/* Payment details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm font-medium flex items-center">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Created On</p>
                        <p className="text-sm">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Updated</p>
                        <p className="text-sm">
                          {formatDate(payment.updatedAt)}
                        </p>
                      </div>
                      {payment.notes && (
                        <div className="md:col-span-3">
                          <p className="text-xs text-gray-500">Notes</p>
                          <p className="text-sm">{payment.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Invoices */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-sm font-medium text-gray-700 flex items-center">
                          <DocumentIcon className="h-4 w-4 mr-1 text-blue-600" />
                          Invoices for {payment.monthName} {payment.year}
                        </h5>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvoiceAction(payment);
                          }}
                          className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded bg-white transition-colors
                            ${
                              hasInvoice
                                ? "border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                                : "border-blue-600 text-blue-600 hover:bg-blue-50"
                            }`}
                        >
                          {hasInvoice ? (
                            <>
                              <RefreshIcon className="h-4 w-4 mr-1" />
                              Replace Invoice
                            </>
                          ) : (
                            <>
                              <DocumentPlusIcon className="h-4 w-4 mr-1" />
                              Upload Invoice
                            </>
                          )}
                        </button>
                      </div>

                      {payment.invoices && payment.invoices.length > 0 ? (
                        <div className="space-y-4">
                          {/* Payment Invoices Section */}
                          {(() => {
                            const {
                              payment: paymentInvoices,
                              document: documentInvoices,
                            } = categorizeInvoices(payment.invoices);

                            return (
                              <>
                                {paymentInvoices.length > 0 && (
                                  <div>
                                    <h6 className="text-xs font-medium text-gray-600 mb-2">
                                      Payment Invoices
                                    </h6>
                                    <div className="space-y-2">
                                      {paymentInvoices.map((invoice, index) => (
                                        <div
                                          key={`payment-${index}`}
                                          className={`p-3 rounded-lg border ${
                                            invoice.isIncorrectInvoice
                                              ? "border-red-200 bg-red-50"
                                              : "border-gray-200 bg-white"
                                          }`}
                                        >
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <p className="text-sm font-medium">
                                                {invoice.description}
                                                {invoice.isIncorrectInvoice && (
                                                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                                    Marked Incorrect
                                                  </span>
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {formatDate(
                                                  invoice.invoiceDate
                                                )}{" "}
                                                •{" "}
                                                {formatCurrency(invoice.amount)}{" "}
                                                • {invoice.paymentMethod}
                                              </p>
                                              {invoice.incorrectReason && (
                                                <p className="text-xs italic text-red-600 mt-1">
                                                  Reason:{" "}
                                                  {invoice.incorrectReason}
                                                </p>
                                              )}
                                            </div>
                                            <div>
                                              {invoice.fileUrl ? (
                                                <a
                                                  href={invoice.fileUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                                >
                                                  <EyeIcon className="h-4 w-4 mr-1" />
                                                  View
                                                </a>
                                              ) : (
                                                <span className="text-gray-400 text-sm">
                                                  No file
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Document-Only Invoices Section - Limited to just one */}
                                {documentInvoices.length > 0 && (
                                  <div className="mt-4">
                                    <h6 className="text-xs font-medium text-gray-600 mb-2">
                                      Invoice Document
                                    </h6>
                                    <div>
                                      {/* Show only the first document */}
                                      <div
                                        className={`p-3 rounded-lg border ${
                                          documentInvoices[0].isIncorrectInvoice
                                            ? "border-red-200 bg-red-50"
                                            : "border-blue-100 bg-blue-50"
                                        }`}
                                      >
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="text-sm font-medium">
                                              {documentInvoices[0].description}
                                              {documentInvoices[0]
                                                .isIncorrectInvoice && (
                                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                                  Marked Incorrect
                                                </span>
                                              )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {formatDate(
                                                documentInvoices[0].invoiceDate
                                              )}{" "}
                                              • Supporting Document
                                            </p>
                                            {documentInvoices[0]
                                              .incorrectReason && (
                                              <p className="text-xs italic text-red-600 mt-1">
                                                Reason:{" "}
                                                {
                                                  documentInvoices[0]
                                                    .incorrectReason
                                                }
                                              </p>
                                            )}
                                          </div>
                                          <div>
                                            {documentInvoices[0].fileUrl ? (
                                              <a
                                                href={
                                                  documentInvoices[0].fileUrl
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                                              >
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                View
                                              </a>
                                            ) : (
                                              <span className="text-gray-400 text-sm">
                                                No file
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                          <p className="text-sm text-blue-600">
                            No invoices attached to this payment record
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInvoiceAction(payment);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Upload Now
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default EnhancedMonthlyPaymentHistory;
