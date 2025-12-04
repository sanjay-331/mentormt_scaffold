import api from "./api";

export async function saveAssignment(mentorId, studentIds) {
  const res = await api.post("/api/assignments", {
    mentor_id: mentorId,
    student_ids: studentIds,
  });
  return res.data;
}

export async function getMentorStudents(mentorId) {
  const res = await api.get(`/api/assignments/mentor/${mentorId}`);
  return res.data;
}
