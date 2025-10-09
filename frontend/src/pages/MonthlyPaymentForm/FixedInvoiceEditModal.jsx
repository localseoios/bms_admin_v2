import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import accountService from "../../utils/accountService"; // Use accountService instead of direct axios
import {
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  PencilSquareIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const FixedInvoiceEditModal = ({ 
  isOpen, 
  onClose, 
  invoice, 
  paymentId, 
  onSuccess,
  mode = "edit" // "edit", "add", or "view"
}) => {
  const [formData, setFormData] = useState({
    invoiceDate: "",
    description: "",
    amount: "",
    currency: "QAR",
    option: "",
    paymentMethod: "Bank Transfer",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Debug logging for paymentId
  useEffect(() => {
    console.log("InvoiceEditModal - paymentId:", paymentId);
    console.log("InvoiceEditModal - invoice:", invoice);
    console.log("InvoiceEditModal - mode:", mode);
  }, [paymentId, invoice, mode]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && invoice && mode !== "add") {
      const initialData = {
        invoiceDate: invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "yyyy-MM-dd") : "",
        description: invoice.description || "",
        amount: invoice.amount?.toString() || "",
        currency: invoice.currency || "QAR",
        option: invoice.option || "",
        paymentMethod: invoice.paymentMethod || "Bank Transfer",
      };
      setFormData(initialData);
      setIsDirty(false);
    } else if (isOpen && mode === "add") {
      const newData = {
        invoiceDate: format(new Date(), "yyyy-MM-dd"),
        description: "",
        amount: "",
        currency: "QAR",
        option: "",
        paymentMethod: "Bank Transfer",
      };
      setFormData(newData);
      setIsDirty(false);
    }
    setSelectedFile(null);
    setError("");
    setShowDeleteConfirm(false);
  }, [isOpen, invoice, mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF, Word, Excel, and image files are allowed");
        return;
      }
      
      setSelectedFile(file);
      setError("");
      setIsDirty(true);
    }
  };

  const validateForm = () => {
    // Validate paymentId first
    if (!paymentId || paymentId === 'undefined') {
      setError("Invalid payment ID. Please refresh the page and try again.");
      return false;
    }

    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      setError("Valid amount is required");
      return false;
    }

    if (parseFloat(formData.amount) < 0) {
      setError("Amount cannot be negative");
      return false;
    }

    if (mode === "edit" && (!invoice?._id || invoice._id === 'undefined')) {
      setError("Invalid invoice ID. Please refresh the page and try again.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log("Submitting invoice with paymentId:", paymentId);
      console.log("Form data:", formData);
      console.log("Selected file:", selectedFile);

      let response;
      if (mode === "add") {
        response = await accountService.addPaymentInvoice(
          paymentId,
          formData,
          selectedFile
        );
      } else {
        response = await accountService.updatePaymentInvoice(
          paymentId,
          invoice._id,
          formData,
          selectedFile
        );
      }

      console.log("Invoice operation response:", response);

      if (response.success) {
        onSuccess?.(response);
        onClose();
      } else {
        setError(response.message || "Operation failed");
      }
    } catch (error) {
      console.error("Error submitting invoice:", error);
      setError(error.message || "Failed to save invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice?._id || !paymentId) {
      setError("Invalid invoice or payment ID");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      console.log("Deleting invoice:", invoice._id, "from payment:", paymentId);
      
      const response = await accountService.deletePaymentInvoice(paymentId, invoice._id);

      console.log("Delete response:", response);

      if (response.success) {
        onSuccess?.(response);
        onClose();
      } else {
        setError(response.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      setError(error.message || "Failed to delete invoice");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleClose = () => {
    if (isDirty && mode !== "view") {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const paymentMethods = [
    "Bank Transfer",
    "Cash",
    "Credit Card",
    "Document Only"
  ];

  const optionChoices = [
    "",
    "One-time",
    "Recurring", 
    "Installment",
    "Reimbursement",
    "Our Fee",
    "Government Fee",
    "Third Party",
    "Other"
  ];

  // Don't render if paymentId is invalid
  if (!paymentId || paymentId === 'undefined') {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={onClose}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-xl p-6 max-w-md mx-auto"
              >
                <div className="text-center">
                  <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Payment ID</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The payment ID is missing or invalid. Please refresh the page and try again.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl"
            >
              {/* Header */}
              <div className={`px-6 py-4 rounded-t-2xl ${
                mode === "add" ? "bg-gradient-to-r from-green-600 to-emerald-700" :
                mode === "edit" ? "bg-gradient-to-r from-blue-600 to-indigo-700" :
                "bg-gradient-to-r from-gray-600 to-slate-700"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 rounded-lg p-2 mr-3">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {mode === "add" ? "Add New Invoice" : 
                         mode === "edit" ? "Edit Invoice" : "View Invoice Details"}
                      </h3>
                      <p className="text-sm text-white/80">
                        {mode === "add" ? "Create a new invoice entry" :
                         mode === "edit" ? "Modify invoice information" : "Invoice information"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center"
                  >
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </motion.div>
                )}

                {/* Debug info in development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs">
                    <strong>Debug Info:</strong> PaymentID: {paymentId} | InvoiceID: {invoice?._id} | Mode: {mode}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Invoice Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Invoice Date
                      </label>
                      <input
                        type="date"
                        name="invoiceDate"
                        value={formData.invoiceDate}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                        Amount
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      />
                    </div>

                    {/* Currency */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                        Currency
                      </label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        required
                      >
                        <option value="QAR">QAR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <PencilSquareIcon className="h-4 w-4 inline mr-1" />
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={mode === "view"}
                      rows={3}
                      placeholder="Enter a detailed description of the invoice..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCardIcon className="h-4 w-4 inline mr-1" />
                        Payment Method
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Option Category
                      </label>
                      <select
                        name="option"
                        value={formData.option}
                        onChange={handleInputChange}
                        disabled={mode === "view"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                      >
                        <option value="">Select category (optional)</option>
                        {optionChoices.slice(1).map((choice) => (
                          <option key={choice} value={choice}>
                            {choice}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* File Upload */}
                  {mode !== "view" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <PhotoIcon className="h-4 w-4 inline mr-1" />
                        Invoice Document
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, Word, Excel, or image files (max 5MB)
                        </p>
                      </div>
                      {selectedFile && (
                        <p className="text-sm text-green-600 mt-2 flex items-center">
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Selected: {selectedFile.name}
                        </p>
                      )}
                      {invoice?.fileName && !selectedFile && (
                        <p className="text-sm text-gray-600 mt-2">
                          Current file: {invoice.fileName}
                          {invoice.fileUrl && (
                            <a
                              href={invoice.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              View
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                  )}

                  {/* View mode file display */}
                  {mode === "view" && invoice?.fileUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                        Invoice Document
                      </label>
                      <a
                        href={invoice.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        {invoice.fileName || "View Document"}
                      </a>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
                <div>
                  {mode === "edit" && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Invoice
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {mode === "view" ? "Close" : "Cancel"}
                  </button>
                  
                  {mode !== "view" && (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      {mode === "add" ? "Add Invoice" : "Save Changes"}
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center"
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-xl p-6 m-4 max-w-sm w-full"
                    >
                      <div className="flex items-center mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to delete this invoice? This action cannot be undone.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isSubmitting}
                          className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={isSubmitting}
                          className="flex-1 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700"
                        >
                          {isSubmitting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FixedInvoiceEditModal;