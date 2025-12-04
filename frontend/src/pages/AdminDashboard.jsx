// src/pages/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminStats } from "../services/stats";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users";
import { saveAssignment } from "../services/assignments";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "users" | "assignments"

  // Load admin stats
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
            Mentor–Mentee Admin
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero card */}
        <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-1">Welcome back 👋</h2>
          <p className="text-sm text-teal-50">
            As an admin, you can manage users, assignments, circulars and more.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4 border-b border-slate-200">
          <nav className="-mb-px flex gap-4">
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
              Users
            </TabButton>
            <TabButton
              active={activeTab === "assignments"}
              onClick={() => setActiveTab("assignments")}
            >
              Assignments
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
              label="Circulars"
              value={stats?.total_circulars ?? (loadingStats ? "…" : 0)}
            />
            <StatCard
              label="Assignments"
              value={stats?.total_assignments ?? (loadingStats ? "…" : 0)}
            />
          </div>
        )}

        {activeTab === "users" && <AdminUserManagement />}

        {activeTab === "assignments" && <AdminAssignments />}
      </main>
    </div>
  );
}

/* ----------------- Small UI components ----------------- */

function TabButton({ active, children, onClick }) {
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
      <div className="text-2xl font-semibold text-slate-800">{value}</div>
    </div>
  );
}

/* ----------------- Admin User Management (unchanged) ----------------- */

