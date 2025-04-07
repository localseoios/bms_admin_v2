import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import axiosInstance from "../../utils/axios";
import {
  CalendarIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const MonthlyPaymentForm = ({ jobId, jobType, onClose, onSuccess }) => {
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [invoiceRows, setInvoiceRows] = useState([
    {
      invoiceDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      amount: "",
      option: "",
      paymentMethod: "",
      file: null,
      fileName: "",
    },
  ]);

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  // Month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleAddRow = () => {
    setInvoiceRows([
      ...invoiceRows,
      {
        invoiceDate: format(new Date(), "yyyy-MM-dd"),
        description: "",
        amount: "",
        option: "",
        paymentMethod: "",
        file: null,
        fileName: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (invoiceRows.length > 1) {
      const newRows = [...invoiceRows];
      newRows.splice(index, 1);
      setInvoiceRows(newRows);
    } else {
      toast.warning("You must have at least one invoice row");
    }
  };

  const handleFileChange = (index, event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const newRows = [...invoiceRows];
      newRows[index].file = file;
      newRows[index].fileName = file.name;
      setInvoiceRows(newRows);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newRows = [...invoiceRows];
    newRows[index][field] = value;
    setInvoiceRows(newRows);
  };

  const validateForm = () => {
    // Basic validation
    let valid = true;
    let errorMessage = "";

    // Check if any invoice row is empty
    for (let i = 0; i < invoiceRows.length; i++) {
      const row = invoiceRows[i];
      if (
        !row.invoiceDate ||
        !row.description ||
        !row.amount ||
        !row.paymentMethod
      ) {
        valid = false;
        errorMessage = `Invoice row ${i + 1} has missing required fields`;
        break;
      }
    }

    if (!valid) {
      setError(errorMessage);
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare form data for multipart/form-data
      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("jobType", jobType);
      formData.append("year", selectedYear);
      formData.append("month", selectedMonth);

      // Convert invoice data to JSON string and append to FormData
      const invoiceData = invoiceRows.map((row, index) => ({
        invoiceDate: row.invoiceDate,
        description: row.description,
        amount: row.amount,
        option: row.option || "",
        paymentMethod: row.paymentMethod,
        fileIndex: index, // Add fileIndex to match with uploaded files
      }));

      formData.append("invoices", JSON.stringify(invoiceData));

      // Log what we're sending
      console.log("Submitting form with data:", {
        jobId,
        jobType,
        year: selectedYear,
        month: selectedMonth,
        invoices: invoiceData,
      });

      // Add files to form data
      invoiceRows.forEach((row, index) => {
        if (row.file) {
          console.log(`Adding file for invoice ${index}:`, row.fileName);
          formData.append(`invoiceFiles`, row.file);
        }
      });

      // Submit to the backend
      const response = await axiosInstance.post(
        "/monthlypayment/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Server response:", response.data);

      setLoading(false);
      toast.success("Monthly payment record added successfully");

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close the form
      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setLoading(false);
      setError(
        err.response?.data?.message || "Error adding monthly payment record"
      );
      toast.error(
        err.response?.data?.message || "Failed to add payment record"
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
          Add Monthly Payment Record
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Year Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
              disabled={loading}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
              disabled={loading}
            >
              {months.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Payment details and invoices section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-base font-medium text-gray-900 mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
            Payment Details and Invoices
          </h4>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Invoice Date*
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Description*
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount*
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Option
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Payment Method*
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Upload
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    File
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoiceRows.map((row, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <input
                        type="date"
                        value={row.invoiceDate}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "invoiceDate",
                            e.target.value
                          )
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                        disabled={loading}
                        required
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Service description"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                        disabled={loading}
                        required
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount}
                        onChange={(e) =>
                          handleInputChange(index, "amount", e.target.value)
                        }
                        placeholder="0.00"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                        disabled={loading}
                        required
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <select
                        value={row.option}
                        onChange={(e) =>
                          handleInputChange(index, "option", e.target.value)
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                        disabled={loading}
                      >
                        <option value="">Select (optional)</option>
                        <option value="Option 1">Option 1</option>
                        <option value="Option 2">Option 2</option>
                        <option value="Option 3">Option 3</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <select
                        value={row.paymentMethod}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "paymentMethod",
                            e.target.value
                          )
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md shadow-sm"
                        disabled={loading}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <label
                        htmlFor={`file-upload-${index}`}
                        className={`cursor-pointer inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 ${
                          loading
                            ? "bg-gray-100 opacity-50"
                            : "bg-white hover:bg-gray-50"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                      >
                        <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                        Upload
                      </label>
                      <input
                        id={`file-upload-${index}`}
                        name={`file-upload-${index}`}
                        type="file"
                        className="sr-only"
                        onChange={(e) => handleFileChange(index, e)}
                        disabled={loading}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      {row.fileName ? (
                        <span className="text-sm text-gray-700 truncate max-w-xs inline-block">
                          {row.fileName}
                        </span>
                      ) : (
                        <span className="text-gray-400">No file</span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className={`inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white ${
                          loading ? "bg-red-300" : "bg-red-600 hover:bg-red-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                        disabled={loading || invoiceRows.length === 1}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add row button */}
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleAddRow}
              className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 ${
                loading ? "bg-gray-100 opacity-50" : "bg-white hover:bg-gray-50"
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              disabled={loading}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Add Row
            </button>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            disabled={loading}
          >
            {loading ? (
              <>
                <ClockIcon className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default MonthlyPaymentForm;
