// src/services/mentorStats.js
import api from "./api";

// Performance summary of all mentees for logged-in mentor
export async function getMentorMenteesPerformance() {
  const res = await api.get("/api/stats/mentor/mentees-performance");
  return res.data;
}