function AdminUserManagement() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState("");

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "student",
    password: "",
  });
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    department: "",
    semester: "",
    usn: "",
    employee_id: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Load users whenever roleFilter changes
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      setError("");
      try {
        const roleParam = roleFilter === "all" ? undefined : roleFilter;
        const data = await fetchUsers(roleParam);
        setUsers(data);
      } catch (e) {
        console.error("Failed to load users", e);
        setError("Failed to load users.");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [roleFilter]);

  const handleNewUserChange = (field, value) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await createUser(newUser);
      // Clear form
      setNewUser({
        full_name: "",
        email: "",
        role: "student",
        password: "",
      });
      // Reload users
      const roleParam = roleFilter === "all" ? undefined : roleFilter;
      const data = await fetchUsers(roleParam);
      setUsers(data);
    } catch (e) {
      console.error("Failed to create user", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to create user. Maybe email already exists?"
      );
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({
      full_name: u.full_name || "",
      phone: u.phone || "",
      department: u.department || "",
      semester: u.semester ?? "",
      usn: u.usn || "",
      employee_id: u.employee_id || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      full_name: "",
      phone: "",
      department: "",
      semester: "",
      usn: "",
      employee_id: "",
    });
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (userId) => {
    setSavingEdit(true);
    setError("");
    try {
      const payload = {
        full_name: editForm.full_name,
        phone: editForm.phone,
        department: editForm.department,
        semester: editForm.semester,
        usn: editForm.usn,
        employee_id: editForm.employee_id,
      };
      await updateUser(userId, payload);
      // reload users
      const roleParam = roleFilter === "all" ? undefined : roleFilter;
      const data = await fetchUsers(roleParam);
      setUsers(data);
      cancelEdit();
    } catch (e) {
      console.error("Failed to update user", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to update user. Check fields and try again."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setDeletingId(userId);
    setError("");
    try {
      await deleteUser(userId);
      const roleParam = roleFilter === "all" ? undefined : roleFilter;
      const data = await fetchUsers(roleParam);
      setUsers(data);
    } catch (e) {
      console.error("Failed to delete user", e);
      setError("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters + info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            User Management
          </h3>
          <p className="text-xs text-slate-500">
            View, add, edit and delete users. Email and role cannot be changed
            after creation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">
            Filter by role:
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm rounded-lg border border-slate-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All</option>
            <option value="admin">Admin</option>
            <option value="mentor">Mentor</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Add user form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-3">
          Add new user
        </h4>
        <form
          onSubmit={handleCreateUser}
          className="grid gap-3 md:grid-cols-4 text-sm"
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Full name
            </label>
            <input
              type="text"
              required
              value={newUser.full_name}
              onChange={(e) => handleNewUserChange("full_name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => handleNewUserChange("email", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Role
            </label>
            <select
              value={newUser.role}
              onChange={(e) => handleNewUserChange("role", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={newUser.password}
              onChange={(e) => handleNewUserChange("password", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>

      {/* Users table (same as before) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <h4 className="text-sm font-semibold text-slate-800 mb-3">
          Users ({users.length})
        </h4>

        {loadingUsers ? (
          <div className="text-sm text-slate-500">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Dept</th>
                  <th className="py-2 pr-4">Sem</th>
                  <th className="py-2 pr-4">USN</th>
                  <th className="py-2 pr-4">Emp ID</th>
                  <th className="py-2 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isEditing = editingId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.full_name}
                            onChange={(e) =>
                              handleEditChange("full_name", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          <span className="font-medium text-slate-800">
                            {u.full_name}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.department}
                            onChange={(e) =>
                              handleEditChange("department", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          u.department || "-"
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.semester}
                            onChange={(e) =>
                              handleEditChange("semester", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : u.semester != null ? (
                          u.semester
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.usn}
                            onChange={(e) =>
                              handleEditChange("usn", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          u.usn || "-"
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.employee_id}
                            onChange={(e) =>
                              handleEditChange("employee_id", e.target.value)
                            }
                            className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                        ) : (
                          u.employee_id || "-"
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => saveEdit(u.id)}
                              className="text-xs px-2 py-1 rounded bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-60"
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === u.id}
                              onClick={() => handleDelete(u.id)}
                              className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              {deletingId === u.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
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

/* ----------------- Admin Assignments ----------------- */

function AdminAssignments() {
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load mentors & students
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [mentorsData, studentsData] = await Promise.all([
          fetchUsers("mentor"),
          fetchUsers("student"),
        ]);
        setMentors(mentorsData);
        setStudents(studentsData);
      } catch (e) {
        console.error("Failed to load mentors/students", e);
        setError("Failed to load mentors or students.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!selectedMentor) {
      setError("Select a mentor first.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveAssignment(selectedMentor, selectedStudentIds);
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
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Mentor–Student Assignments
          </h3>
          <p className="text-xs text-slate-500">
            Choose a mentor and assign students to them. Saving will replace any
            existing assignment for that mentor.
          </p>
        </div>
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

      {loading ? (
        <div className="text-sm text-slate-500">Loading mentors and students…</div>
      ) : (
        <div className="grid md:grid-cols-[1fr,2fr] gap-4">
          {/* Mentor selector */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">
              Select mentor
            </h4>
            <select
              value={selectedMentor}
              onChange={(e) => setSelectedMentor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose mentor --</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              All selected students on the right will be assigned to this mentor.
            </p>
          </div>

          {/* Students list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Students ({students.length})
              </h4>
              <button
                type="button"
                onClick={() => setSelectedStudentIds(students.map((s) => s.id))}
                className="text-xs text-teal-600 hover:text-teal-700"
              >
                Select all
              </button>
            </div>

            {students.length === 0 ? (
              <div className="text-sm text-slate-500">No students found.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] text-slate-500 border-b border-slate-100">
                      <th className="py-1 pr-2">Assign</th>
                      <th className="py-1 pr-2">Name</th>
                      <th className="py-1 pr-2">USN</th>
                      <th className="py-1 pr-2">Dept</th>
                      <th className="py-1 pr-2">Sem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="py-1 pr-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={() => toggleStudent(s.id)}
                          />
                        </td>
                        <td className="py-1 pr-2 text-slate-800">
                          {s.full_name}
                        </td>
                        <td className="py-1 pr-2 text-slate-600">
                          {s.usn || "-"}
                        </td>
                        <td className="py-1 pr-2 text-slate-600">
                          {s.department || "-"}
                        </td>
                        <td className="py-1 pr-2 text-slate-600">
                          {s.semester ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="inline-flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
