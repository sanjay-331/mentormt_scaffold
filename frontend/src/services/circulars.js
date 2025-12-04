// src/services/circulars.js
import api from "./api";

// 🔹 Get circulars for current logged-in user
export async function getCirculars() {
  const res = await api.get("/api/circulars");
  return res.data; // array
}

// 🔹 Create circular with optional file attachment
export async function createCircular({
  title,
  content,
  target_audience,
  file,
}) {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("content", content);
  formData.append("target_audience", target_audience);
  if (file) {
    formData.append("file", file);
  }

  const res = await api.post("/api/circulars", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
