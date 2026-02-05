import api from "./api"; // Use the centralized api instance with interceptors

// const API_URL = "http://127.0.0.1:8000/api/portfolio"; // Removed to use baseURL from api.js



// --- Certifications ---
export async function getCertifications(studentId) {
  const res = await api.get(`/api/portfolio/certifications/${studentId}`);
  return res.data;
}

export async function addCertification(data) {
  const res = await api.post(`/api/portfolio/certifications`, data);
  return res.data;
}

export async function verifyCertification(id) {
  const res = await api.patch(`/api/portfolio/certifications/${id}/verify`);
  return res.data;
}

// --- Projects ---
export async function getProjects(studentId) {
  const res = await api.get(`/api/portfolio/projects/${studentId}`);
  return res.data;
}

export async function addProject(data) {
  const res = await api.post(`/api/portfolio/projects`, data);
  return res.data;
}

// --- Letters ---
export async function getLetters(studentId) {
  const res = await api.get(`/api/portfolio/letters/${studentId}`);
  return res.data;
}

export async function submitLetter(data) {
  const res = await api.post(`/api/portfolio/letters`, data);
  return res.data;
}

export async function replyToLetter(id, reply) {
  const res = await api.patch(`/api/portfolio/letters/${id}/reply`, reply);
  return res.data;
}

export async function getAllStudentsAnalysis() {
  const res = await api.get(`/api/portfolio/analysis/batch/all`);
  return res.data;
}

// --- Sports ---
export async function getSports(studentId) {
  const res = await api.get(`/api/portfolio/sports/${studentId}`);
  return res.data;
}

export async function addSports(data) {
  const res = await api.post(`/api/portfolio/sports`, data);
  return res.data;
}

// --- Cultural ---
export async function getCultural(studentId) {
  const res = await api.get(`/api/portfolio/cultural/${studentId}`);
  return res.data;
}

export async function addCultural(data) {
  const res = await api.post(`/api/portfolio/cultural`, data);
  return res.data;
}

// --- Analysis ---
export async function getPlacementAnalysis(studentId) {
  const res = await api.get(`/api/portfolio/analysis/${studentId}`);
  return res.data;
}

export async function getPeerComparison(studentId) {
  const res = await api.get(`/api/portfolio/stats/peer-comparison/${studentId}`);
  return res.data;
}
