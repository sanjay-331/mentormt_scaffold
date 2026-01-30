// src/pages/Login.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-sky-500 to-blue-600 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Mentor–Mentee Portal
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-teal-600 hover:text-teal-500"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg hover:from-teal-600 hover:to-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-teal-600 hover:text-teal-500"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
