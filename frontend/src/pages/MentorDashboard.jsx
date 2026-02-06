

// src/pages/MentorDashboard.jsx

import React, { useEffect, useState, useCallback } from "react";
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
import { getRecentActivity } from "../services/activity";
import { getSubjects } from "../services/master";
import { getNotifications, markNotificationAsRead as apiMarkRead, clearAllNotifications as apiClearAll } from "../services/notifications";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  Users,
  UserCheck,
  FileText,
  Bell,
  TrendingUp,
  Download,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  RefreshCw,
  Eye,
  Upload,
  Trash2,
  Edit,
  Plus,
  X,
  ChevronRight,
  UserPlus,
  Send,
  FileUp,
  Shield,
  Database,
  Cpu,
  Award,
  Target,
  TrendingDown,
  Activity,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  ClipboardList,
  Percent,
} from "lucide-react";
import { getMentorMenteesPerformance } from "../services/mentorStats";
import StudentPortfolio from "./StudentPortfolio";

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMentorStats();
        setStats(data);
        try {
            const notifs = await getNotifications();
            setNotifications(notifs || []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
      } catch (e) {
        console.error("Failed to load mentor stats", e);
      } finally {
        setLoadingStats(false);
      }
    }
    load();
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      setLoadingActivity(true);
      const data = await getRecentActivity();
      setRecentActivity(data || []);
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      stats: stats,
      timestamp: Date.now()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `mentor-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleSendAnnouncement = () => {
    const message = prompt("Enter announcement for all your mentees:");
    if (message) {
      alert(`Announcement sent to all mentees: "${message}"\n\nNote: This requires backend integration to actually send.`);
    }
  };

  const handleQuickAttendance = () => {
    alert("Quick Attendance feature would open a modal to mark attendance for all students at once.\n\nThis is a frontend demo.");
  };

  const handleGenerateReport = () => {
    const reportWindow = window.open();
    reportWindow.document.write(`
      <html>
        <head><title>Mentor Report - ${new Date().toLocaleDateString()}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Mentor Dashboard Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Mentor: ${user?.full_name || "Unknown"}</p>
          <hr>
          <h2>Statistics</h2>
          <p>Assigned Students: ${stats?.assigned_students || 0}</p>
          <p>Feedback Given: ${stats?.total_feedback || 0}</p>
          <hr>
          <p>This is a frontend-generated report.</p>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const markNotificationAsRead = async (id) => {
    try {
        await apiMarkRead(id);
        setNotifications(prev => prev.map(notif => 
          notif.id === id || notif.mongo_id === id ? { ...notif, read: true } : notif
        ));
    } catch (err) {
        console.error("Failed to mark read", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
        await apiClearAll();
        setNotifications([]);
    } catch (err) {
        console.error("Failed to clear notifications", err);
    }
  };

  const filteredNotifications = notifications.filter(notif => 
    notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notif.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-gray-900'}`}>
      {/* Enhanced Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-slate-200'} border-b shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600'}`}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  Mentor Dashboard
                </h1>
                <p className="text-xs opacity-75">
                  Guide, monitor, and support your mentees
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
                <input
                  type="text"
                  placeholder="Search students, circulars, feedback..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border bg-white/5 border-gray-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 rounded-full hover:bg-gray-700 transition"
                  onClick={() => document.getElementById('mentor-notifications-panel').classList.toggle('hidden')}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                <div id="mentor-notifications-panel" className="hidden absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-sm text-teal-400 hover:text-teal-300"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-3 border-b border-gray-700 last:border-b-0 cursor-pointer hover:bg-gray-700 transition ${!notif.read ? 'bg-gray-700/50' : ''}`}
                          onClick={() => markNotificationAsRead(notif.id || notif.mongo_id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded-full mt-0.5 ${
                              notif.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                              notif.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {notif.type === 'warning' ? <AlertCircle className="w-3 h-3" /> :
                               notif.type === 'success' ? <CheckCircle className="w-3 h-3" /> :
                               <Bell className="w-3 h-3" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">
                                {notif.title}
                              </h4>
                              <p className="text-xs opacity-75 mt-0.5">
                                {notif.message}
                              </p>
                              <div className="text-[10px] opacity-60 mt-1">
                                {formatTimeAgo(notif.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-sm opacity-75">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-700 transition"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? (
                  <span className="text-lg">🌙</span>
                ) : (
                  <span className="text-lg">☀️</span>
                )}
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden lg:block">
                  <div className="font-semibold text-sm">
                    {user?.full_name || "Mentor"}
                  </div>
                  <div className="text-[11px] opacity-75">
                    {user?.role?.toUpperCase() || "MENTOR"}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'M'}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition shadow-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Assigned Students"
            value={stats?.assigned_students ?? (loadingStats ? "…" : 0)}
            icon={<Users className="w-5 h-5" />}
            trend={{ value: "+2", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Feedback Given"
            value={stats?.total_feedback ?? (loadingStats ? "…" : 0)}
            icon={<MessageSquare className="w-5 h-5" />}
            trend={{ value: "+5", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Avg Attendance"
            value={stats?.avg_attendance ? `${stats.avg_attendance}%` : (loadingStats ? "…" : "0%")}
            icon={<Percent className="w-5 h-5" />}
            trend={{ value: "+3.2%", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Avg Marks"
            value={stats?.avg_marks ? `${stats.avg_marks}%` : (loadingStats ? "…" : "0%")}
            icon={<Award className="w-5 h-5" />}
            trend={{ value: "+2.5%", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
        </div>

        {/* Quick Actions */}
        <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">
              Quick Actions
            </h2>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleExportData}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg hover:bg-gray-700 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Quick Attendance"
              description="Mark attendance for all"
              icon={<ClipboardList className="w-5 h-5" />}
              color="teal"
              darkMode={darkMode}
              onClick={handleQuickAttendance}
            />
            <QuickActionCard
              title="Send Announcement"
              description="Message all mentees"
              icon={<Send className="w-5 h-5" />}
              color="blue"
              darkMode={darkMode}
              onClick={handleSendAnnouncement}
            />
            <QuickActionCard
              title="Generate Report"
              description="Monthly performance"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              color="purple"
              darkMode={darkMode}
              onClick={handleGenerateReport}
            />
            <QuickActionCard
              title="Risk Analysis"
              description="Identify at-risk students"
              icon={<AlertCircle className="w-5 h-5" />}
              color="amber"
              darkMode={darkMode}
              onClick={() => alert("Risk Analysis feature would show students needing attention.\n\nThis is a frontend demo.")}
            />
          </div>
        </div>

        {/* Tabs Section */}
        <div className="space-y-6">
          {/* Enhanced Tabs */}
          <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg overflow-hidden`}>
            <div className="px-6 pt-6">
              <nav className="flex flex-wrap gap-2">
                <EnhancedTabButton
                  active={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  icon={<TrendingUp className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Overview
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "students"}
                  onClick={() => setActiveTab("students")}
                  icon={<Users className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  My Students
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "attendance"}
                  onClick={() => setActiveTab("attendance")}
                  icon={<ClipboardList className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Attendance
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "marks"}
                  onClick={() => setActiveTab("marks")}
                  icon={<Award className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Marks
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "circulars"}
                  onClick={() => setActiveTab("circulars")}
                  icon={<Bell className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Circulars
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "performance"}
                  onClick={() => setActiveTab("performance")}
                  icon={<BarChart3 className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Performance
                </EnhancedTabButton>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && <MentorOverview darkMode={darkMode} stats={stats} />}
              {activeTab === "students" && <MentorStudents darkMode={darkMode} />}
              {activeTab === "attendance" && <MentorAttendance darkMode={darkMode} />}
              {activeTab === "marks" && <MentorMarks darkMode={darkMode} />}
              {activeTab === "circulars" && <MentorCirculars darkMode={darkMode} />}
              {activeTab === "performance" && <MentorPerformance darkMode={darkMode} />}
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Recent Activity
              </h3>
              <button className="text-sm text-teal-400 hover:text-teal-300">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {loadingActivity ? (
                <div className="text-center py-4 opacity-50 text-sm">Loading activity...</div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4 opacity-50 text-sm">No recent activity</div>
              ) : (
                recentActivity.map((item, idx) => (
                  <ActivityItem
                    key={idx}
                    title={item.title}
                    time={new Date(item.time).toLocaleString(undefined, {
                       month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    student={item.user || "System"}
                    type={item.type || 'info'}
                    darkMode={darkMode}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm opacity-75">
              © 2024 Mentor Management System • Mentor Portal
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Mentor Guide
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Support
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Help Center
              </button>
            </div>
          </div>
          <div className="mt-4 text-center text-xs opacity-50">
            <p>All mentor features are functional without backend changes</p>
            <p>Mock data will be replaced by actual data when backend is connected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MentorOverview({ darkMode, stats }) {
  const [timeFilter, setTimeFilter] = useState('month');
  
  const performanceData = [
    { subject: 'Math', attendance: 85, marks: 78 },
    { subject: 'Physics', attendance: 92, marks: 82 },
    { subject: 'Chemistry', attendance: 88, marks: 75 },
    { subject: 'CS', attendance: 95, marks: 88 },
    { subject: 'English', attendance: 90, marks: 80 },
  ];

  const riskDistribution = [
    { name: 'High Risk', value: 2, color: '#ef4444' },
    { name: 'Medium Risk', value: 3, color: '#f59e0b' },
    { name: 'Low Risk', value: 10, color: '#10b981' },
  ];

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    console.log(`Time filter changed to: ${filter}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-teal-50 to-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-teal-100'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Welcome back, Mentor! 👨‍🏫</h2>
            <p className="opacity-75">
              Monitor your mentees' progress and provide guidance. All systems are operational.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} text-sm font-medium`}>
              🟢 All Students Active
            </div>
            <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} text-sm font-medium`}>
              📚 5 Subjects
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">
              Subject-wise Performance
            </h3>
            <div className="flex items-center space-x-2">
              {['week', 'month', 'semester'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleTimeFilterChange(filter)}
                  className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                    timeFilter === filter
                      ? 'bg-teal-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                <XAxis 
                  dataKey="subject" 
                  stroke={darkMode ? '#9ca3af' : '#64748b'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={darkMode ? '#9ca3af' : '#64748b'}
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  contentStyle={darkMode ? { 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  } : {}}
                />
                <Bar 
                  dataKey="attendance" 
                  name="Attendance %"
                  fill="#0d9488"
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

        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <h3 className="font-semibold mb-5">
            Student Risk Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} students`, 'Count']}
                  contentStyle={darkMode ? { 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  } : {}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            {riskDistribution.map((risk) => (
              <div key={risk.name} className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: risk.color }} />
                <span className="text-sm">{risk.name}</span>
                <span className="text-sm font-semibold">{risk.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
        <h3 className="font-semibold mb-5">
          Quick Insights & Actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard
            title="Attendance Pending"
            value="3 students"
            icon={<ClipboardList className="w-4 h-4" />}
            color="amber"
            action="Mark Now"
            onClick={() => alert("Mark attendance for pending students")}
            darkMode={darkMode}
          />
          <InsightCard
            title="Feedback Due"
            value="5 students"
            icon={<MessageSquare className="w-4 h-4" />}
            color="blue"
            action="Give Feedback"
            onClick={() => alert("Provide feedback to students")}
            darkMode={darkMode}
          />
          <InsightCard
            title="High Risk"
            value="2 students"
            icon={<AlertCircle className="w-4 h-4" />}
            color="red"
            action="Review"
            onClick={() => alert("Review high-risk students")}
            darkMode={darkMode}
          />
          <InsightCard
            title="Top Performers"
            value="4 students"
            icon={<Award className="w-4 h-4" />}
            color="emerald"
            action="View"
            onClick={() => alert("View top performing students")}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, icon, color, action, onClick, darkMode }) {
  const colorClasses = {
    amber: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
    blue: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
    red: darkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200',
    emerald: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">
          {title}
        </h4>
        <div className={`p-1.5 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-3">
        {value}
      </div>
      <button
        onClick={onClick}
        className={`w-full text-sm font-medium py-1.5 rounded-lg transition ${
          color === 'amber' ? (darkMode ? 'bg-amber-500/30 hover:bg-amber-500/40' : 'bg-amber-100 hover:bg-amber-200') :
          color === 'blue' ? (darkMode ? 'bg-blue-500/30 hover:bg-blue-500/40' : 'bg-blue-100 hover:bg-blue-200') :
          color === 'red' ? (darkMode ? 'bg-red-500/30 hover:bg-red-500/40' : 'bg-red-100 hover:bg-red-200') :
          (darkMode ? 'bg-emerald-500/30 hover:bg-emerald-500/40' : 'bg-emerald-100 hover:bg-emerald-200')
        }`}
      >
        {action}
      </button>
    </div>
  );
}

function EnhancedTabButton({ active, onClick, icon, children, darkMode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? `${darkMode ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600'}`
          : `${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function QuickActionCard({ title, description, icon, color, darkMode, onClick }) {
  const colorClasses = {
    teal: darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-50 text-teal-600',
    blue: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
    purple: darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
    amber: darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h4 className="font-semibold text-sm mb-1">
        {title}
      </h4>
      <p className="text-xs opacity-75">
        {description}
      </p>
    </button>
  );
}

function ActivityItem({ title, time, student, type, darkMode }) {
  const typeIcons = {
    feedback: '💬',
    attendance: '📝',
    marks: '📊',
    circular: '📢',
    feedback: '💬',
    attendance: '📝',
    marks: '📊',
    circular: '📢',
    user: '👤',
    alert: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-50'} transition`}>
      <div className="flex items-center space-x-3">
        <div className="text-xl">
          {typeIcons[type]}
        </div>
        <div>
          <h5 className="font-medium text-sm">
            {title}
          </h5>
          <p className="text-xs opacity-75">
            {student} • {time}
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 opacity-50" />
    </div>
  );
}

function StatCard({ label, value, icon, trend, darkMode, loading }) {
  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm transition-transform duration-200 hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
          {React.cloneElement(icon, { 
            className: `${darkMode ? 'text-gray-300' : 'text-slate-600'}`
          })}
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive 
              ? `${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`
              : `${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'}`
          }`}>
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">
        {loading ? (
          <div className={`h-8 w-20 rounded ${darkMode ? 'bg-gray-700' : 'bg-slate-200'} animate-pulse`} />
        ) : (
          value
        )}
      </div>
      <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
        {label}
      </div>
    </div>
  );
}

function MentorPerformance({ darkMode }) {
  const { user } = useAuth();
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const highCount = mentees.filter((m) => m.risk_level === "high").length;
  const medCount = mentees.filter((m) => m.risk_level === "medium").length;
  const lowCount = mentees.filter((m) => m.risk_level === "low").length;

  const filteredMentees = mentees.filter(mentee => {
    if (filter === "high" && mentee.risk_level !== "high") return false;
    if (filter === "medium" && mentee.risk_level !== "medium") return false;
    if (filter === "low" && mentee.risk_level !== "low") return false;
    
    return (
      mentee.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.usn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentee.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleExportPerformance = () => {
    const performanceData = {
      mentees: filteredMentees,
      summary: {
        highRisk: highCount,
        mediumRisk: medCount,
        lowRisk: lowCount,
        total: mentees.length
      },
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(performanceData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  return (
    <div className="space-y-6">
      {/* Header card + alert summary */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Mentee Performance Overview
            </h3>
            <p className="text-sm opacity-75 mt-1">
              Compare attendance and marks of all your mentees. Students in the red zone may need extra support.
            </p>
          </div>
          <button
            onClick={handleExportPerformance}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>

        {!loading && mentees.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setFilter("all")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                filter === "all"
                  ? darkMode ? 'bg-gray-700 text-white' : 'bg-slate-200 text-slate-800'
                  : darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-500" />
              All ({mentees.length})
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                filter === "high"
                  ? 'bg-red-500/20 text-red-400'
                  : darkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              High Risk ({highCount})
            </button>
            <button
              onClick={() => setFilter("medium")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                filter === "medium"
                  ? 'bg-amber-500/20 text-amber-400'
                  : darkMode ? 'hover:bg-amber-500/10' : 'hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Medium ({medCount})
            </button>
            <button
              onClick={() => setFilter("low")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition ${
                filter === "low"
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : darkMode ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Low Risk ({lowCount})
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className="mt-4 text-sm opacity-75">Loading performance data...</p>
        </div>
      ) : filteredMentees.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p className="text-sm opacity-75">
            {searchQuery || filter !== "all" 
              ? "No mentees match your search criteria"
              : "No mentees assigned yet, or no data available."}
          </p>
          {(searchQuery || filter !== "all") && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
              }}
              className="text-sm text-teal-400 hover:text-teal-300 mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
                  <input
                    type="text"
                    placeholder="Search mentees by name, USN, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
                  />
                </div>
              </div>
              <div className="text-sm opacity-75">
                Showing {filteredMentees.length} of {mentees.length} mentees
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <h4 className="text-sm font-semibold mb-1">
              Attendance vs Marks Comparison
            </h4>
            <p className="text-xs opacity-75 mb-4">
              Each student shows two bars: attendance% and average marks%.
            </p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                  <XAxis
                    dataKey="name"
                    angle={-25}
                    textAnchor="end"
                    height={60}
                    stroke={darkMode ? '#9ca3af' : '#64748b'}
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tickFormatter={(v) => `${v}%`}
                    stroke={darkMode ? '#9ca3af' : '#64748b'}
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(v) => `${v}%`}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    } : {}}
                  />
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
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <h4 className="text-lg font-bold mb-4">
              Mentee Details ({filteredMentees.length})
            </h4>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="py-3 px-3">Name</th>
                    <th className="py-3 px-3">USN</th>
                    <th className="py-3 px-3">Dept</th>
                    <th className="py-3 px-3">Sem</th>
                    <th className="py-3 px-3">Attendance %</th>
                    <th className="py-3 px-3">Marks %</th>
                    <th className="py-3 px-3">Risk</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMentees.map((m) => (
                    <tr
                      key={m.student_id}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'} transition`}
                    >
                      <td className="py-2.5 px-3 font-medium">
                        {m.full_name || "Unnamed"}
                      </td>
                      <td className="py-2.5 px-3 opacity-75">
                        {m.usn || "-"}
                      </td>
                      <td className="py-2.5 px-3 opacity-75">
                        {m.department || "-"}
                      </td>
                      <td className="py-2.5 px-3 opacity-75">
                        {m.semester ?? "-"}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {m.attendance_percentage?.toFixed
                          ? m.attendance_percentage.toFixed(1)
                          : m.attendance_percentage}
                        %
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {m.average_marks_percentage?.toFixed
                          ? m.average_marks_percentage.toFixed(1)
                          : m.average_marks_percentage}
                        %
                      </td>
                      <td className="py-2.5 px-3">
                        <RiskBadge level={m.risk_level} darkMode={darkMode} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => alert(`View detailed performance for ${m.full_name || "this student"}`)}
                            className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alert(`Send message to ${m.full_name || "this student"}`)}
                            className={`p-1.5 rounded ${darkMode ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                            title="Send Message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
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

function RiskBadge({ level, darkMode }) {
  if (level === "high") {
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'
      }`}>
        <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
        HIGH RISK
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700'
      }`}>
        <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
        MEDIUM
      </span>
    );
  }
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
      darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
    }`}>
      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
      LOW RISK
    </span>
  );
}

