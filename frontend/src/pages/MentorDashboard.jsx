// src/pages/MentorDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMentorStats } from "../services/stats";
import { getMentorStudents } from "../services/assignments";
import { createFeedback, getFeedbackForStudent } from "../services/feedback";
import {
  uploadAttendance,
  createAttendanceRecord,
} from "../services/attendance";
import { uploadMarks, createMarksRecord } from "../services/marks";
import { getCirculars } from "../services/circulars";
const API_BASE_URL = "http://127.0.0.1:8000";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { getMentorMenteesPerformance } from "../services/mentorStats";

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "students" | "attendance" | "marks"

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
            Manage your mentees, mark attendance, upload marks and share
            feedback.
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
              Attendance
            </TabButton>
            <TabButton
              active={activeTab === "marks"}
              onClick={() => setActiveTab("marks")}
            >
              Marks
            </TabButton>
            <TabButton
              active={activeTab === "circulars"}
              onClick={() => setActiveTab("circulars")}
            >
              Circulars
            </TabButton>
            <TabButton
              active={activeTab === "performance"}
              onClick={() => setActiveTab("performance")}
            >
              Mentees Performance
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

        {activeTab === "attendance" && <MentorAttendance />}

        {activeTab === "marks" && <MentorMarks />}

        {activeTab === "circulars" && <MentorCirculars />}

        {activeTab === "performance" && <MentorPerformance />}

      </main>
    </div>
  );
}
function MentorPerformance() {
  const { user } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getMentorMenteesPerformance();
        setMentees(data || []);
      } catch (e) {
        console.error("Failed to load mentee performance", e);
        setError("Failed to load mentee performance data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const chartData = (mentees || []).map((m) => ({
    name: m.full_name || m.usn || "Student",
    attendance: m.attendance_percentage ?? 0,
    marks: m.average_marks_percentage ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Mentee performance overview
        </h3>
        <p className="text-xs text-slate-500">
          Compare attendance and marks of all your mentees. Students in the red
          zone may need extra support.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading performance…</div>
      ) : mentees.length === 0 ? (
        <div className="text-sm text-slate-500">
          No mentees assigned yet, or no data available.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              Attendance vs Marks
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Each student shows two bars: attendance% and average marks%.
            </p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar
                    dataKey="attendance"
                    name="Attendance %"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="marks"
                    name="Marks %"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Mentee details ({mentees.length})
            </h4>

            <div className="max-h-[360px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">USN</th>
                    <th className="py-2 px-3">Dept</th>
                    <th className="py-2 px-3">Sem</th>
                    <th className="py-2 px-3">Attendance %</th>
                    <th className="py-2 px-3">Marks %</th>
                    <th className="py-2 px-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {mentees.map((m) => (
                    <tr
                      key={m.student_id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.full_name || "Unnamed"}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.usn || "-"}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.department || "-"}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.semester ?? "-"}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.attendance_percentage?.toFixed
                          ? m.attendance_percentage.toFixed(1)
                          : m.attendance_percentage}
                        %
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.average_marks_percentage?.toFixed
                          ? m.average_marks_percentage.toFixed(1)
                          : m.average_marks_percentage}
                        %
                      </td>
                      <td className="py-1.5 px-3">
                        <RiskBadge level={m.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RiskBadge({ level }) {
  if (level === "high") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">
        HIGH RISK
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
      LOW
    </span>
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

/* ----------------- Attendance (upload + manual) ----------------- */

function MentorAttendance() {
  const { user } = useAuth();

  // For students dropdown (manual attendance)
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Upload attendance state
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Manual attendance state
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [manualStatus, setManualStatus] = useState("present");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");

  // Load assigned students
  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoadingStudents(true);
      setStudentsError("");
      try {
        const data = await getMentorStudents(user.id);
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load mentor students for attendance", e);
        setStudentsError("Failed to load students for manual attendance.");
      } finally {
        setLoadingStudents(false);
      }
    }
    load();
  }, [user]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setUploadMessage("");
    setUploadError("");
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please choose a CSV or Excel file.");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    setUploadError("");
    try {
      const res = await uploadAttendance(file);
      setUploadMessage(res?.message || "Attendance uploaded successfully.");
    } catch (e) {
      console.error("Failed to upload attendance", e);
      const detail = e?.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : "Failed to upload attendance. Check file format and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualStudentId) {
      setManualError("Please select a student.");
      return;
    }
    if (!manualSubject.trim()) {
      setManualError("Please enter subject.");
      return;
    }
    setManualSaving(true);
    setManualMessage("");
    setManualError("");
    try {
      await createAttendanceRecord({
        student_id: manualStudentId,
        subject: manualSubject.trim(),
        date: manualDate,
        status: manualStatus,
      });
      setManualMessage("Attendance record added successfully.");
      setManualSubject("");
      setManualStatus("present");
    } catch (e) {
      console.error("Failed to create manual attendance", e);
      const detail = e?.response?.data?.detail;
      setManualError(
        typeof detail === "string"
          ? detail
          : "Failed to add attendance. Please try again."
      );
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload block */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Upload Attendance (Batch)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload a CSV or Excel file with columns:{" "}
            <span className="font-mono">
              student_usn, subject, date, status
            </span>
            . Status should be one of:{" "}
            <span className="font-mono">present</span>,{" "}
            <span className="font-mono">absent</span>,{" "}
            <span className="font-mono">leave</span>.
          </p>
        </div>

        {uploadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {uploadError}
          </div>
        )}
        {uploadMessage && (
          <div className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
            {uploadMessage}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-3">
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

      {/* Manual attendance block */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Add Single Attendance Record
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Quickly mark attendance for an individual student.
          </p>
        </div>

        {studentsError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {studentsError}
          </div>
        )}
        {manualError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {manualError}
          </div>
        )}
        {manualMessage && (
          <div className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
            {manualMessage}
          </div>
        )}

        <form
          onSubmit={handleManualSubmit}
          className="grid gap-3 md:grid-cols-4 text-sm"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Student
            </label>
            <select
              value={manualStudentId}
              onChange={(e) => setManualStudentId(e.target.value)}
              disabled={loadingStudents}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : "-- Select student --"}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.usn ? `(${s.usn})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={manualSubject}
              onChange={(e) => setManualSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Math"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={manualSaving}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {manualSaving ? "Saving..." : "Add attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function MentorCirculars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getCirculars();
        setCirculars(data || []);
      } catch (e) {
        console.error("Failed to load circulars", e);
        setError("Failed to load circulars.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Circulars ({circulars.length})
      </h3>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading circulars…</div>
      ) : circulars.length === 0 ? (
        <div className="text-sm text-slate-500">
          No circulars available for you yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {circulars.map((c) => (
            <article
              key={c.id}
              className="border border-slate-100 rounded-xl px-3 py-2 bg-slate-50"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-semibold text-slate-800">
                  {c.title}
                </h4>
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-teal-50 text-teal-700">
                  {c.target_audience}
                </span>
              </div>
              <p className="text-xs text-slate-600 whitespace-pre-wrap mb-1">
                {c.content}
              </p>

              {c.file_url && (
                <a
                  href={`${API_BASE_URL}${c.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-[11px] font-medium text-teal-600 hover:underline mb-1"
                >
                  📎 View attachment
                </a>
              )}

              <div className="text-[11px] text-slate-500">
                {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------- Marks (upload + manual) ----------------- */

function MentorMarks() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  // Upload marks
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Manual marks
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [marksType, setMarksType] = useState("IA1");
  const [marksObtained, setMarksObtained] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");

  // Load students for dropdown
  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoadingStudents(true);
      setStudentsError("");
      try {
        const data = await getMentorStudents(user.id);
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load mentor students for marks", e);
        setStudentsError("Failed to load students for marks.");
      } finally {
        setLoadingStudents(false);
      }
    }
    load();
  }, [user]);

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
    setUploadMessage("");
    setUploadError("");
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please choose a CSV or Excel file.");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    setUploadError("");
    try {
      const res = await uploadMarks(file);
      setUploadMessage(res?.message || "Marks uploaded successfully.");
    } catch (e) {
      console.error("Failed to upload marks", e);
      const detail = e?.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : "Failed to upload marks. Check file format and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setManualError("Please select a student.");
      return;
    }
    if (!subject.trim()) {
      setManualError("Please enter subject.");
      return;
    }
    if (!semester) {
      setManualError("Please enter semester.");
      return;
    }
    if (!marksObtained || !maxMarks) {
      setManualError("Please enter marks and max marks.");
      return;
    }

    setSaving(true);
    setManualMessage("");
    setManualError("");
    try {
      await createMarksRecord({
        student_id: studentId,
        subject: subject.trim(),
        semester: Number(semester),
        marks_type: marksType,
        marks_obtained: Number(marksObtained),
        max_marks: Number(maxMarks),
      });
      setManualMessage("Marks record added successfully.");
      setSubject("");
      setMarksObtained("");
      setMaxMarks("");
      setSemester("");
      setMarksType("IA1");
    } catch (e) {
      console.error("Failed to create manual marks", e);
      const detail = e?.response?.data?.detail;
      setManualError(
        typeof detail === "string"
          ? detail
          : "Failed to add marks. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload block */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Upload Marks (Batch)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Upload a CSV/Excel file with columns:{" "}
            <span className="font-mono">
              student_usn, subject, semester, marks_type, marks_obtained,
              max_marks
            </span>
            . Example marks_type: IA1, IA2, IA3, Assignment, VTU.
          </p>
        </div>

        {uploadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {uploadError}
          </div>
        )}
        {uploadMessage && (
          <div className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
            {uploadMessage}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-3">
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
              {uploading ? "Uploading..." : "Upload marks"}
            </button>
          </div>
        </form>
      </div>

      {/* Manual marks block */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Add Single Marks Record
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Add marks for an individual student and subject.
          </p>
        </div>

        {studentsError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {studentsError}
          </div>
        )}
        {manualError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            {manualError}
          </div>
        )}
        {manualMessage && (
          <div className="text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
            {manualMessage}
          </div>
        )}

        <form
          onSubmit={handleManualSubmit}
          className="grid gap-3 md:grid-cols-5 text-sm"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Student
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loadingStudents}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : "-- Select student --"}
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.usn ? `(${s.usn})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="e.g. Math"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Semester
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Type
            </label>
            <select
              value={marksType}
              onChange={(e) => setMarksType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="IA1">IA1</option>
              <option value="IA2">IA2</option>
              <option value="IA3">IA3</option>
              <option value="Assignment">Assignment</option>
              <option value="VTU">VTU</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Marks
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Obtained"
              />
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className="w-1/2 rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Max"
              />
            </div>
          </div>

          <div className="md:col-span-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Add marks"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------- My Students + Feedback (unchanged) ----------------- */

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

  useEffect(() => {
    async function load() {
      setLoadingStudents(true);
      setError("");
      try {
        const data = await getMentorStudents(user.id);
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load mentor students", e);
        setError("Failed to load assigned students.");
      } finally {
        setLoadingStudents(false);
      }
    }
    if (user?.id) load();
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
