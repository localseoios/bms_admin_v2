// utils/axios.js
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: `${backendUrl}/api`, // Use environment variable with fallback
  withCredentials: true, // For cookie-based authentication
  timeout: 60000, // Increase timeout to 60 seconds for file uploads
});

// Add a request interceptor to handle token and FormData
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add token from localStorage here if you're using token-based auth
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }

    // Important: Don't set Content-Type for FormData requests
    // Let the browser set it automatically with the correct boundary
    if (config.data instanceof FormData) {
      // Remove content-type to let the browser set it with the boundary
      delete config.headers["Content-Type"];
    } else {
      // For non-FormData requests, use application/json
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor with improved error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log detailed information for file upload errors
    if (error.config && error.config.data instanceof FormData) {
      console.error(
        "File upload error:",
        error.response?.data || error.message
      );

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
      // Redirect to login or refresh token
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
  }
);

export default axiosInstance;