function MentorAttendance({ darkMode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [manualStudentId, setManualStudentId] = useState("");
  const [manualSubject, setManualSubject] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [manualStatus, setManualStatus] = useState("present");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Fetch subjects when student changes
  useEffect(() => {
    async function loadSubjects() {
        if (!manualStudentId) {
            setAvailableSubjects([]);
            return;
        }
        const student = students.find(s => s.id === manualStudentId);
        if (student && student.branch && student.department) {
            try {
                // Now expects (branch, department)
                const subs = await getSubjects(student.branch, student.department);
                setAvailableSubjects(subs || []);
            } catch (e) {
                console.error("Failed to load subjects", e);
                setAvailableSubjects([]);
            }
        } else {
            setAvailableSubjects([]);
        }
    }
    loadSubjects();
  }, [manualStudentId, students]);

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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
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
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      alert("Attendance uploaded successfully!");
    } catch (e) {
      console.error("Failed to upload attendance", e);
      const detail = e?.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : "Failed to upload attendance. Check file format and try again."
      );
      alert("Error: " + (detail || "Failed to upload attendance"));
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
      alert("Attendance record added successfully!");
    } catch (e) {
      console.error("Failed to create manual attendance", e);
      const detail = e?.response?.data?.detail;
      setManualError(
        typeof detail === "string"
          ? detail
          : "Failed to add attendance. Please try again."
      );
      alert("Error: " + (detail || "Failed to add attendance"));
    } finally {
      setManualSaving(false);
    }
  };

  const handleQuickMarkAll = () => {
    if (students.length === 0) {
      alert("No students available");
      return;
    }
    
    const subject = prompt("Enter subject for all students:");
    if (!subject) return;
    
    const status = prompt("Enter status for all students (present/absent/leave):", "present");
    if (!["present", "absent", "leave"].includes(status)) {
      alert("Invalid status. Use 'present', 'absent', or 'leave'");
      return;
    }
    
    if (confirm(`Mark ${students.length} students as ${status} for ${subject}?`)) {
      alert(`Marked ${students.length} students as ${status} for ${subject}.\n\nNote: This is a frontend demo - backend integration required for actual saving.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload block */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">
              Upload Attendance (Batch)
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
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
          <button
            onClick={handleQuickMarkAll}
            className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition text-sm font-medium"
          >
            Quick Mark All
          </button>
        </div>

        {uploadError && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {uploadError}
          </div>
        )}
        {uploadMessage && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
            {uploadMessage}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className={`block w-full text-sm rounded-lg px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            />
            {file && (
              <p className="text-xs mt-2 opacity-75">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                uploading || !file
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-md'
              } ${darkMode ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700'} text-white`}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </span>
              ) : (
                "Upload attendance"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Manual attendance block */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div>
          <h3 className="text-lg font-bold">
            Add Single Attendance Record
          </h3>
          <p className={`text-sm opacity-75 mt-1`}>
            Quickly mark attendance for an individual student.
          </p>
        </div>

        {studentsError && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {studentsError}
          </div>
        )}
        {manualError && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {manualError}
          </div>
        )}
        {manualMessage && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
            {manualMessage}
          </div>
        )}

        <form
          onSubmit={handleManualSubmit}
          className="grid gap-4 mt-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium mb-1">
                Student *
              </label>
              <select
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                disabled={loadingStudents}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
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
                <label className="block text-xs font-medium mb-1">
                  Subject *
                </label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  disabled={!manualStudentId || availableSubjects.length === 0}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">
                    {availableSubjects.length > 0 ? "-- Select Subject --" : (manualStudentId ? "No subjects found" : "-- Select Student First --")}
                  </option>
                  {availableSubjects.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Date
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium mb-1">
                Status
              </label>
              <div className="flex gap-2">
                {["present", "absent", "leave"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setManualStatus(status)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      manualStatus === status
                        ? darkMode ? 'bg-teal-500 text-white' : 'bg-teal-500 text-white'
                        : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={manualSaving || !manualStudentId || !manualSubject.trim()}
                className={`w-full px-6 py-2 rounded-lg font-medium text-sm transition ${
                  manualSaving || !manualStudentId || !manualSubject.trim()
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:shadow-md'
                } ${darkMode ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700'} text-white`}
              >
                {manualSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  "Add attendance"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Recent Attendance Summary */}
      {students.length > 0 && (
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 className="text-lg font-bold mb-4">
            Recent Attendance Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">85%</div>
              <div className="text-sm opacity-75">Average Attendance</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-sm opacity-75">Present Today</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">3</div>
              <div className="text-sm opacity-75">Absent Today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MentorCirculars({ darkMode }) {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTarget, setFilterTarget] = useState("all");

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

  const filteredCirculars = circulars.filter(circular => {
    if (filterTarget !== "all" && circular.target_audience !== filterTarget && circular.target_audience !== "all") {
      return false;
    }
    
    return (
      circular.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      circular.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMarkAsRead = (id) => {
    alert(`Circular marked as read (ID: ${id})\n\nThis is a frontend-only action.`);
  };

  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold">
            Circulars ({filteredCirculars.length})
          </h3>
          <p className={`text-sm opacity-75 mt-1`}>
            Important announcements and updates from administration
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
          />
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
          >
            <option value="all">All Audience</option>
            <option value="all">All Users</option>
            <option value="mentors">Mentors Only</option>
            <option value="students">Students Only</option>
          </select>
        </div>
      </div>

      {error && (
        <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className="mt-2 text-sm opacity-75">Loading circulars...</p>
        </div>
      ) : filteredCirculars.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p className="text-sm opacity-75">
            {searchQuery || filterTarget !== "all" 
              ? "No circulars match your search criteria"
              : "No circulars available for you yet."}
          </p>
          {(searchQuery || filterTarget !== "all") && (
            <button 
              onClick={() => {
                setSearchQuery("");
                setFilterTarget("all");
              }}
              className="text-sm text-teal-400 hover:text-teal-300 mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCirculars.map((c) => (
            <article
              key={c.id}
              className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      c.target_audience === 'all' ? (darkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-700') :
                      c.target_audience === 'students' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                      (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                    }`}>
                      {c.target_audience}
                    </span>
                    <span className="text-[11px] opacity-60">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleMarkAsRead(c.id)}
                  className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-slate-200'}`}
                  title="Mark as read"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm opacity-75 whitespace-pre-wrap mb-3">
                {c.content}
              </p>

              {c.file_url && (
                <div className="flex items-center justify-between">
                  <a
                    href={`${API_BASE_URL}${c.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-medium text-teal-400 hover:text-teal-300"
                  >
                    📎 Download attachment
                  </a>
                  <button
                    onClick={() => alert(`Share circular: ${c.title}`)}
                    className="text-xs opacity-75 hover:opacity-100"
                  >
                    Share
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MentorMarks({ darkMode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("");
  const [marksType, setMarksType] = useState("IA1");
  const [marksObtained, setMarksObtained] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [manualMessage, setManualMessage] = useState("");
  const [manualError, setManualError] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Auto-fill semester and fetch subjects when student selected
  useEffect(() => {
     if (studentId) {
        const student = students.find(s => s.id === studentId);
        if (student && student.semester) {
            setSemester(student.semester);
        }
     }
  }, [studentId, students]);

  // Fetch subjects when semester or student (dept) changes
  useEffect(() => {
    async function loadSubjects() {
        if (!studentId || !semester) {
            setAvailableSubjects([]);
            return;
        }
        const student = students.find(s => s.id === studentId);
        if (student && student.branch && student.department) {
            try {
                // Now expects (branch, department)
                const subs = await getSubjects(student.branch, student.department);
                setAvailableSubjects(subs || []);
            } catch (e) {
                console.error("Failed to load subs", e);
                setAvailableSubjects([]);
            }
        }
    }
    loadSubjects();
  }, [studentId, semester, students]);

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
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
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
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      alert("Marks uploaded successfully!");
    } catch (e) {
      console.error("Failed to upload marks", e);
      const detail = e?.response?.data?.detail;
      setUploadError(
        typeof detail === "string"
          ? detail
          : "Failed to upload marks. Check file format and try again."
      );
      alert("Error: " + (detail || "Failed to upload marks"));
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
      alert("Marks record added successfully!");
    } catch (e) {
      console.error("Failed to create manual marks", e);
      const detail = e?.response?.data?.detail;
      setManualError(
        typeof detail === "string"
          ? detail
          : "Failed to add marks. Please try again."
      );
      alert("Error: " + (detail || "Failed to add marks"));
    } finally {
      setSaving(false);
    }
  };

  const handleCalculatePercentage = () => {
    if (marksObtained && maxMarks) {
      const percentage = (parseFloat(marksObtained) / parseFloat(maxMarks)) * 100;
      alert(`Percentage: ${percentage.toFixed(2)}%\nGrade: ${percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : percentage >= 50 ? 'D' : 'F'}`);
    } else {
      alert("Please enter both marks obtained and max marks");
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload block */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold">
              Upload Marks (Batch)
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
              Upload a CSV/Excel file with columns:{" "}
              <span className="font-mono">
                student_usn, subject, semester, marks_type, marks_obtained,
                max_marks
              </span>
              . Example marks_type: IA1, IA2, IA3, Assignment, VTU.
            </p>
          </div>
          <button
            onClick={() => alert("Download marks template")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:from-teal-600 hover:to-blue-700 transition text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Template
          </button>
        </div>

        {uploadError && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {uploadError}
          </div>
        )}
        {uploadMessage && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
            {uploadMessage}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileChange}
              className={`block w-full text-sm rounded-lg px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            />
            {file && (
              <p className="text-xs mt-2 opacity-75">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !file}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                uploading || !file
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-md'
              } ${darkMode ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700'} text-white`}
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </span>
              ) : (
                "Upload marks"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Manual marks block */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div>
          <h3 className="text-lg font-bold">
            Add Single Marks Record
          </h3>
          <p className={`text-sm opacity-75 mt-1`}>
            Add marks for an individual student and subject.
          </p>
        </div>

        {studentsError && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {studentsError}
          </div>
        )}
        {manualError && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {manualError}
          </div>
        )}
        {manualMessage && (
          <div className={`text-sm rounded-xl px-3 py-2 mt-4 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
            {manualMessage}
          </div>
        )}

        <form
          onSubmit={handleManualSubmit}
          className="grid gap-4 mt-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium mb-1">
                Student *
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loadingStudents}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
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
              <label className="block text-xs font-medium mb-1">
                Subject *
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!studentId || !semester || availableSubjects.length === 0}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                  <option value="">
                    {availableSubjects.length > 0 ? "-- Select Subject --" : (studentId ? "No subjects found" : "-- Select Student First --")}
                  </option>
                  {availableSubjects.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Semester *
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Marks Type
              </label>
              <select
                value={marksType}
                onChange={(e) => setMarksType(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
              >
                <option value="IA1">IA1</option>
                <option value="IA2">IA2</option>
                <option value="IA3">IA3</option>
                <option value="Assignment">Assignment</option>
                <option value="VTU">VTU</option>
                <option value="Lab">Lab</option>
                <option value="Project">Project</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Marks Obtained *
              </label>
              <input
                type="number"
                value={marksObtained}
                onChange={(e) => setMarksObtained(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Obtained"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                placeholder="Max"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleCalculatePercentage}
                disabled={!marksObtained || !maxMarks}
                className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition ${
                  !marksObtained || !maxMarks
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-md'
                } ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                Calculate %
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !studentId || !subject.trim() || !semester || !marksObtained || !maxMarks}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                saving || !studentId || !subject.trim() || !semester || !marksObtained || !maxMarks
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-md'
              } ${darkMode ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700'} text-white`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                "Add marks record"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Marks Summary */}
      {students.length > 0 && (
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <h3 className="text-lg font-bold mb-4">
            Marks Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">78.5%</div>
              <div className="text-sm opacity-75">Average Marks</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">92%</div>
              <div className="text-sm opacity-75">Highest Score</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">12</div>
              <div className="text-sm opacity-75">IA1 Completed</div>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
              <div className="text-2xl font-bold mb-1">3</div>
              <div className="text-sm opacity-75">Need Improvement</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MentorStudents({ darkMode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [newFeedback, setNewFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSemester, setFilterSemester] = useState("all");

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
      alert("Feedback submitted successfully!");
    } catch (e) {
      console.error("Failed to create feedback", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to submit feedback. Please try again."
      );
      alert("Error: " + (detail || "Failed to submit feedback"));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSendMessage = () => {
    if (!selectedStudent) return;
    const message = prompt(`Send message to ${selectedStudent.full_name}:`);
    if (message) {
      alert(`Message sent to ${selectedStudent.full_name}: "${message}"\n\nNote: This requires backend integration.`);
    }
  };

  const handleViewPerformance = () => {
    if (!selectedStudent) return;
    alert(`Viewing performance analytics for ${selectedStudent.full_name}\n\nThis would open detailed performance charts.`);
  };

  const filteredStudents = students.filter(student => {
    if (filterSemester !== "all" && student.semester != filterSemester) {
      return false;
    }
    
    return (
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.usn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Assigned Students ({filteredStudents.length})
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
              Manage your mentees, provide feedback, and monitor their progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            />
            <select
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            >
              <option value="all">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className={`text-sm rounded-xl px-3 py-2 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Students List */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm opacity-75">
              Showing {filteredStudents.length} of {students.length} students
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded hover:bg-gray-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingStudents ? (
            <div className="text-center py-12">
              <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
              <p className="mt-2 text-sm opacity-75">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                {searchQuery || filterSemester !== "all" 
                  ? "No students match your search criteria"
                  : "No students assigned to you yet."}
              </p>
              {(searchQuery || filterSemester !== "all") && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSemester("all");
                  }}
                  className="text-sm text-teal-400 hover:text-teal-300 mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map((s) => {
                const isSelected = selectedStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? darkMode ? 'bg-teal-500/20 border-teal-500/30' : 'bg-teal-50 border-teal-200'
                        : darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => openStudent(s)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {s.full_name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs opacity-75">{s.usn || "No USN"}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            darkMode ? 'bg-gray-700' : 'bg-slate-100'
                          }`}>
                            Sem {s.semester ?? "?"}
                          </span>
                          <span className="text-xs opacity-75">{s.department || "No Dept"}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-teal-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Student Details & Feedback */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          {selectedStudent ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-sm">
                    Feedback for {selectedStudent.full_name}
                  </h4>
                  <p className="text-xs opacity-75 mt-1">
                    USN: {selectedStudent.usn || "—"} • Dept:{" "}
                    {selectedStudent.department || "—"} • Sem:{" "}
                    {selectedStudent.semester ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendMessage}
                    className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                    title="Send Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleViewPerformance}
                    className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                    title="View Performance"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setFeedbackList([]);
                      setNewFeedback("");
                    }}
                    className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-8 border-b pb-6">
                 <h5 className="text-sm font-semibold mb-4">Student Portfolio & Analysis</h5>
                 <StudentPortfolio darkMode={darkMode} user={selectedStudent} role="mentor" />
              </div>

              <form onSubmit={submitFeedback} className="mb-6">
                <label className="block text-xs font-medium mb-1">
                  Add new feedback
                </label>
                <textarea
                  rows={4}
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  placeholder="Write your feedback here..."
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingFeedback || !newFeedback.trim()}
                    className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                      submittingFeedback || !newFeedback.trim()
                        ? 'opacity-75 cursor-not-allowed'
                        : 'hover:shadow-md'
                    } ${darkMode ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700'} text-white`}
                  >
                    {submittingFeedback ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Submitting...
                      </span>
                    ) : (
                      "Submit feedback"
                    )}
                  </button>
                </div>
              </form>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold">
                    Previous feedback ({feedbackList.length})
                  </h5>
                  <button
                    onClick={() => setFeedbackList([])}
                    className="text-xs opacity-75 hover:opacity-100"
                  >
                    Clear all
                  </button>
                </div>
                {loadingFeedback ? (
                  <div className="text-center py-8">
                    <div className={`inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
                    <p className="mt-2 text-sm opacity-75">Loading feedback...</p>
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto opacity-50 mb-3" />
                    <p className="text-sm opacity-75">No feedback recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {feedbackList.map((f) => (
                      <div
                        key={f.id}
                        className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="text-xs opacity-75 mb-2">
                          {f.created_at
                            ? new Date(f.created_at).toLocaleString()
                            : ""}
                        </div>
                        <div className="text-sm">
                          {f.feedback_text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                Select a student from the list to view details and provide feedback
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}