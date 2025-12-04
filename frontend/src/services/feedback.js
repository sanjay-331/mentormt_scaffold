// src/services/feedback.js

import api from "./api";

// Create feedback for a student (mentor/admin)
export async function createFeedback(studentId, feedbackText) {
  const res = await api.post("/api/feedback", {
    student_id: studentId,
    feedback_text: feedbackText,
  });
  return res.data;
}

// Get all feedback entries for a student
export async function getFeedbackForStudent(studentId) {
  const res = await api.get(`/api/feedback/student/${studentId}`);
  return res.data;
}
