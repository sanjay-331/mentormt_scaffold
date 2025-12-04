// src/services/marks.js
import api from "./api";

// Upload marks from CSV/Excel
export async function uploadMarks(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/marks/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data; // { message: "Uploaded X marks records" }
}

// Create a single manual marks record
// payload: { student_id, subject, semester, marks_type, marks_obtained, max_marks }
export async function createMarksRecord(payload) {
  const res = await api.post("/api/marks", payload);
  return res.data;
}

// Get all marks records for a student
export async function getStudentMarks(studentId) {
  const res = await api.get(`/api/marks/student/${studentId}`);
  return res.data; // array
}
