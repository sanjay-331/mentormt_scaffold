// src/services/adminStats.js
import api from "./api";

// Overall counts: students, mentors, circulars, assignments
export async function getAdminOverview() {
  const res = await api.get("/api/stats/admin");
  return res.data;
}

// Mentor load: how many students per mentor
export async function getMentorLoad() {
  const res = await api.get("/api/stats/admin/mentor-load");
  return res.data;
}

// Students per department
export async function getStudentsByDepartment() {
  const res = await api.get("/api/stats/admin/students-by-department");
  return res.data;
}
