// src/pages/StudentDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentStats } from "../services/stats";
import { getStudentAttendance } from "../services/attendance";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "attendance"

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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">
            Welcome, {user?.full_name} 👋
          </h2>
          <p className="text-sm text-teal-50">
            See your attendance and marks overview, plus detailed attendance
            records.
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
              active={activeTab === "attendance"}
              onClick={() => setActiveTab("attendance")}
            >
              Attendance Details
            </TabButton>
          </nav>
        </div>

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

/* ----------------- Student Attendance Details ----------------- */

function StudentAttendanceDetails() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      setError("");
      try {
        const data = await getStudentAttendance(user.id);
        setRecords(data || []);
      } catch (e) {
        console.error("Failed to load attendance", e);
        setError("Failed to load attendance records.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Attendance Records ({records.length})
      </h3>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading attendance…</div>
      ) : records.length === 0 ? (
        <div className="text-sm text-slate-500">
          No attendance records found.
        </div>
      ) : (
        <div className="overflow-x-auto max-h-80">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Subject</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="py-2 pr-3 text-slate-700">
                    {r.date || "-"}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">
                    {r.subject || "-"}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                        r.status === "present"
                          ? "bg-emerald-50 text-emerald-700"
                          : r.status === "absent"
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-slate-500">
                    {r.recorded_by || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
