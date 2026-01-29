import api from "./api";

export async function getStudentTimeline() {
  const response = await api.get("/api/student/timeline");
  return response.data;
}
