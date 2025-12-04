// src/services/assignments.js

import api from "./api";

// Create / replace assignment for a mentor
export async function saveAssignment(mentorId, studentIds) {
  const res = await api.post("/api/assignments", null, {
    params: { mentor_id: mentorId, student_ids: studentIds },
  });
  return res.data;
}

// Get all students for a given mentor (not used yet for admin UI, but handy)
export async function getMentorStudents(mentorId) {
  const res = await api.get(`/api/assignments/mentor/${mentorId}`);
  return res.data; // { students: [...] }
}
