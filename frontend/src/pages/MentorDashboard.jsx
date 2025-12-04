// src/pages/MentorDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMentorStats } from "../services/stats";
import { getMentorStudents } from "../services/assignments";
import {
  createFeedback,
  getFeedbackForStudent,
} from "../services/feedback";
import { uploadAttendance } from "../services/attendance";

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "students" | "attendance"

  // Load mentor stats
  useEffect(() => {
    async function load() {
      try {
        const data = await getMentorStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load mentor stats", e);
      } finally {
        setLoadingStats(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            Mentor Dashboard
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right text-sm text-slate-600">
                <div className="font-semibold">{user.full_name}</div>
                <div className="text-[11px] tracking-wide text-slate-500">
                  {user.role.toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1 hover:bg-slate-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">Hello Mentor 👋</h2>
          <p className="text-sm text-teal-50">
            Track your assigned students, upload attendance and share feedback.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-2">
          <nav className="-mb-px flex gap-4">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "students"}
              onClick={() => setActiveTab("students")}
            >
              My Students
            </TabButton>
            <TabButton
              active={activeTab === "attendance"}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance Upload
            </TabButton>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              label="Assigned Students"
              value={stats?.assigned_students ?? (loadingStats ? "…" : 0)}
            />
            <StatCard
              label="Feedback Given"
              value={stats?.total_feedback ?? (loadingStats ? "…" : 0)}
            />
          </div>
        )}

        {activeTab === "students" && <MentorStudents />}

        {activeTab === "attendance" && <MentorAttendanceUpload />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-teal-500 text-teal-600"
          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-3xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* ----------------- Attendance Upload ----------------- */

function MentorAttendanceUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a CSV or Excel file.");
      return;
    }
    setUploading(true);
    setMessage("");
    setError("");
    try {
      const res = await uploadAttendance(file);
      setMessage(res?.message || "Attendance uploaded successfully.");
    } catch (e) {
      console.error("Failed to upload attendance", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to upload attendance. Check file format and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Upload Attendance
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Upload a CSV or Excel file with columns:{" "}
          <span className="font-mono">
            student_usn, subject, date, status
          </span>
          . Status should be one of: <span className="font-mono">present</span>,{" "}
          <span className="font-mono">absent</span>,{" "}
          <span className="font-mono">leave</span>.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      {message && (
        <div className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="file"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? "Uploading..." : "Upload attendance"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ----------------- My Students + Feedback (same as before) ----------------- */

function MentorStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Load students assigned to this mentor
  useEffect(() => {
    async function load() {
      setLoadingStudents(true);
      setError("");
      try {
        const data = await getMentorStudents(user.id);
        // backend returns: { students: [...] }
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load mentor students", e);
        setError("Failed to load assigned students.");
      } finally {
        setLoadingStudents(false);
      }
    }
    if (user?.id) {
      load();
    }
  }, [user]);

  const openStudent = async (student) => {
    setSelectedStudent(student);
    setNewFeedback("");
    setFeedbackList([]);
    if (!student) return;

    setLoadingFeedback(true);
    setError("");
    try {
      const list = await getFeedbackForStudent(student.id);
      // backend returns an array of feedbacks
      setFeedbackList(list || []);
    } catch (e) {
      console.error("Failed to load feedback", e);
      setError("Failed to load feedback for this student.");
    } finally {
      setLoadingFeedback(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !newFeedback.trim()) return;
    setSubmittingFeedback(true);
    setError("");
    try {
      const created = await createFeedback(
        selectedStudent.id,
        newFeedback.trim()
      );
      setNewFeedback("");
      // append new feedback to list
      setFeedbackList((prev) => [created, ...prev]);
    } catch (e) {
      console.error("Failed to create feedback", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to submit feedback. Please try again."
      );
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Assigned Students ({students.length})
        </h3>

        {loadingStudents ? (
          <div className="text-sm text-slate-500">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="text-sm text-slate-500">
            No students assigned to you yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">USN</th>
                  <th className="py-2 pr-3">Dept</th>
                  <th className="py-2 pr-3">Sem</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-50 last:border-0 ${
                        isSelected ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <td className="py-2 pr-3 text-slate-800">
                        {s.full_name}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {s.usn || "-"}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {s.department || "-"}
                      </td>
                      <td className="py-2 pr-3 text-slate-600">
                        {s.semester ?? "-"}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <button
                          type="button"
                          onClick={() => openStudent(s)}
                          className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          {isSelected ? "Selected" : "View / Feedback"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback panel */}
      {selectedStudent && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                Feedback for {selectedStudent.full_name}
              </h4>
              <p className="text-xs text-slate-500">
                USN: {selectedStudent.usn || "—"} • Dept:{" "}
                {selectedStudent.department || "—"} • Sem:{" "}
                {selectedStudent.semester ?? "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedStudent(null);
                setFeedbackList([]);
                setNewFeedback("");
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>

          {/* New feedback form */}
          <form onSubmit={submitFeedback} className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Add feedback
            </label>
            <textarea
              rows={3}
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Write your feedback here..."
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submittingFeedback || !newFeedback.trim()}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? "Submitting..." : "Submit feedback"}
              </button>
            </div>
          </form>

          {/* Feedback history */}
          <div>
            <h5 className="text-xs font-semibold text-slate-700 mb-2">
              Previous feedback
            </h5>
            {loadingFeedback ? (
              <div className="text-sm text-slate-500">Loading feedback…</div>
            ) : feedbackList.length === 0 ? (
              <div className="text-sm text-slate-500">
                No feedback recorded yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {feedbackList.map((f) => (
                  <div
                    key={f.id}
                    className="border border-slate-100 rounded-xl px-3 py-2 bg-slate-50"
                  >
                    <div className="text-xs text-slate-500 mb-1">
                      {f.created_at
                        ? new Date(f.created_at).toLocaleString()
                        : ""}
                    </div>
                    <div className="text-sm text-slate-700">
                      {f.feedback_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
