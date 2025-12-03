// frontend/src/services/api.js
import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
