import api from "./api";

/**
 * Get subjects filtered by department and semester.
 */
export async function getSubjects(department, semester) {
  const params = {};
  if (department) params.department = department;
  if (semester) params.semester = semester;
  
  const res = await api.get("/api/subjects", { params });
  return res.data;
}

/**
 * Create a new subject.
 */
export async function createSubject(data) {
  const res = await api.post("/api/subjects", data);
  return res.data;
}

/**
 * Update a subject.
 */
export async function updateSubject(id, data) {
  const res = await api.put(`/api/subjects/${id}`, data);
  return res.data;
}

/**
 * Delete a subject.
 */
export async function deleteSubject(id) {
  const res = await api.delete(`/api/subjects/${id}`);
  return res.data;
}
