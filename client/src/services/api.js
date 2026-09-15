import axios from "axios";

// Base URL for the backend API
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? window.location.origin
    : "http://localhost:5000");

// Create a reusable Axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`
});

// Attach the authentication token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("chat_token");

  // Add Bearer token when available
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;