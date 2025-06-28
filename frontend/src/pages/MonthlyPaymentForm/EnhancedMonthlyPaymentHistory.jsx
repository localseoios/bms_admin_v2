import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import axiosInstance from "../../utils/axios";
import InvoiceEditModal from "./FixedInvoiceEditModal";
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
  PencilSquareIcon,
  PlusIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";
import { toast } from "react-toastify";

const EnhancedMonthlyPaymentHistory = ({ jobId, jobType, onUploadInvoice }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [selectedYear, setSelectedYear] = useState("All Years");
  
  // Invoice edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [modalMode, setModalMode] = useState("edit"); // "edit", "add", "view"

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

  // Fixed invoice modal handlers with proper validation
  const handleEditInvoice = (paymentId, invoice) => {
    console.log("handleEditInvoice called with:", { paymentId, invoice });
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined') {
      toast.error('Invalid payment ID. Please refresh the page and try again.');
      return;
    }
    
    if (!invoice || !invoice._id) {
      toast.error('Invalid invoice data. Please refresh the page and try again.');
      return;
    }
    
    setSelectedPaymentId(paymentId);
    setSelectedInvoice(invoice);
    setModalMode("edit");
    setEditModalOpen(true);
  };

  const handleViewInvoice = (paymentId, invoice) => {
    console.log("handleViewInvoice called with:", { paymentId, invoice });
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined') {
      toast.error('Invalid payment ID. Please refresh the page and try again.');
      return;
    }
    
    if (!invoice) {
      toast.error('Invalid invoice data. Please refresh the page and try again.');
      return;
    }
    
    setSelectedPaymentId(paymentId);
    setSelectedInvoice(invoice);
    setModalMode("view");
    setEditModalOpen(true);
  };

  const handleAddInvoice = (paymentId) => {
    console.log("handleAddInvoice called with paymentId:", paymentId);
    
    // Validate paymentId
    if (!paymentId || paymentId === 'undefined') {
      toast.error('Invalid payment ID. Please refresh the page and try again.');
      return;
    }
    
    setSelectedPaymentId(paymentId);
    setSelectedInvoice(null);
    setModalMode("add");
    setEditModalOpen(true);
  };

  const handleModalSuccess = (data) => {
    console.log("Invoice operation successful:", data);
    // Refresh the payment history
    fetchPaymentHistory();
    
    // Show appropriate success message
    let message = "Operation completed successfully";
    if (modalMode === "add") {
      message = "Invoice added successfully";
    } else if (modalMode === "edit") {
      message = "Invoice updated successfully";
    }
    
    toast.success(message);
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setSelectedInvoice(null);
    setSelectedPaymentId(null);
    setModalMode("edit");
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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case "Bank Transfer":
        return <BuildingLibraryIcon className="h-4 w-4" />;
      case "Cash":
        return <BanknotesIcon className="h-4 w-4" />;
      case "Credit Card":
        return <CreditCardIcon className="h-4 w-4" />;
      case "Document Only":
        return <DocumentIcon className="h-4 w-4" />;
      default:
        return <CurrencyDollarIcon className="h-4 w-4" />;
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
          You can edit, view, or add new invoices to each payment record.
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
            const { payment: paymentInvoices, document: documentInvoices } = categorizeInvoices(payment.invoices);
            // Get the correct payment ID (handle both _id and id)
            const paymentId = payment._id || payment.id;
            
            return (
              <div
                key={paymentId}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Payment header */}
                <div
                  className={`px-4 py-3 flex justify-between items-center ${
                    expandedPayment === paymentId
                      ? "bg-blue-50 border-b border-gray-200"
                      : ""
                  }`}
                >
                  <div
                    className="flex items-center cursor-pointer flex-1"
                    onClick={() => handleToggleExpand(paymentId)}
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
                        {payment.invoices?.length || 0} invoices • {formatCurrency(payment.totalAmount)} •{" "}
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
                  <div className="flex items-center space-x-2">
                    {/* Add New Invoice Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Add Invoice button clicked, paymentId:", paymentId);
                        handleAddInvoice(paymentId);
                      }}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-white hover:bg-green-600 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Invoice
                    </button>

                    {/* Upload document button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const paymentRecord = {
                          ...payment,
                          _id: paymentId // Ensure _id is available
                        };
                        console.log("Upload Document button clicked, payment:", paymentRecord);
                        handleInvoiceAction(paymentRecord);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded bg-white transition-colors
                        ${
                          hasInvoice
                            ? "border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                            : "border-blue-600 text-blue-600 hover:bg-blue-50"
                        }`}
                      title={`${
                        hasInvoice ? "Replace" : "Upload"
                      } invoice document for ${payment.monthName} ${payment.year}`}
                    >
                      {hasInvoice ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Replace Document
                        </>
                      ) : (
                        <>
                          <DocumentPlusIcon className="h-4 w-4 mr-1" />
                          Upload Document
                        </>
                      )}
                    </button>

                    {/* Expand/collapse button */}
                    <button
                      onClick={() => handleToggleExpand(paymentId)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {expandedPayment === paymentId ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded payment details */}
                {expandedPayment === paymentId && (
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

                    {/* Invoices Section */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-sm font-medium text-gray-700 flex items-center">
                          <DocumentIcon className="h-4 w-4 mr-1 text-blue-600" />
                          Invoices for {payment.monthName} {payment.year}
                        </h5>
                        <button
                          onClick={() => handleAddInvoice(paymentId)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-white hover:bg-green-600 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Add New Invoice
                        </button>
                      </div>

                      {payment.invoices && payment.invoices.length > 0 ? (
                        <div className="space-y-4">
                          {/* Payment Invoices Section */}
                          {paymentInvoices.length > 0 && (
                            <div>
                              <h6 className="text-xs font-medium text-gray-600 mb-3 flex items-center">
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                Payment Invoices ({paymentInvoices.length})
                              </h6>
                              <div className="space-y-3">
                                {paymentInvoices.map((invoice, index) => (
                                  <motion.div
                                    key={`payment-${invoice._id || index}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`p-4 rounded-lg border hover:shadow-md transition-all duration-200 ${
                                      invoice.isIncorrectInvoice
                                        ? "border-red-200 bg-red-50"
                                        : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <div className="bg-blue-100 rounded-lg p-1.5">
                                              <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                              <h5 className="font-medium text-gray-900">
                                                {invoice.description || `Invoice ${index + 1}`}
                                                {invoice.isIncorrectInvoice && (
                                                  <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                                    Marked Incorrect
                                                  </span>
                                                )}
                                              </h5>
                                              <p className="text-sm text-gray-500">
                                                {formatDate(invoice.invoiceDate)} • {formatCurrency(invoice.amount)}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-lg font-semibold text-gray-900">
                                              {formatCurrency(invoice.amount)}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                          <div className="flex items-center space-x-2">
                                            {getPaymentMethodIcon(invoice.paymentMethod)}
                                            <span className="text-sm text-gray-600">
                                              {invoice.paymentMethod || "Not specified"}
                                            </span>
                                          </div>
                                          
                                          {invoice.option && (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-sm text-gray-500">Option:</span>
                                              <span className="text-sm text-gray-700">{invoice.option}</span>
                                            </div>
                                          )}

                                          {invoice.fileName && (
                                            <div className="flex items-center space-x-2">
                                              <DocumentIcon className="h-4 w-4 text-gray-400" />
                                              <a
                                                href={invoice.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 truncate"
                                              >
                                                {invoice.fileName}
                                              </a>
                                            </div>
                                          )}
                                        </div>

                                        {invoice.incorrectReason && (
                                          <p className="text-sm italic text-red-600 mt-2 p-2 bg-red-50 rounded">
                                            Reason: {invoice.incorrectReason}
                                          </p>
                                        )}
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex flex-col space-y-2 ml-4">
                                        <button
                                          onClick={() => handleViewInvoice(paymentId, invoice)}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded border border-gray-200 hover:border-blue-200 transition-all duration-200"
                                        >
                                          <EyeIcon className="h-3 w-3 mr-1" />
                                          View
                                        </button>
                                        <button
                                          onClick={() => handleEditInvoice(paymentId, invoice)}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded border border-indigo-200 transition-all duration-200"
                                        >
                                          <PencilSquareIcon className="h-3 w-3 mr-1" />
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Document-Only Invoices Section */}
                          {documentInvoices.length > 0 && (
                            <div className="mt-6">
                              <h6 className="text-xs font-medium text-gray-600 mb-3 flex items-center">
                                <DocumentIcon className="h-4 w-4 mr-1" />
                                Supporting Documents ({documentInvoices.length})
                              </h6>
                              <div className="space-y-3">
                                {documentInvoices.map((invoice, index) => (
                                  <div
                                    key={`document-${invoice._id || index}`}
                                    className={`p-4 rounded-lg border ${
                                      invoice.isIncorrectInvoice
                                        ? "border-red-200 bg-red-50"
                                        : "border-blue-100 bg-blue-50"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                          <div className="bg-blue-100 rounded-lg p-1.5">
                                            <DocumentIcon className="h-4 w-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <h5 className="font-medium text-gray-900">
                                              {invoice.description}
                                              {invoice.isIncorrectInvoice && (
                                                <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                                  Marked Incorrect
                                                </span>
                                              )}
                                            </h5>
                                            <p className="text-sm text-gray-500">
                                              {formatDate(invoice.invoiceDate)} • Supporting Document
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {invoice.incorrectReason && (
                                          <p className="text-sm italic text-red-600 mt-2 p-2 bg-red-50 rounded">
                                            Reason: {invoice.incorrectReason}
                                          </p>
                                        )}
                                      </div>
                                      
                                      <div className="flex space-x-2">
                                        {invoice.fileUrl && (
                                          <a
                                            href={invoice.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-white rounded border border-blue-200 hover:border-blue-300 transition-all duration-200"
                                          >
                                            <EyeIcon className="h-3 w-3 mr-1" />
                                            View
                                          </a>
                                        )}
                                        <button
                                          onClick={() => handleEditInvoice(paymentId, invoice)}
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded border border-indigo-200 transition-all duration-200"
                                        >
                                          <PencilSquareIcon className="h-3 w-3 mr-1" />
                                          Edit
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-lg p-6 text-center">
                          <DocumentTextIcon className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                          <h4 className="text-sm font-medium text-blue-800 mb-2">
                            No Invoices Yet
                          </h4>
                          <p className="text-sm text-blue-600 mb-4">
                            No invoices have been added to this payment record yet.
                          </p>
                          <button
                            onClick={() => handleAddInvoice(paymentId)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-600 hover:text-white hover:bg-green-600 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all duration-200"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add First Invoice
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

      {/* Invoice Edit Modal */}
      <InvoiceEditModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        invoice={selectedInvoice}
        paymentId={selectedPaymentId}
        onSuccess={handleModalSuccess}
        mode={modalMode}
      />
    </div>
  );
};

export default EnhancedMonthlyPaymentHistory;