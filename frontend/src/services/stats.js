// src/services/stats.js

import api from "./api";

export async function getAdminStats() {
  const res = await api.get("/api/stats/admin");
  return res.data;
}

export async function getMentorStats() {
  const res = await api.get("/api/stats/mentor");
  return res.data;
}

export async function getStudentStats() {
  const res = await api.get("/api/stats/student");
  return res.data;
}

export async function getStudentPerformance() {
  const res = await api.get("/api/stats/student/performance");
  return res.data;
}

export async function getMentorDashboardOverview() {
  const res = await api.get("/api/stats/mentor/dashboard-overview");
  return res.data;
}
