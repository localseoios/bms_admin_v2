// utils/operationService.js
import axiosInstance from "./axios";

// Service for handling Operation Manager functionality
const operationService = {
  // Upload Engagement Letter
  uploadEngagementLetter: async (jobId, file) => {
    const formData = new FormData();
    formData.append("engagementLetter", file);

    try {
      const response = await axiosInstance.post(
        `/operations/${jobId}/engagement-letter`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update Company Details
  updateCompanyDetails: async (jobId, companyDetails, files = {}) => {
    const formData = new FormData();

    // Add company details as JSON string
    formData.append("companyDetails", JSON.stringify(companyDetails));

    // Add files if they exist
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        formData.append(key, file);
      }
    }

    try {
      const response = await axiosInstance.put(
        `/operations/${jobId}/company-details`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update Person Details (Directors, Shareholders, Secretary, SEF)
  updatePersonDetails: async (jobId, section, personDetails, files = {}) => {
    const formData = new FormData();

    // Add person details array as JSON string
    formData.append(`${section}Details`, JSON.stringify(personDetails));

    // Add files if they exist
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        formData.append(key, file);
      }
    }

    try {
      const response = await axiosInstance.put(
        `/operations/${jobId}/person-details?section=${section}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update KYC Details
  updateKycDetails: async (jobId, kycDetails, files = {}) => {
    const formData = new FormData();

    // Add activeStatus
    formData.append("activeStatus", kycDetails.activeStatus);

    // Add documents array as JSON string
    formData.append("documents", JSON.stringify(kycDetails.documents));

    // Add files if they exist
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        formData.append(key, file);
      }
    }

    try {
      const response = await axiosInstance.put(
        `/operations/${jobId}/kyc-details`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark Job as In Progress
  markJobInProgress: async (jobId) => {
    try {
      const response = await axiosInstance.put(
        `/operations/${jobId}/in-progress`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Mark Job as Completed
  markJobCompleted: async (jobId, completionNotes = "") => {
    try {
      const response = await axiosInstance.put(
        `/operations/${jobId}/complete`,
        { completionNotes }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default operationService;
