// // src/utils/api-debug.js
// import axios from "axios";

// /**
//  * Enhanced Axios instance with debugging and retry capabilities
//  * @param {Object} config - Axios configuration object
//  * @returns {Object} Enhanced axios instance
//  */
// export const createDebugAxios = (config = {}) => {
//   const instance = axios.create({
//     baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
//     timeout: 10000,
//     headers: {
//       "Content-Type": "application/json",
//     },
//     ...config,
//   });

//   // Request interceptor for debugging
//   instance.interceptors.request.use(
//     (config) => {
//       console.log(
//         `🚀 API Request: ${config.method.toUpperCase()} ${config.baseURL}${
//           config.url
//         }`,
//         config.params || {}
//       );
//       return config;
//     },
//     (error) => {
//       console.error("❌ Request Error:", error);
//       return Promise.reject(error);
//     }
//   );

//   // Response interceptor for debugging
//   instance.interceptors.response.use(
//     (response) => {
//       console.log(
//         `✅ API Response: ${response.config.method.toUpperCase()} ${
//           response.config.url
//         }`,
//         { status: response.status, data: response.data }
//       );
//       return response;
//     },
//     async (error) => {
//       const originalRequest = error.config;

//       // Log the error details
//       console.error(
//         `❌ API Error: ${originalRequest.method.toUpperCase()} ${
//           originalRequest.url
//         }`,
//         {
//           status: error.response?.status,
//           message: error.response?.data?.message || error.message,
//           error: error.response?.data || error,
//         }
//       );

//       // Implement retry logic for network errors (optional)
//       if (error.message.includes("Network Error") && !originalRequest._retry) {
//         originalRequest._retry = true;
//         console.log("🔄 Retrying due to network error...");

//         // Wait a moment before retrying
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//         return instance(originalRequest);
//       }

//       return Promise.reject(error);
//     }
//   );

//   return instance;
// };

// /**
//  * Safely execute API requests with better error handling
//  * @param {Function} apiCall - Async function containing the API call
//  * @param {Function} onSuccess - Success handler function
//  * @param {Function} onError - Error handler function
//  * @param {Function} onFinally - Function to always execute (optional)
//  */
// export const safeApiCall = async (
//   apiCall,
//   onSuccess,
//   onError,
//   onFinally = null
// ) => {
//   try {
//     const response = await apiCall();
//     if (onSuccess) onSuccess(response);
//     return response;
//   } catch (err) {
//     // Enhanced error object with better details
//     const enhancedError = {
//       message: err.response?.data?.message || err.message,
//       status: err.response?.status,
//       originalError: err,
//       friendlyMessage: getFriendlyErrorMessage(err),
//     };

//     if (onError) onError(enhancedError);
//     return null;
//   } finally {
//     if (onFinally) onFinally();
//   }
// };

// /**
//  * Get user-friendly error messages based on error types
//  */
// const getFriendlyErrorMessage = (error) => {
//   if (!error.response) {
//     return "Network error. Please check your internet connection.";
//   }

//   switch (error.response.status) {
//     case 400:
//       return "Invalid request. Please check your input and try again.";
//     case 401:
//       return "You are not authorized. Please log in again.";
//     case 403:
//       return "You don't have permission to access this resource.";
//     case 404:
//       return "The requested resource was not found.";
//     case 422:
//       return "Validation error. Please check your input.";
//     case 500:
//       return "Server error. Please try again later.";
//     default:
//       return "An unexpected error occurred. Please try again.";
//   }
// };

// export default { createDebugAxios, safeApiCall };
