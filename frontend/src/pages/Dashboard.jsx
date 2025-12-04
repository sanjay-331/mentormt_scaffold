// src/pages/Dashboard.jsx

import React from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import MentorDashboard from "./MentorDashboard";
import StudentDashboard from "./StudentDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "mentor") {
    return <MentorDashboard />;
  }

  if (user.role === "student") {
    return <StudentDashboard />;
  }

  // Fallback – unknown role
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4">
        <p className="text-slate-700 text-sm">
          Logged in as <span className="font-medium">{user.full_name}</span> with
          role <span className="font-mono">{user.role}</span>, but this role has
          no dashboard yet.
        </p>
      </div>
    </div>
  );
}
