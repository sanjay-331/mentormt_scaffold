import api from "./api";

// Fetch user notifications
export async function getNotifications(limit = 20, skip = 0) {
  const res = await api.get(`/api/notifications?limit=${limit}&skip=${skip}`);
  return res.data;
}

// Mark a single notification as read
export async function markNotificationAsRead(id) {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
}

// Mark all as read
export async function markAllNotificationsAsRead() {
  const res = await api.post("/api/notifications/read-all");
  return res.data;
}

// Clear all notifications
export async function clearAllNotifications() {
  const res = await api.delete("/api/notifications/clear-all");
  return res.data;
}
