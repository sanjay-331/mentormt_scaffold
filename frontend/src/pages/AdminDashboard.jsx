// src/pages/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminStats } from "../services/stats";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users";
import { saveAssignment } from "../services/assignments";
import { getCirculars, createCircular } from "../services/circulars";
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

import {
  getAdminOverview,
  getMentorLoad,
  getStudentsByDepartment,
} from "../services/adminStats";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview | users | assignments | circulars

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to load admin stats", e);
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-800">
            Admin Dashboard
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
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-500 text-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-1">Welcome Admin 👋</h2>
          <p className="text-sm text-indigo-50">
            Manage users, mentor assignments and college circulars from a single
            place.
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
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
            >
              User Management
            </TabButton>
            <TabButton
              active={activeTab === "assignments"}
              onClick={() => setActiveTab("assignments")}
            >
              Mentor Assignments
            </TabButton>
            <TabButton
              active={activeTab === "circulars"}
              onClick={() => setActiveTab("circulars")}
            >
              Circulars
            </TabButton>
            <TabButton
              active={activeTab === "analytics"}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </TabButton>
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Students"
              value={stats?.total_students ?? (loadingStats ? "…" : 0)}
            />
            <StatCard
              label="Total Mentors"
              value={stats?.total_mentors ?? (loadingStats ? "…" : 0)}
            />
            <StatCard
              label="Total Assignments"
              value={stats?.total_assignments ?? (loadingStats ? "…" : 0)}
            />
            <StatCard
              label="Total Circulars"
              value={stats?.total_circulars ?? (loadingStats ? "…" : 0)}
            />
          </div>
        )}

        {activeTab === "users" && <AdminUsers />}

        {activeTab === "assignments" && <AdminAssignments />}

        {activeTab === "circulars" && <AdminCirculars />}

        {activeTab === "attendance" && <AdminAttendance />}

        {activeTab === "marks" && <AdminMarks />}

        {activeTab === "analytics" && <AdminAnalytics />}

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
          ? "border-indigo-500 text-indigo-600"
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
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* ----------------- User Management ----------------- */

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");

  const [formMode, setFormMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "student",
    password: "",
    department: "",
    semester: "",
    usn: "",
    employee_id: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line
  }, [roleFilter]);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const roleParam = roleFilter === "all" ? undefined : roleFilter;
      const data = await getUsers(roleParam);
      setUsers(data || []);
    } catch (e) {
      console.error("Failed to load users", e);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  const startCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm({
      full_name: "",
      email: "",
      role: "student",
      password: "",
      department: "",
      semester: "",
      usn: "",
      employee_id: "",
      phone: "",
    });
  };

  const startEdit = (u) => {
    setFormMode("edit");
    setEditingId(u.id);
    setForm({
      full_name: u.full_name || "",
      email: u.email || "",
      role: u.role || "student",
      password: "",
      department: u.department || "",
      semester: u.semester ?? "",
      usn: u.usn || "",
      employee_id: u.employee_id || "",
      phone: u.phone || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (formMode === "create") {
        await createUser(form);
      } else if (formMode === "edit" && editingId) {
        const { password, email, role, ...rest } = form;
        await updateUser(editingId, rest);
      }
      await loadUsers();
      startCreate();
    } catch (e) {
      console.error("Failed to save user", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to save user. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      await loadUsers();
    } catch (e) {
      console.error("Failed to delete user", e);
      setError("Failed to delete user.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Users ({users.length})
          </h3>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs rounded-full border border-slate-300 px-2 py-1 bg-white"
          >
            <option value="all">All</option>
            <option value="admin">Admins</option>
            <option value="mentor">Mentors</option>
            <option value="student">Students</option>
          </select>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto max-h-[420px]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Dept</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-2 pr-3 text-slate-800">{u.full_name}</td>
                    <td className="py-2 pr-3 text-slate-600">{u.email}</td>
                    <td className="py-2 pr-3 text-slate-600 capitalize">
                      {u.role}
                    </td>
                    <td className="py-2 pr-3 text-slate-600">
                      {u.department || "-"}
                    </td>
                    <td className="py-2 pr-2 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => startEdit(u)}
                        className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {formMode === "create" ? "Create User" : "Edit User"}
          </h3>
          {formMode === "edit" && (
            <button
              type="button"
              onClick={startCreate}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              + New User
            </button>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-3 text-sm md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Full name
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required={formMode === "create"}
              disabled={formMode === "edit"}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="student">Student</option>
            </select>
          </div>

          {formMode === "create" && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Department
            </label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Semester (for students)
            </label>
            <input
              type="number"
              name="semester"
              value={form.semester}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              USN (for students)
            </label>
            <input
              name="usn"
              value={form.usn}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Employee ID (for mentors)
            </label>
            <input
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-500 to-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? formMode === "create"
                  ? "Creating..."
                  : "Updating..."
                : formMode === "create"
                  ? "Create user"
                  : "Update user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ----------------- Mentor Assignments ----------------- */

function AdminAssignments() {
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [mentorList, studentList] = await Promise.all([
          getUsers("mentor"),
          getUsers("student"),
        ]);
        setMentors(mentorList || []);
        setStudents(studentList || []);
      } catch (e) {
        console.error("Failed to load users for assignments", e);
        setError("Failed to load mentors/students.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedMentorId) {
      setError("Please select a mentor.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveAssignment(selectedMentorId, selectedStudentIds);
      setMessage("Assignment saved successfully.");
    } catch (e) {
      console.error("Failed to save assignment", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to save assignment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Select Mentor
        </h3>
        {loading ? (
          <div className="text-sm text-slate-500">Loading mentors…</div>
        ) : mentors.length === 0 ? (
          <div className="text-sm text-slate-500">No mentors found.</div>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {mentors.map((m) => {
              const active = selectedMentorId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMentorId(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition ${
                    active
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold">{m.full_name}</div>
                  <div className="text-xs text-slate-500">
                    {m.employee_id || "-"} • {m.department || "No dept"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Assign Students
          </h3>
          <div className="text-xs text-slate-500">
            Selected: {selectedStudentIds.length}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {error}
          </div>
        )}
        {message && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-2">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="text-sm text-slate-500">No students found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[280px] border border-slate-100 rounded-xl">
            <div className="max-h-[280px] overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">USN</th>
                    <th className="py-2 px-3">Dept</th>
                    <th className="py-2 px-3">Sem</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const checked = selectedStudentIds.includes(s.id);
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(s.id)}
                          />
                        </td>
                        <td className="py-2 px-3 text-slate-800">
                          {s.full_name}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {s.usn || "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {s.department || "-"}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {s.semester ?? "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedMentorId}
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-500 to-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [mentorLoad, setMentorLoad] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [ov, ml, ds] = await Promise.all([
          getAdminOverview(),
          getMentorLoad(),
          getStudentsByDepartment(),
        ]);
        setOverview(ov || {});
        setMentorLoad(ml || []);
        setDeptStats(ds || []);
      } catch (e) {
        console.error("Failed to load admin analytics", e);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Students"
          value={overview?.total_students ?? "–"}
        />
        <StatCard
          label="Total Mentors"
          value={overview?.total_mentors ?? "–"}
        />
        <StatCard
          label="Assignments"
          value={overview?.total_assignments ?? "–"}
        />
        <StatCard
          label="Circulars"
          value={overview?.total_circulars ?? "–"}
        />
      </section>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500">Loading analytics…</div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          {/* Mentor load chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Students per mentor
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Helps you see which mentors are overloaded.
            </p>

            {mentorLoad.length === 0 ? (
              <div className="text-sm text-slate-500">
                No assignments found yet.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mentorLoad}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="mentor_name"
                      angle={-30}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="student_count"
                      name="Students"
                      radius={[4, 4, 0, 0]}
                      fill="#6366f1"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Students by department chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">
              Students by department
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Overall distribution of students across departments.
            </p>

            {deptStats.length === 0 ? (
              <div className="text-sm text-slate-500">
                No student data available.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="department"
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="count"
                      name="Students"
                      radius={[4, 4, 0, 0]}
                      fill="#0ea5e9"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// // Small stat card used above
// function StatCard({ label, value }) {
//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//       <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
//         {label}
//       </div>
//       <div className="text-2xl font-semibold text-slate-800">{value}</div>
//     </div>
//   );
// }


/* ----------------- Circulars (Admin) ----------------- */

function AdminCirculars() {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadCirculars();
  }, []);

  async function loadCirculars() {
    setLoading(true);
    setLoadError("");
    try {
      const data = await getCirculars();
      setCirculars(data || []);
    } catch (e) {
      console.error("Failed to load circulars", e);
      setLoadError("Failed to load circulars.");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setSaveError("Title and content are required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    setSaveMessage("");
    try {
      const created = await createCircular({
        title: title.trim(),
        content: content.trim(),
        target_audience: target,
        file,
        // all | students | mentors
      });
      setSaveMessage("Circular published successfully.");
      setTitle("");
      setContent("");
      setTarget("all");
      setCirculars((prev) => [created, ...prev]);
    } catch (e) {
      console.error("Failed to create circular", e);
      const detail = e?.response?.data?.detail;
      setSaveError(
        typeof detail === "string"
          ? detail
          : "Failed to publish circular. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create circular */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Publish Circular
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Circulars targeted to <span className="font-mono">all</span> will be
          visible to all roles. You can also send only to{" "}
          <span className="font-mono">students</span> or{" "}
          <span className="font-mono">mentors</span>.
        </p>

        {saveError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {saveError}
          </div>
        )}
        {saveMessage && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-2">
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Internal Assessment Schedule"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Content
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Write the circular details here…"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Target audience
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="students">Students only</option>
              <option value="mentors">Mentors only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Attachment (optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
              onChange={(e) => setFile(e.target.files[0])} // <-- store file
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              (PDF, Images, DOC allowed)
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-500 to-sky-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-indigo-600 hover:to-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Publishing..." : "Publish circular"}
            </button>
          </div>
        </form>
      </div>

      {/* List circulars */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">
            Recent Circulars ({circulars.length})
          </h3>
        </div>

        {loadError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-slate-500">Loading circulars…</div>
        ) : circulars.length === 0 ? (
          <div className="text-sm text-slate-500">
            No circulars found. Create the first one on the left.
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
                  <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-indigo-50 text-indigo-700">
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
                    className="inline-flex items-center text-[11px] font-medium text-indigo-600 hover:underline mb-1"
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
    </div>
  );
}
