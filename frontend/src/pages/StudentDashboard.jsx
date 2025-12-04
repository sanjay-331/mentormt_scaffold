// src/pages/StudentDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentStats } from "../services/stats";
import { getStudentAttendance } from "../services/attendance";
import { getStudentMarks } from "../services/marks";
import { getCirculars } from "../services/circulars";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview | attendance | marks | circulars

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudentStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load student stats", e);
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
            Student Dashboard
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
          <h2 className="text-xl font-semibold mb-1">
            Welcome, {user?.full_name} 👋
          </h2>
          <p className="text-sm text-teal-50">
            Track your attendance, marks, and important circulars here.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-2">
          <nav className="-mb-px flex gap-4 flex-wrap">
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </TabButton>
            <TabButton
              active={activeTab === "attendance"}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance Details
            </TabButton>
            <TabButton
              active={activeTab === "marks"}
              onClick={() => setActiveTab("marks")}
            >
              Marks Details
            </TabButton>
            <TabButton
              active={activeTab === "circulars"}
              onClick={() => setActiveTab("circulars")}
            >
              Circulars
            </TabButton>
          </nav>
        </div>

        {/* Overview with quick stats */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard
              label="Attendance %"
              value={
                stats?.attendance_percentage != null
                  ? `${stats.attendance_percentage}%`
                  : loadingStats
                  ? "…"
                  : "0%"
              }
            />
            <InfoCard
              label="Average Marks %"
              value={
                stats?.average_marks_percentage != null
                  ? `${stats.average_marks_percentage}%`
                  : loadingStats
                  ? "…"
                  : "0%"
              }
            />
            <InfoCard
              label="Subjects"
              value={stats?.total_subjects ?? (loadingStats ? "…" : 0)}
            />
          </div>
        )}

        {activeTab === "attendance" && <StudentAttendanceDetails />}

        {activeTab === "marks" && <StudentMarksDetails />}

        {activeTab === "circulars" && <StudentCirculars />}
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

function InfoCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* --------------- Attendance Details + Chart --------------- */

function StudentAttendanceDetails() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getStudentAttendance(user.id);
        setRecords(data || []);
        setChartData(buildAttendanceChartData(data || []));
      } catch (e) {
        console.error("Failed to load attendance", e);
        setLoadError("Failed to load attendance.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Attendance trend (by month)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Shows your overall attendance percentage month-wise.
        </p>

        {chartData.length === 0 ? (
          <div className="text-sm text-slate-500">
            Not enough data to show chart yet.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  name="Attendance %"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Attendance records ({records.length})
        </h3>

        {loadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading attendance…</div>
        ) : records.length === 0 ? (
          <div className="text-sm text-slate-500">
            No attendance records available.
          </div>
        ) : (
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-1.5 px-3 text-slate-700">
                      {formatDate(r.date)}
                    </td>
                    <td className="py-1.5 px-3 text-slate-700">
                      {r.subject}
                    </td>
                    <td className="py-1.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          r.status === "present"
                            ? "bg-emerald-50 text-emerald-700"
                            : r.status === "absent"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Build chart data: month-wise attendance percentage
function buildAttendanceChartData(records) {
  if (!records || records.length === 0) return [];

  const byMonth = {}; // { '2025-12' : { present, total } }

  for (const r of records) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!byMonth[key]) {
      byMonth[key] = { present: 0, total: 0 };
    }
    byMonth[key].total += 1;
    if (r.status === "present") {
      byMonth[key].present += 1;
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const percentage =
        value.total > 0 ? Math.round((value.present / value.total) * 100) : 0;
      return {
        month: label,
        percentage,
      };
    });
}

/* --------------- Marks Details + Chart --------------- */

function StudentMarksDetails() {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getStudentMarks(user.id);
        setMarks(data || []);
        setChartData(buildMarksChartData(data || []));
      } catch (e) {
        console.error("Failed to load marks", e);
        setLoadError("Failed to load marks.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Marks trend (per test)
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Each bar shows percentage scored in a particular test for each
          subject.
        </p>

        {chartData.length === 0 ? (
          <div className="text-sm text-slate-500">
            Not enough data to show chart yet.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar
                  dataKey="percentage"
                  name="Marks %"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Marks records ({marks.length})
        </h3>

        {loadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading marks…</div>
        ) : marks.length === 0 ? (
          <div className="text-sm text-slate-500">
            No marks records available.
          </div>
        ) : (
          <div className="max-h-[360px] overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="py-2 px-3">Subject</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Semester</th>
                  <th className="py-2 px-3">Marks</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m) => {
                  const percent =
                    m.max_marks > 0
                      ? Math.round((m.marks_obtained / m.max_marks) * 100)
                      : 0;
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.subject}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.marks_type}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.semester}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">
                        {m.marks_obtained}/{m.max_marks} ({percent}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function buildMarksChartData(marks) {
  if (!marks || marks.length === 0) return [];

  // One bar per (subject + test)
  return marks.map((m) => {
    const label = `${m.subject} ${m.marks_type}`;
    const percentage =
      m.max_marks > 0
        ? Math.round((m.marks_obtained / m.max_marks) * 100)
        : 0;
    return { label, percentage };
  });
}

/* --------------- Circulars (with attachment link) --------------- */

function StudentCirculars() {
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
                <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-sky-50 text-sky-700">
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
                  className="inline-flex items-center text-[11px] font-medium text-sky-600 hover:underline mb-1"
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

/* --------------- Helpers --------------- */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}
