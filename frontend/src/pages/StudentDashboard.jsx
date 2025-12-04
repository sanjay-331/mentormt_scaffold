// src/pages/StudentDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentStats } from "../services/stats";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudentStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load student stats", e);
      } finally {
        setLoading(false);
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
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">
            Welcome, {user?.full_name} 👋
          </h2>
          <p className="text-sm text-teal-50">
            Quick snapshot of your attendance and marks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Attendance %"
            value={
              stats?.attendance_percentage != null
                ? `${stats.attendance_percentage}%`
                : loading
                ? "…"
                : "0%"
            }
          />
          <InfoCard
            label="Average Marks %"
            value={
              stats?.average_marks_percentage != null
                ? `${stats.average_marks_percentage}%`
                : loading
                ? "…"
                : "0%"
            }
          />
          <InfoCard
            label="Subjects"
            value={stats?.total_subjects ?? (loading ? "…" : 0)}
          />
        </div>
      </main>
    </div>
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
