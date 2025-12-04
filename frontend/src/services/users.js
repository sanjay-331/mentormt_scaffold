// src/services/users.js

import api from "./api";

// Get list of users, optional role filter: "admin" | "mentor" | "student"
export async function fetchUsers(role) {
  const params = role ? { role } : {};
  const res = await api.get("/api/users", { params });
  return res.data;
}

// Create a new user via /api/auth/register
// payload: { email, full_name, role, password }
export async function createUser(payload) {
  const res = await api.post("/api/auth/register", payload);
  return res.data;
}

// Update user details (name, phone, department, semester, usn, employee_id)
export async function updateUser(userId, updates) {
  const res = await api.put(`/api/users/${userId}`, updates);
  return res.data;
}

// Delete a user
export async function deleteUser(userId) {
  const res = await api.delete(`/api/users/${userId}`);
  return res.data;
}
