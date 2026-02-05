import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/portfolio";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return { headers: { Authorization: `Bearer ${token}` } };
}

// --- Certifications ---
export async function getCertifications(studentId) {
  const res = await axios.get(`${API_URL}/certifications/${studentId}`, getAuthHeader());
  return res.data;
}

export async function addCertification(data) {
  const res = await axios.post(`${API_URL}/certifications`, data, getAuthHeader());
  return res.data;
}

export async function verifyCertification(id) {
  const res = await axios.patch(`${API_URL}/certifications/${id}/verify`, {}, getAuthHeader());
  return res.data;
}

// --- Projects ---
export async function getProjects(studentId) {
  const res = await axios.get(`${API_URL}/projects/${studentId}`, getAuthHeader());
  return res.data;
}

export async function addProject(data) {
  const res = await axios.post(`${API_URL}/projects`, data, getAuthHeader());
  return res.data;
}

// --- Letters ---
export async function getLetters(studentId) {
  const res = await axios.get(`${API_URL}/letters/${studentId}`, getAuthHeader());
  return res.data;
}

export async function submitLetter(data) {
  const res = await axios.post(`${API_URL}/letters`, data, getAuthHeader());
  return res.data;
}

export async function replyToLetter(id, reply) {
  const res = await axios.patch(`${API_URL}/letters/${id}/reply`, reply, getAuthHeader());
  return res.data;
}

export async function getAllStudentsAnalysis() {
  const res = await axios.get(`${API_URL}/analysis/batch/all`, getAuthHeader());
  return res.data;
}

// --- Sports ---
export async function getSports(studentId) {
  const res = await axios.get(`${API_URL}/sports/${studentId}`, getAuthHeader());
  return res.data;
}

export async function addSports(data) {
  const res = await axios.post(`${API_URL}/sports`, data, getAuthHeader());
  return res.data;
}

// --- Cultural ---
export async function getCultural(studentId) {
  const res = await axios.get(`${API_URL}/cultural/${studentId}`, getAuthHeader());
  return res.data;
}

export async function addCultural(data) {
  const res = await axios.post(`${API_URL}/cultural`, data, getAuthHeader());
  return res.data;
}

// --- Analysis ---
export async function getPlacementAnalysis(studentId) {
  const res = await axios.get(`${API_URL}/analysis/${studentId}`, getAuthHeader());
  return res.data;
}
