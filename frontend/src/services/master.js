import api from "./api";

// Was getColleges
export async function getBranches() {
  const res = await api.get("/api/master/branches");
  return res.data;
}

// Was getDepartments(collegeId)
export async function getDepartments(branch) {
  const res = await api.get(`/api/master/departments?branch=${encodeURIComponent(branch)}`);
  return res.data;
}

// Was getSubjects(deptId, semester)
export async function getSubjects(branch, department) {
  // Semester is handled by filtering in components if needed, or we can add it later
  // The backend API strictly asks for branch + department now for the list
  const res = await api.get(`/api/master/subjects?branch=${encodeURIComponent(branch)}&department=${encodeURIComponent(department)}`);
  return res.data;
}
