// // frontend/src/services/api.js
// import axios from "axios";
// const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
// const api = axios.create({ baseURL: API_BASE, timeout: 10000 });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers = config.headers || {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;
// src/services/api.js


import axios from "axios";

const api = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
