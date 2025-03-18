import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL + "/api",
  withCredentials: true, // Required for cookies (e.g., JWT token)
});

export default axiosInstance;
