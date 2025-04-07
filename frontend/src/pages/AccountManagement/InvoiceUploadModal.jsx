import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DocumentIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  ExclamationCircleIcon,
  DocumentCheckIcon,
  CalendarIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";
import { toast } from "react-toastify";

const InvoiceUploadModal = ({
  payment,
  onClose,
  onSuccess,
  isReplacing = false,
}) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isIncorrectInvoice, setIsIncorrectInvoice] = useState(false);
  const [incorrectReason, setIncorrectReason] = useState("");
  const [existingInvoice, setExistingInvoice] = useState(null);
  const fileInputRef = useRef(null);

  // Form fields
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(
    `Invoice for ${payment.monthName} ${payment.year}`
  );

  // Check if there's already an invoice on component load
  useEffect(() => {
    if (payment.invoices && payment.invoices.length > 0) {
      // Find the first document-only invoice (supporting document)
      const existingDoc = payment.invoices.find(
        (inv) =>
          inv.option === "DOCUMENT_ONLY" ||
          inv.paymentMethod === "Document Only"
      );

      if (existingDoc) {
        setExistingInvoice(existingDoc);

        // If we're replacing, pre-fill the form with existing data
        if (isReplacing && existingDoc) {
          if (existingDoc.invoiceDate) {
            const date = new Date(existingDoc.invoiceDate);
            setInvoiceDate(date.toISOString().split("T")[0]);
          }

          if (existingDoc.description) {
            setDescription(existingDoc.description);
          }

          setIsIncorrectInvoice(existingDoc.isIncorrectInvoice || false);
          setIncorrectReason(existingDoc.incorrectReason || "");
        }
      }
    }
  }, [payment, isReplacing]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError(
          "Invalid file type. Please upload a PDF, Word, Excel, or image file."
        );
        setFile(null);
        return;
      }

      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        setFile(null);
        return;
      }

      setFile(selectedFile);

      // Set description based on filename if empty
      if (!description) {
        setDescription(selectedFile.name);
      }

      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    // Validate required fields
    if (!invoiceDate) {
      setError("Invoice date is required.");
      return;
    }

    if (!description) {
      setError("Description is required.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create FormData object for file upload
      const formData = new FormData();
      formData.append("invoiceFile", file);
      formData.append("paymentId", payment.id);

      // Add document details
      formData.append("invoiceDate", invoiceDate);
      formData.append("description", description);

      // Use one of the valid enum values from the schema
      formData.append("paymentMethod", "Bank Transfer");

      // Include amount to pass validation (will be treated as 0 for documents)
      formData.append("amount", "0");

      // Add flag if this is an incorrect invoice that needs to be marked as such
      if (isIncorrectInvoice) {
        formData.append("isIncorrectInvoice", "true");
        if (incorrectReason.trim()) {
          formData.append("incorrectReason", incorrectReason.trim());
        }
      }

      // Add option to identify this as a document-only upload
      formData.append("option", "DOCUMENT_ONLY");

      // If replacing, add a flag to remove the existing invoice first
      if (isReplacing && existingInvoice) {
        formData.append("replaceExisting", "true");
        if (existingInvoice.id) {
          formData.append("existingInvoiceId", existingInvoice.id);
        }
      }

      // Log what we're sending for debugging
      console.log("FormData keys being sent:", [...formData.keys()]);

      // Upload the invoice
      const result = await accountService.uploadInvoiceDocument(formData);

      toast.success(
        isReplacing
          ? `Invoice replaced successfully for ${payment.monthName} ${payment.year}!`
          : `Invoice uploaded successfully for ${payment.monthName} ${payment.year}!`
      );

      // Notify parent component
      if (onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (err) {
      console.error("Error uploading invoice:", err);

      let errorMessage = "Failed to upload invoice. Please try again.";

      // Try to extract the actual error message from the response
      if (err.message && typeof err.message === "string") {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Use the same validation as handleFileChange
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(droppedFile.type)) {
        setError(
          "Invalid file type. Please upload a PDF, Word, Excel, or image file."
        );
        return;
      }

      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File is too large. Maximum size is 5MB.");
        return;
      }

      setFile(droppedFile);

      // Set description based on filename if empty
      if (!description) {
        setDescription(droppedFile.name);
      }

      setError(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-bold flex items-center">
            <DocumentIcon className="h-5 w-5 mr-2" />
            {isReplacing ? "Replace" : "Upload"} Invoice for {payment.monthName}{" "}
            {payment.year}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Payment Details */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm font-medium text-blue-800">
                {payment.monthName} {payment.year} Payment Record
              </p>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Status:</span>{" "}
                <span
                  className={`font-medium ${
                    payment.status === "Paid"
                      ? "text-green-600"
                      : payment.status === "Pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {payment.status}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>{" "}
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(payment.totalAmount || 0)}
                </span>
              </div>
            </div>

            {/* Show warning for existing invoice if not replacing */}
            {existingInvoice && !isReplacing && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <div className="text-xs text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  <span>
                    This payment already has an invoice document. Uploading a
                    new invoice will replace the existing one.
                  </span>
                </div>
              </div>
            )}

            {/* Show existing invoice info if replacing */}
            {existingInvoice && isReplacing && (
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="text-xs text-blue-700 flex items-center mb-1">
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    Replacing existing document:
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  {existingInvoice.description || "Invoice document"}(
                  {new Date(existingInvoice.invoiceDate).toLocaleDateString()})
                </p>
              </div>
            )}
          </div>

          {/* Invoice Details Form - Document Information */}
          <div className="mb-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              Document Details
            </h3>

            <div>
              <label
                htmlFor="invoiceDate"
                className="block text-xs text-gray-500"
              >
                Document Date *
              </label>
              <input
                type="date"
                id="invoiceDate"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs text-gray-500"
              >
                Description *
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Monthly Invoice for Services"
                required
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              error ? "border-red-300 bg-red-50" : "border-blue-300 bg-gray-50"
            } hover:bg-gray-100 transition-colors cursor-pointer`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <DocumentCheckIcon className="h-10 w-10 text-green-500 mb-2" />
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ArrowUpTrayIcon className="h-10 w-10 text-blue-500 mb-2" />
                <p className="font-medium text-gray-900">
                  Drag and drop a file or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, Word, Excel, or image files (max 5MB)
                </p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-2 text-red-600 text-sm flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 mr-1 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Incorrect Invoice Option */}
          <div className="mt-4">
            <div className="flex items-center">
              <input
                id="incorrect-invoice"
                type="checkbox"
                checked={isIncorrectInvoice}
                onChange={(e) => setIsIncorrectInvoice(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="incorrect-invoice"
                className="ml-2 block text-sm text-gray-900"
              >
                Mark as incorrect invoice (for record keeping)
              </label>
            </div>

            {isIncorrectInvoice && (
              <div className="mt-2">
                <label
                  htmlFor="incorrect-reason"
                  className="block text-sm font-medium text-gray-700"
                >
                  Reason (optional)
                </label>
                <input
                  type="text"
                  id="incorrect-reason"
                  value={incorrectReason}
                  onChange={(e) => setIncorrectReason(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Wrong amount, Missing information"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer with Buttons */}
        <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
              !file || isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
          >
            {isUploading ? (
              <>
                <span className="inline-block animate-spin mr-2">⟳</span>
                {isReplacing ? "Replacing..." : "Uploading..."}
              </>
            ) : isReplacing ? (
              "Replace Invoice"
            ) : (
              "Upload Invoice"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default InvoiceUploadModal;
