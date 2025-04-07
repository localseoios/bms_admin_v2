// utils/accountService.js
import axiosInstance from "./axios";

// Service for handling Account Management functionality
const accountService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get("/account/dashboard");
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
      // Return default values instead of throwing error for better UX
      return {
        jobsRequiringPayment: 0,
        jobsWithPayments: 0,
        totalPayments: 0,
        paidPayments: 0,
        pendingPayments: 0,
        overduePayments: 0,
        totalAmountPaid: 0,
        totalAmountPending: 0,
        monthlyTrend: [],
      };
    }
  },

  // Get jobs that are eligible for payment (operation complete or with existing payments)
  getCompletedJobs: async (page = 1, limit = 10, search = "") => {
    try {
      const params = {
        page,
        limit,
      };

      // Add search parameter if provided
      if (search) {
        params.search = search;
      }

      const response = await axiosInstance.get(
        "/account/jobs/payment-eligible",
        { params }
      );
      console.log("Payment eligible jobs API response:", response.data);

      // Handle different response structures
      if (Array.isArray(response.data)) {
        // If the response is directly an array of jobs
        return {
          jobs: response.data,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems: response.data.length,
            totalPages: Math.ceil(response.data.length / limit),
          },
        };
      } else if (response.data && response.data.jobs) {
        // If the response is an object with jobs and pagination
        return response.data;
      } else {
        console.warn("Unexpected response format:", response.data);
        return {
          jobs: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: limit,
          },
        };
      }
    } catch (error) {
      console.error("Error fetching payment eligible jobs:", error);
      // Return empty data instead of throwing error
      return {
        jobs: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }
  },

  // Get all payment records with filtering
  getAllPaymentRecords: async (
    page = 1,
    limit = 10,
    search = "",
    year = ""
  ) => {
    try {
      const params = {
        page,
        limit,
        search,
        year,
      };

      const response = await axiosInstance.get("/account/payments", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching payment records:", error);
      return {
        payments: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
        },
      };
    }
  },

  // Get payment history for a job
  getPaymentHistory: async (jobId) => {
    try {
      const response = await axiosInstance.get(
        `/monthlypayment/history/${jobId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching payment history for job ${jobId}:`, error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  },

  // Get payment reports with advanced filtering
  getPaymentReports: async (filters = {}) => {
    try {
      const response = await axiosInstance.get("/account/reports", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching payment reports:", error);
      return { payments: [], pagination: {}, summary: {} };
    }
  },

  // Create or update payment record
  createUpdatePaymentRecord: async (paymentData, files) => {
    try {
      const formData = new FormData();

      // Add payment ID if updating existing record
      if (paymentData.paymentId) {
        formData.append("paymentId", paymentData.paymentId);
      }

      // Add payment data fields
      formData.append("jobId", paymentData.jobId);
      formData.append("jobType", paymentData.jobType);
      formData.append("year", paymentData.year);
      formData.append("month", paymentData.month);

      if (paymentData.status) {
        formData.append("status", paymentData.status);
      }

      if (paymentData.notes) {
        formData.append("notes", paymentData.notes);
      }

      // Add invoices as JSON string
      formData.append("invoices", JSON.stringify(paymentData.invoices));

      // Add files if present
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append("invoiceFiles", files[i]);
          // Store the index in a separate field for mapping files to invoices
          if (
            paymentData.fileIndices &&
            paymentData.fileIndices[i] !== undefined
          ) {
            formData.append(`fileIndex_${i}`, paymentData.fileIndices[i]);
          }
        }
      }

      const response = await axiosInstance.post(`/account/payments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error creating/updating payment record:", error);
      throw error.response?.data || error.message;
    }
  },

  // Upload an invoice document to an existing payment record
  uploadInvoiceDocument: async (formData) => {
    try {
      console.log("Uploading invoice document...");

      // Log the FormData keys for debugging
      console.log("FormData keys being sent:", [...formData.keys()]);

      // Make sure we're using one of the valid payment methods from the schema
      if (!formData.has("paymentMethod")) {
        formData.append("paymentMethod", "Bank Transfer");
      }

      // Ensure amount is present (required by schema)
      if (!formData.has("amount")) {
        formData.append("amount", "0");
      }

      // Add a special flag to identify it as a document-only entry
      if (!formData.has("option")) {
        formData.append("option", "DOCUMENT_ONLY");
      }

      const response = await axiosInstance.post(
        `/account/payments/upload-invoice`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error in uploadInvoiceDocument:", error);

      // Enhanced error handling to extract detailed error messages
      if (error.response && error.response.data) {
        // Extract the detailed error message if available
        const errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          "Upload failed. Please try again.";

        console.error("Server returned error:", errorMessage);

        // Throw a more informative error
        throw new Error(errorMessage);
      }

      throw error;
    }
  },

  // Update payment status (Paid, Pending, Overdue)
  updatePaymentStatus: async (paymentId, status, notes) => {
    try {
      const response = await axiosInstance.patch(
        `/account/payments/${paymentId}/status`,
        { status, notes }
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating payment status for ${paymentId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Delete payment record (keep this for compatibility)
  deleteMonthlyPayment: async (paymentId) => {
    try {
      const response = await axiosInstance.delete(
        `/monthlypayment/${paymentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting payment ${paymentId}:`, error);
      throw error.response?.data || error.message;
    }
  },

  // Get client details by Gmail
  getClientDetails: async (gmail) => {
    try {
      const response = await axiosInstance.get(`/clients/${gmail}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client details for ${gmail}:`, error);
      // Return minimal client data instead of throwing
      return {
        name: gmail.split("@")[0],
        email: gmail,
        phone: "N/A",
        company: "N/A",
      };
    }
  },

  // Get all jobs for a client
  getClientJobs: async (gmail) => {
    try {
      console.log(`Fetching jobs for client: ${gmail}`);

      // Use the jobs endpoint with a search parameter
      const params = { search: gmail };
      const response = await axiosInstance.get(`/jobs`, { params });

      console.log(`Found ${response.data.length || 0} jobs for ${gmail}`);

      // Return the data - may need to filter by client email if the backend doesn't do it
      if (Array.isArray(response.data)) {
        // If response is array, return it directly (might need filtering)
        return response.data;
      } else if (response.data && response.data.jobs) {
        // If response is object with jobs property, return the jobs array
        return response.data.jobs;
      }

      // Default return empty array
      return [];
    } catch (error) {
      console.error(`Error fetching jobs for client ${gmail}:`, error);
      // Return empty array instead of throwing for better UX
      return [];
    }
  },
};

export default accountService;
