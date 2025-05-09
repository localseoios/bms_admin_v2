// utils/axios.js
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Base axios instance
const axiosInstance = axios.create({
  baseURL: `${backendUrl}/api`,
  withCredentials: true,
  timeout: 60000, // 60 seconds timeout
});

// Create a specialized instance for file uploads
export const fileUploadInstance = axios.create({
  baseURL: `${backendUrl}/api`, // Make sure to include /api like the main instance
  timeout: 120000, // 2 minute timeout for uploads
  withCredentials: true,
});

// Request interceptor function we'll apply to both instances
const requestInterceptor = (config) => {
  // Important: Don't set Content-Type for FormData requests
  if (config.data instanceof FormData) {
    // Remove content-type to let the browser set it with the boundary
    delete config.headers["Content-Type"];
  } else {
    // For non-FormData requests, use application/json
    config.headers["Content-Type"] = "application/json";
  }
  return config;
};

// Response error handler for both instances
const responseErrorHandler = (error) => {
  // Log detailed information for file upload errors
  if (error.config && error.config.data instanceof FormData) {
    console.error("File upload error:", error.response?.data || error.message);

    // Log request details for debugging (but not file contents)
    const formDataKeys = [];
    if (error.config.data instanceof FormData) {
      for (let key of error.config.data.keys()) {
        formDataKeys.push(key);
      }
    }
    console.error("FormData keys:", formDataKeys);
    console.error("Request URL:", error.config.url);
    console.error("Request method:", error.config.method);
  }

  // Handle authentication errors (401)
  if (error.response && error.response.status === 401) {
    console.log("Authentication error, redirecting to login");
    // window.location.href = '/login';
  }

  // Handle forbidden errors (403)
  if (error.response && error.response.status === 403) {
    console.log("Permission denied:", error.response.data);
  }

  // Handle server errors with more details
  if (error.response && error.response.status >= 500) {
    console.error("Server error:", error.response.data);
  }

  return Promise.reject(error);
};

// Apply interceptors to main instance
axiosInstance.interceptors.request.use(requestInterceptor, (error) =>
  Promise.reject(error)
);
axiosInstance.interceptors.response.use(
  (response) => response,
  responseErrorHandler
);

// Apply the same interceptors to file upload instance
fileUploadInstance.interceptors.request.use(requestInterceptor, (error) =>
  Promise.reject(error)
);
fileUploadInstance.interceptors.response.use(
  (response) => response,
  responseErrorHandler
);

export default axiosInstance;
