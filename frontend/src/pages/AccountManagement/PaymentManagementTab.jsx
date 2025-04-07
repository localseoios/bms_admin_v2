import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  DocumentPlusIcon,
} from "@heroicons/react/24/outline";
import accountService from "../../utils/accountService";
import EnhancedMonthlyPaymentForm from "../MonthlyPaymentForm/EnhancedMonthlyPaymentForm";
import EnhancedMonthlyPaymentHistory from "../MonthlyPaymentForm/EnhancedMonthlyPaymentHistory";
import InvoiceUploadModal from "./InvoiceUploadModal";
import { toast } from "react-toastify";

const PaymentManagementTab = ({ client, jobId, jobType }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isAddNewMonthOpen, setIsAddNewMonthOpen] = useState(false);
  const [activeView, setActiveView] = useState("history"); // "history" or "form"
  const [paymentStats, setPaymentStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    lastPaymentDate: null,
  });
  // State for invoice upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payment history when the component loads
  useEffect(() => {
    if (!jobId) return;

    const fetchPaymentData = async () => {
      try {
        setLoading(true);
        const history = await accountService.getPaymentHistory(jobId);
        setPaymentHistory(history || []);

        // Calculate statistics
        if (history && history.length > 0) {
          const totalAmount = history.reduce(
            (sum, payment) => sum + payment.totalAmount,
            0
          );
          const paidAmount = history.reduce(
            (sum, payment) =>
              payment.status === "Paid" ? sum + payment.totalAmount : sum,
            0
          );
          const pendingAmount = totalAmount - paidAmount;

          // Get the most recent payment date
          const dates = history.map((payment) => new Date(payment.createdAt));
          const lastPaymentDate =
            dates.length > 0 ? new Date(Math.max(...dates)) : null;

          setPaymentStats({
            totalAmount,
            paidAmount,
            pendingAmount,
            lastPaymentDate,
          });
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching payment history:", err);
        setError("Failed to load payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [jobId]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    toast.success("Payment record added successfully!");
    setIsAddNewMonthOpen(false);
    setActiveView("history");

    // Refresh payment history
    refreshPaymentHistory();
  };

  // Handle refreshing payment data
  const handleRefresh = async () => {
    refreshPaymentHistory();
  };

  // Separate function for refreshing payment history to reuse
  const refreshPaymentHistory = async () => {
    try {
      setLoading(true);
      const history = await accountService.getPaymentHistory(jobId);
      setPaymentHistory(history || []);

      // Recalculate stats
      if (history && history.length > 0) {
        const totalAmount = history.reduce(
          (sum, payment) => sum + payment.totalAmount,
          0
        );
        const paidAmount = history.reduce(
          (sum, payment) =>
            payment.status === "Paid" ? sum + payment.totalAmount : sum,
          0
        );
        const pendingAmount = totalAmount - paidAmount;

        // Get the most recent payment date
        const dates = history.map((payment) => new Date(payment.createdAt));
        const lastPaymentDate =
          dates.length > 0 ? new Date(Math.max(...dates)) : null;

        setPaymentStats({
          totalAmount,
          paidAmount,
          pendingAmount,
          lastPaymentDate,
        });
      }

      toast.info("Payment history refreshed");
      setLoading(false);
    } catch (err) {
      console.error("Error refreshing payment history:", err);
      toast.error("Failed to refresh payment history.");
      setLoading(false);
    }
  };

  // Handle opening the invoice upload modal for a specific month
  const handleUploadInvoice = (payment, isReplacing = false) => {
    setSelectedPayment({
      ...payment,
      isReplacing, // Add flag to indicate if we are replacing an existing invoice
    });
    setShowUploadModal(true);
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    toast.success("Invoice uploaded successfully!");
    refreshPaymentHistory(); // Refresh to show the new invoice
    setShowUploadModal(false);
  };

  // If no jobId is provided, show a message
  if (!jobId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <ExclamationCircleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Job Selected
          </h3>
          <p className="text-gray-500">
            Please select a job to manage payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header with payment overview */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 mr-2 text-blue-600" />
            Payment Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage payment records for {client?.name || "this client"}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Refresh payment data"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Payment Statistics */}
      {!loading && !error && paymentHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-medium text-blue-500 uppercase">
              TOTAL BILLED
            </p>
            <p className="text-xl font-bold text-blue-700">
              {formatCurrency(paymentStats.totalAmount)}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs font-medium text-green-500 uppercase">
              PAID AMOUNT
            </p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(paymentStats.paidAmount)}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-xs font-medium text-yellow-500 uppercase">
              PENDING
            </p>
            <p className="text-xl font-bold text-yellow-700">
              {formatCurrency(paymentStats.pendingAmount)}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs font-medium text-purple-500 uppercase">
              LAST PAYMENT
            </p>
            <p className="text-xl font-bold text-purple-700">
              {paymentStats.lastPaymentDate
                ? paymentStats.lastPaymentDate.toLocaleDateString()
                : "No payments"}
            </p>
          </div>
        </div>
      )}

      {/* Job Information */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Job Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Service Type</p>
            <p className="text-sm font-medium">{jobType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Job ID</p>
            <p className="text-sm font-medium">{jobId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium flex items-center">
              <span className="inline-flex items-center mr-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Operation Complete
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Content based on active view */}
      <div className="mt-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-blue-500 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payment information...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-red-50 rounded-lg border border-red-100">
            <ExclamationCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Error Loading Payments
            </h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeView === "form" || isAddNewMonthOpen ? (
              <motion.div
                key="payment-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <EnhancedMonthlyPaymentForm
                  jobId={jobId}
                  jobType={jobType}
                  onClose={() => {
                    setIsAddNewMonthOpen(false);
                    setActiveView("history");
                  }}
                  onSuccess={handlePaymentSuccess}
                  isAccountingMode={true}
                />

                {/* Help text */}
                <div className="mt-4 bg-blue-50 rounded-md p-3 text-sm text-blue-700 flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                  <p>
                    Add payment records for each month. You can upload invoices
                    and other payment documents for record keeping.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="payment-history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <EnhancedMonthlyPaymentHistory
                  jobId={jobId}
                  jobType={jobType}
                  onUploadInvoice={handleUploadInvoice}
                />

                {paymentHistory.length === 0 && (
                  <div className="mt-6 bg-yellow-50 rounded-md p-4 text-sm text-yellow-700 flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium">No payment records found</p>
                      <p className="mt-1">
                        No payment records have been added for this job yet.
                        Please contact the Operation Management team if you need
                        to create payment records.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Invoice Upload Modal */}
      {showUploadModal && selectedPayment && (
        <InvoiceUploadModal
          payment={selectedPayment}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          isReplacing={selectedPayment.isReplacing || false}
        />
      )}
    </div>
  );
};

export default PaymentManagementTab;
