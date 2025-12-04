// src/services/users.js
import api from "./api";

/**
 * Get users, optionally filtered by role.
 * role can be: "admin" | "mentor" | "student" | undefined
 */
export async function getUsers(role) {
  const params = {};
  if (role) {
    params.role = role;
  }

  const res = await api.get("/api/users", { params });
  return res.data; // array of users
}

/**
 * Create a user.
 * For new users we:
 *  1) Call /api/auth/register (email, full_name, role, password)
 *  2) Then update extra fields via /api/users/{id}
 */
export async function createUser(form) {
  const {
    full_name,
    email,
    role,
    password,
    department,
    semester,
    usn,
    employee_id,
    phone,
  } = form;

  // Step 1: register the user (backend expects these fields)
  const registerRes = await api.post("/api/auth/register", {
    full_name,
    email,
    role,
    password,
  });

  const createdUser = registerRes.data.user;

  // Step 2: update optional fields (if any)
  const extra = {};
  if (department) extra.department = department;
  if (semester !== "" && semester !== null && semester !== undefined) {
    extra.semester = Number(semester);
  }
  if (usn) extra.usn = usn;
  if (employee_id) extra.employee_id = employee_id;
  if (phone) extra.phone = phone;

  if (Object.keys(extra).length > 0) {
    await api.put(`/api/users/${createdUser.id}`, extra);
  }

  // Fetch final user object
  const finalRes = await api.get(`/api/users/${createdUser.id}`);
  return finalRes.data;
}

/**
 * Update user (admin or self).
 * `updates` should NOT contain password/email/role (backend ignores them anyway).
 */
export async function updateUser(userId, updates) {
  const res = await api.put(`/api/users/${userId}`, updates);
  return res.data;
}

/**
 * Delete user (admin only).
 */
export async function deleteUser(userId) {
  await api.delete(`/api/users/${userId}`);
}
