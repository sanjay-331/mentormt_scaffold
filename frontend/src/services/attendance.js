// src/services/attendance.js

import api from "./api";

// Upload attendance from CSV/Excel
export async function uploadAttendance(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/attendance/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  // Backend returns: { "message": "Uploaded X attendance records" }
  return res.data;
}

// Get all attendance records for a student
export async function getStudentAttendance(studentId) {
  const res = await api.get(`/api/attendance/student/${studentId}`);
  return res.data; // array of records
}
