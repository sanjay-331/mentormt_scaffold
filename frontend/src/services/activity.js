import api from "./api";

export async function getRecentActivity(limit = 10, skip = 0) {
  const res = await api.get(`/api/activity/recent?limit=${limit}&skip=${skip}`);
  return res.data;
}
