// src/pages/MentorDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMentorStats } from "../services/stats";

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMentorStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load mentor stats", e);
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">Hello Mentor 👋</h2>
          <p className="text-sm text-teal-50">
            Track your assigned students and feedback activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
              Assigned Students
            </div>
            <div className="text-3xl font-semibold text-slate-800">
              {stats?.assigned_students ?? (loading ? "…" : 0)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
              Feedback Given
            </div>
            <div className="text-3xl font-semibold text-slate-800">
              {stats?.total_feedback ?? (loading ? "…" : 0)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
