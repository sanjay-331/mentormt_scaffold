import api from "./api";

export async function getAcademicHistory() {
  const response = await api.get("/api/analytics/student/history");
  return response.data;
}
