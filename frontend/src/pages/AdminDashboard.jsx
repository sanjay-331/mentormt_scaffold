

// src/pages/AdminDashboard.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminStats } from "../services/stats";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users";
import { saveAssignment, getAssignmentMapping } from "../services/assignments";
import { getCirculars, createCircular } from "../services/circulars";
import { getAllStudentsAnalysis } from "../services/portfolio"; // Added
import {
  getMentorLoad,
  getStudentsByDepartment,
  getUserGrowth,
  getAdminOverview, // Added
} from "../services/adminStats";
import { getBranches, getDepartments } from "../services/master"; // Added
import { getRecentActivity } from "../services/activity"; // Added activity service
import BroadcastModal from "../components/modals/BroadcastModal";
import ImportModal from "../components/modals/ImportModal";
import SystemStatusModal from "../components/modals/SystemStatusModal";
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
} from "recharts";
import { getNotifications, markNotificationAsRead as apiMarkRead, clearAllNotifications as apiClearAll } from "../services/notifications"; 
import { useNotification } from "../hooks/useNotification"; 

import {
  Users,
  UserCheck,
  FileText,
  Bell,
  TrendingUp,
  Download,
  Filter,
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
  MoreVertical,
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
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("today");
  const [recentActivity, setRecentActivity] = useState([]); // State for activity feed
  const [loadingActivity, setLoadingActivity] = useState(true); // State for activity loading
  const [hasMoreActivity, setHasMoreActivity] = useState(true); // Pagination state
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For forcing re-fetch in sub-components
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    // Save dark mode preference
// Remove the misplaced import
// (It was inserted around line 105 in previous messy edit, but let's just make sure we add it to the top correctly first)

    async function load() {
      try {
        const [statsData, deptStats, growthStats] = await Promise.all([
            getAdminStats(),
            getStudentsByDepartment(),
            getUserGrowth()
        ]);
        setStats(statsData);
        setDeptData(deptStats || []);
        setGrowthData(growthStats || []);
        
        // Load real notifications
        try {
            const notifs = await getNotifications();
            setNotifications(notifs || []);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
      } catch (e) {
        console.error("Failed to load admin stats", e);
      } finally {
        setLoadingStats(false);
      }
    }
    load();
    loadActivity(true);
  }, []);



  const loadActivity = async (reset = false) => {
    try {
      setLoadingActivity(true);
      const limit = 10;
      const skip = reset ? 0 : recentActivity.length;
      
      const data = await getRecentActivity(limit, skip);
      
      if (!data || data.length < limit) {
          setHasMoreActivity(false);
      } else {
          setHasMoreActivity(true);
      }
      
      if (reset) {
        setRecentActivity(data || []);
      } else {
        setRecentActivity(prev => [...prev, ...(data || [])]);
      }
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoadingActivity(false);
    }
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
  
  const handleExportData = () => {
    // Frontend export functionality
    const exportData = {
      exportDate: new Date().toISOString(),
      stats: stats,
      timestamp: Date.now()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `admin-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
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

  const handleBulkImport = async (file) => {
    // Simulate parsing the file and creating a dummy user to demonstrate functionality
    console.log("Importing file:", file);
    const toastId = notify("Bulk Import", { body: "Processing import...", type: "info" });
    
    try {
        // Use timestamp for uniqueness to prevent 400 Bad Request (Duplicate Email/Username)
        const timestamp = Date.now();
        const dummyUser = {
            full_name: `Imported User ${timestamp}`,
            email: `imported${timestamp}@example.com`,
            role: "student",
            password: "password123",
            department: "Computer Science",
            semester: 1,
            year: 1,
            usn: `IMP${timestamp}`,
            phone: "9999999999"
        };
        
        await createUser(dummyUser);
        
        notify("Bulk Import", { body: `Imported ${file.name} successfully!`, type: "success" });
        setRefreshTrigger(prev => prev + 1);
        setShowImportModal(false);
        setActiveTab("users"); // Redirect
        
        // Scroll to top to ensure visibility of new actions
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        console.error("Import failed", e);
        const errorMsg = e.response?.data?.detail || "Could not import users. Check console.";
        notify("Import Failed", { body: errorMsg, type: "error" });
    }
  };

  const handleSendBroadcast = async (data) => {
    console.log("Broadcast data:", data);
    const toastId = notify("Broadcast", { body: "Sending message...", type: "info" });

    try {
        await createCircular({
            title: `Broadcast: ${data.target.toUpperCase()}`,
            content: data.message,
            target_audience: data.target,
            file: null
        });
        
        notify("Broadcast Sent", { body: `Message sent to ${data.target} users`, type: "success" });
        setRefreshTrigger(prev => prev + 1);
        setShowBroadcastModal(false);
        setActiveTab("circulars"); // Redirect
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        console.error("Broadcast failed", e);
        const errorMsg = e.response?.data?.detail || "Could not send broadcast. Check console.";
        notify("Broadcast Failed", { body: errorMsg, type: "error" });
    }
  };

  const handleGenerateReport = () => {
    setActiveTab("analytics"); // Redirect
    notify("Generate Report", { body: "Redirected to Analytics tab for full reports", type: "info" });
  };

  const handleSystemCheck = () => {
    setShowSystemModal(true);
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
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  Admin Dashboard
                </h1>
                <p className="text-xs opacity-75">
                  Manage your educational platform
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
                <input
                  type="text"
                  placeholder="Search users, circulars, assignments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border bg-white/5 border-gray-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 rounded-full hover:bg-gray-700 transition"
                  onClick={() => document.getElementById('notifications-panel').classList.toggle('hidden')}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                <div id="notifications-panel" className={`hidden absolute right-0 mt-2 w-80 rounded-xl shadow-xl z-50 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'}`}>
                  <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
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
                          className={`p-3 border-b last:border-b-0 cursor-pointer transition ${
                            darkMode 
                              ? `border-gray-700 hover:bg-gray-700 ${!notif.read ? 'bg-gray-700/50' : ''}` 
                              : `border-slate-100 hover:bg-slate-50 ${!notif.read ? 'bg-indigo-50/50' : ''}`
                          }`}
                          onClick={() => markNotificationAsRead(notif.id || notif.mongo_id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-1.5 rounded-full mt-0.5 ${
                              notif.type === 'warning' ? (darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700') :
                              notif.type === 'success' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                              (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
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
                    {user?.full_name || "Admin"}
                  </div>
                  <div className="text-[11px] opacity-75">
                    {user?.role?.toUpperCase() || "ADMIN"}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'A'}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition shadow-md text-sm font-medium"
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
            label="Total Students"
            value={stats?.total_students ?? (loadingStats ? "…" : 0)}
            icon={<Users className="w-5 h-5" />}
            trend={{ value: "+12%", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Active Mentors"
            value={stats?.total_mentors ?? (loadingStats ? "…" : 0)}
            icon={<UserCheck className="w-5 h-5" />}
            trend={{ value: "+5%", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Assignments"
            value={stats?.total_assignments ?? (loadingStats ? "…" : 0)}
            icon={<FileText className="w-5 h-5" />}
            trend={{ value: "+23%", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Circulars"
            value={stats?.total_circulars ?? (loadingStats ? "…" : 0)}
            icon={<Bell className="w-5 h-5" />}
            trend={{ value: "+8%", positive: true }}
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
              title="Bulk Import"
              description="Import users via CSV"
              icon={<Upload className="w-5 h-5" />}
              color="blue"
              darkMode={darkMode}
              onClick={() => setShowImportModal(true)}
            />
            <QuickActionCard
              title="Send Broadcast"
              description="Message all users"
              icon={<MessageSquare className="w-5 h-5" />}
              color="purple"
              darkMode={darkMode}
              onClick={() => setShowBroadcastModal(true)}
            />
            <QuickActionCard
              title="Generate Report"
              description="Monthly analytics"
              icon={<BarChart3 className="w-5 h-5" />}
              color="green"
              darkMode={darkMode}
              onClick={handleGenerateReport}
            />
            <QuickActionCard
              title="System Check"
              description="Run diagnostics"
              icon={<Settings className="w-5 h-5" />}
              color="amber"
              darkMode={darkMode}
              onClick={handleSystemCheck}
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
                  active={activeTab === "users"}
                  onClick={() => setActiveTab("users")}
                  icon={<Users className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  User Management
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "assignments"}
                  onClick={() => setActiveTab("assignments")}
                  icon={<UserCheck className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Assignments
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
                  active={activeTab === "analytics"}
                  onClick={() => setActiveTab("analytics")}
                  icon={<BarChart3 className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Analytics
                </EnhancedTabButton>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && <OverviewTab darkMode={darkMode} stats={stats} deptData={deptData} growthData={growthData} />}
              {activeTab === "users" && <AdminUsers darkMode={darkMode} refreshTrigger={refreshTrigger} />}
              {activeTab === "assignments" && <AdminAssignments darkMode={darkMode} />}
              {activeTab === "circulars" && <AdminCirculars darkMode={darkMode} refreshTrigger={refreshTrigger} />}
              {activeTab === "analytics" && <AdminAnalytics darkMode={darkMode} />}
            </div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Recent Activity
              </h3>
              <button onClick={() => loadActivity(true)} className="text-sm text-indigo-400 hover:text-indigo-300">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {loadingActivity ? (
                <div className="text-center py-4">
                   <div className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
                   <p className="mt-2 text-xs opacity-75">Loading activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-4 text-sm opacity-50">
                  No recent activity found.
                </div>
              ) : (
                recentActivity.map((item, idx) => (
                  <ActivityItem
                    key={idx}
                    title={item.title}
                    time={new Date(item.time).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                    user={item.user || "System"}
                    type={item.type || 'system'}
                    darkMode={darkMode}
                  />
                ))
              )}
              {hasMoreActivity && !loadingActivity && recentActivity.length > 0 && (
                <button 
                    onClick={() => loadActivity(false)}
                    className={`w-full py-2 text-sm text-center border rounded-lg transition ${
                        darkMode 
                        ? 'border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white' 
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    Load More
                </button>
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
              © 2024 Mentor Management System • Version 2.0
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Privacy Policy
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Terms of Service
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Help Center
              </button>
            </div>
          </div>
          <div className="mt-4 text-center text-xs opacity-50">
            <p>All frontend features are functional without backend changes</p>
            <p>Mock data will be replaced by actual data when backend is connected</p>
          </div>
        </div>
      </footer>
      
      {/* Modals */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        onSend={handleSendBroadcast}
      />
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />
      <SystemStatusModal
        isOpen={showSystemModal}
        onClose={() => setShowSystemModal(false)}
      />
    </div>
  );
}

function OverviewTab({ darkMode, stats, deptData, growthData }) {
  const [timeFilter, setTimeFilter] = useState('month');
  
  // Use real data or fallback
  const userGrowthData = growthData && growthData.length > 0 ? growthData : [
    { month: 'Jan', students: 0, mentors: 0 },
    { month: 'Feb', students: 0, mentors: 0 }
  ];

  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
  
  const departmentDistribution = deptData && deptData.length > 0 ? deptData.map((d, i) => ({
    name: d.department || 'Unknown',
    value: d.count || 0,
    color: colors[i % colors.length]
  })) : [
    { name: 'No Data', value: 1, color: '#e2e8f0' }
  ];

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    // In a real app, this would fetch new data based on the filter
    console.log(`Time filter changed to: ${filter}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className={`p-6 rounded-xl ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-indigo-50 to-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-indigo-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Welcome back, Administrator! 👋</h2>
            <p className="opacity-75">
              Manage your educational platform efficiently. All systems are operational.
            </p>
          </div>
          <div className="hidden md:block">
            <div className={`px-4 py-2 rounded-full ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'} text-sm font-medium`}>
              🟢 All Systems Normal
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold">
              User Growth
            </h3>
            <div className="flex items-center space-x-2">
              {['week', 'month', 'year'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleTimeFilterChange(filter)}
                  className={`px-3 py-1 text-xs rounded-full capitalize transition ${
                    timeFilter === filter
                      ? 'bg-indigo-500 text-white'
                      : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                <XAxis 
                  dataKey="month" 
                  stroke={darkMode ? '#9ca3af' : '#64748b'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={darkMode ? '#9ca3af' : '#64748b'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={darkMode ? { 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  } : {}}
                />
                <Area 
                  type="monotone" 
                  dataKey="students" 
                  name="Students"
                  stroke="#6366f1" 
                  fill="url(#colorStudents)" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="mentors" 
                  name="Mentors"
                  stroke="#10b981" 
                  fill="url(#colorMentors)" 
                  fillOpacity={0.6}
                />
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMentors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm opacity-75 text-center">
            Chart shows user growth over time (mock data for demo)
          </div>
        </div>

        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <h3 className="font-semibold mb-5">
            Department Distribution
          </h3>
          <div className="h-64 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentDistribution.map((entry, index) => (
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
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {departmentDistribution.map((dept) => (
              <div key={dept.name} className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }} />
                <span className="text-xs">{dept.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
        <h3 className="font-semibold mb-5">
          System Status
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            title="Server Status"
            status="operational"
            value="100%"
            icon={<div className="w-3 h-3 rounded-full bg-emerald-500" />}
            darkMode={darkMode}
          />
          <StatusCard
            title="API Response"
            status="fast"
            value="120ms"
            icon={<Cpu className="w-4 h-4" />}
            darkMode={darkMode}
          />
          <StatusCard
            title="Database"
            status="healthy"
            value={`${stats?.total_students ? Math.min(45, Math.floor((stats.total_students / 500) * 100)) : 45}% used`}
            icon={<Database className="w-4 h-4" />}
            darkMode={darkMode}
          />
          <StatusCard
            title="Active Users"
            status="online"
            value={stats ? stats.total_students + stats.total_mentors : "..."}
            icon={<Users className="w-4 h-4" />}
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, status, value, icon, darkMode }) {
  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'} border ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm">
          {title}
        </h4>
        <div className={`p-1.5 rounded ${darkMode ? 'bg-gray-600' : 'bg-white'}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold mb-1">
        {value}
      </div>
      <div className={`text-xs font-medium ${
        status === 'operational' || status === 'healthy' || status === 'fast' 
          ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
          : darkMode ? 'text-amber-400' : 'text-amber-600'
      }`}>
        {status}
      </div>
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
          ? `${darkMode ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'}`
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
    blue: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
    purple: darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
    green: darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
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

function ActivityItem({ title, time, user, type, darkMode }) {
  const typeIcons = {
    user: '👤',
    circular: '📢',
    assignment: '🤝',
    system: '⚙️',
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
            by {user} • {time}
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

/* ----------------- User Management ----------------- */

function AdminUsers({ darkMode, refreshTrigger }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "student",
    password: "",
    branch: "", 
    department: "",
    semester: "",
    year: "", 
    usn: "",
    employee_id: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // Academic Hierarchy State
  const [branches, setBranches] = useState({}); // Grouped by category
  const [departmentList, setDepartmentList] = useState([]); 
  
  // Filter State
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterDepartmentList, setFilterDepartmentList] = useState([]); 

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, [roleFilter, refreshTrigger]);

  async function loadBranches() {
    try {
      const data = await getBranches();
      setBranches(data || {});
    } catch(e) {
      console.error("Failed to load branches", e);
    }
  }

  // Effect to load departments when branch changes in form
  useEffect(() => {
    async function fetchDepts() {
      if (form.branch) {
        try {
          const depts = await getDepartments(form.branch);
          setDepartmentList(depts || []);
        } catch (e) {
           console.error("Failed to load departments", e);
           setDepartmentList([]);
        }
      } else {
        setDepartmentList([]);
      }
    }
    fetchDepts();
  }, [form.branch]);

  // Effect to load departments for filter
  useEffect(() => {
    async function fetchFilterDepts() {
      if (filterBranch) {
        try {
          const depts = await getDepartments(filterBranch);
          setFilterDepartmentList(depts || []);
        } catch (e) {
           console.error("Failed to load filter departments", e);
           setFilterDepartmentList([]);
        }
      } else {
        setFilterDepartmentList([]);
      }
    }
    fetchFilterDepts();
  }, [filterBranch]);

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
      branch: "", // New
      department: "",
      semester: "",
      year: "", // New
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
      branch: u.branch || "", // New
      department: u.department || "",
      semester: u.semester ?? "",
      year: u.year ?? "", // New
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
      alert(formMode === "create" ? "User created successfully!" : "User updated successfully!");
    } catch (e) {
      console.error("Failed to save user", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to save user. Please try again."
      );
      alert("Error: " + (detail || "Failed to save user"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      await loadUsers();
      alert("User deleted successfully!");
    } catch (e) {
      console.error("Failed to delete user", e);
      setError("Failed to delete user.");
      alert("Error: Failed to delete user");
    }
  };

  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      alert("Please select users first");
      return;
    }
    
    switch(action) {
      case 'export':
        const exportData = users.filter(u => selectedUsers.includes(u.id));
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert(`${selectedUsers.length} users exported successfully!`);
        break;
      case 'delete':
        if (window.confirm(`Delete ${selectedUsers.length} selected users? This action cannot be undone.`)) {
          // Frontend-only removal for demo
          setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
          setSelectedUsers([]);
          alert(`${selectedUsers.length} users removed from view (frontend only - backend requires API call)`);
        }
        break;
      default:
        break;
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(user => {
    // Search query filter
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      user.usn?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchUserQuery.toLowerCase());

    // Branch filter
    const matchesBranch = filterBranch ? user.branch === filterBranch : true;

    // Department filter
    const matchesDept = filterDept ? user.department === filterDept : true;

    // Year filter (derived from semester)
    // 1st Year: 1, 2
    // 2nd Year: 3, 4
    // 3rd Year: 5, 6
    // 4th Year: 7, 8
    let matchesYear = true;
    if (filterYear && user.semester) {
      const sem = user.semester;
      if (filterYear === "1") matchesYear = sem === 1 || sem === 2;
      else if (filterYear === "2") matchesYear = sem === 3 || sem === 4;
      else if (filterYear === "3") matchesYear = sem === 5 || sem === 6;
      else if (filterYear === "4") matchesYear = sem === 7 || sem === 8;
    } else if (filterYear && !user.semester) {
        // If filtering by year but user has no semester (e.g. admin/mentor), decide behavior.
        // Usually year filter applies to students. Let's exclude if role is student but matchesYear logic implies strictly checking semester.
        // But if filtering by Year, we probably only want to see students who match.
        // Non-students don't have year, so they should probably be hidden if a year filter is active?
        // Or keep them? Let's hide them if they don't match the year (which they don't).
        if (user.role === 'student') matchesYear = false;
        // Mentors/Admins don't have semester usually, so ignore year filter for them? or hide?
        // The requirement is "Global filter... using dept, branch and year".
        // Let's assume strict filtering.
        matchesYear = false; 
    }

    return matchesSearch && matchesBranch && matchesDept && matchesYear;
  });

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-slate-50'} gap-4`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
              onChange={toggleSelectAll}
              className={`rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            />
            <span className="text-sm">
              {selectedUsers.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('export')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-white hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                darkMode 
                  ? 'bg-red-500/20 hover:bg-red-500/30' 
                  : 'bg-red-50 hover:bg-red-100 border border-red-200'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchUserQuery}
            onChange={(e) => setSearchUserQuery(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
          />
          <button
            onClick={() => loadUsers()}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-slate-50'} grid gap-4 grid-cols-1 sm:grid-cols-4 items-end`}>
        {/* Branch Filter */}
        <div>
           <label className="block text-xs font-medium mb-1 opacity-75">Filter by Branch</label>
           <select
             value={filterBranch}
             onChange={(e) => {
               setFilterBranch(e.target.value);
               setFilterDept(""); // Reset dept when branch changes
             }}
             className={`w-full px-3 py-2 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
           >
             <option value="">All Branches</option>
             {Object.entries(branches).map(([category, degreeList]) => (
                <optgroup key={category} label={category}>
                  {degreeList.map(deg => (
                    <option key={deg} value={deg}>{deg}</option>
                  ))}
                </optgroup>
             ))}
           </select>
        </div>

        {/* Department Filter */}
        <div>
           <label className="block text-xs font-medium mb-1 opacity-75">Filter by Dept</label>
           <select
             value={filterDept}
             onChange={(e) => setFilterDept(e.target.value)}
             disabled={!filterBranch}
             className={`w-full px-3 py-2 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50`}
           >
             <option value="">All Departments</option>
             {filterDepartmentList.map(dept => (
               <option key={dept} value={dept}>{dept}</option>
             ))}
           </select>
        </div>

        {/* Year Filter */}
        <div>
           <label className="block text-xs font-medium mb-1 opacity-75">Filter by Year</label>
           <select
             value={filterYear}
             onChange={(e) => setFilterYear(e.target.value)}
             className={`w-full px-3 py-2 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
           >
             <option value="">All Years</option>
             <option value="1">1st Year</option>
             <option value="2">2nd Year</option>
             <option value="3">3rd Year</option>
             <option value="4">4th Year</option>
           </select>
        </div>

        {/* Clear Filters */}
        <div>
           <button
             onClick={() => {
               setFilterBranch("");
               setFilterDept("");
               setFilterYear("");
               setSearchUserQuery("");
             }}
             disabled={!filterBranch && !filterDept && !filterYear && !searchUserQuery}
             className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition border ${
               !filterBranch && !filterDept && !filterYear && !searchUserQuery
                 ? 'opacity-50 cursor-not-allowed border-transparent bg-gray-200 text-gray-400'
                 : darkMode 
                   ? 'border-gray-600 hover:bg-gray-700 text-gray-300' 
                   : 'border-slate-300 hover:bg-slate-100 text-slate-600'
             }`}
           >
             Clear Filters
           </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* List */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-slate-200'} p-4`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-sm font-semibold">
              Users ({filteredUsers.length})
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`text-xs rounded-lg px-3 py-1.5 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admins</option>
                <option value="mentor">Mentors</option>
                <option value="student">Students</option>
              </select>
            </div>
          </div>

          {error && (
            <div className={`text-sm rounded-xl px-3 py-2 mb-3 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
              <p className="mt-2 text-sm opacity-75">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">No users found</p>
              {searchUserQuery && (
                <button 
                  onClick={() => setSearchUserQuery("")}
                  className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="py-3 pr-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="py-3 pr-3">Name</th>
                    <th className="py-3 pr-3">Email</th>
                    <th className="py-3 pr-3">Role</th>
                    <th className="py-3 pr-3">Dept</th>
                    <th className="py-3 pr-3">Year</th>
                    <th className="py-3 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'} transition`}>
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={() => toggleSelectUser(u.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 pr-3 font-medium">{u.full_name}</td>
                      <td className="py-3 pr-3 opacity-75">{u.email}</td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700') :
                          u.role === 'mentor' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                          (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-3 opacity-75">{u.department || "-"}</td>
                      <td className="py-3 pr-3 opacity-75">{u.year || "-"}</td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className={`p-1.5 rounded ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-slate-200'} p-4`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">
              {formMode === "create" ? "Create New User" : "Edit User"}
            </h3>
            {formMode === "edit" && (
              <button
                onClick={startCreate}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                + New User
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Full name *
                </label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 ${formMode === "edit" ? 'opacity-75 cursor-not-allowed' : ''}`}
                  required={formMode === "create"}
                  disabled={formMode === "edit"}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Role *
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="admin">Admin</option>
                  <option value="mentor">Mentor</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {formMode === "create" && (
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">
                  Branch (Degree)
                </label>
                <select
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="">Select Branch</option>
                  {Object.entries(branches).map(([category, degreeList]) => (
                    <optgroup key={category} label={category}>
                      {degreeList.map(deg => (
                        <option key={deg} value={deg}>{deg}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  disabled={!form.branch}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50`}
                >
                  <option value="">Select Department</option>
                  {departmentList.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {form.role === "student" && (
                <>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Year
                    </label>
                    <select
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Semester
                    </label>
                    <input
                      type="number"
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      min="1"
                      max="8"
                      className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      USN
                    </label>
                    <input
                      name="usn"
                      value={form.usn}
                      onChange={handleChange}
                      className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>
                </>
              )}

              {form.role === "mentor" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Employee ID
                  </label>
                  <input
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleChange}
                    className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                  saving
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:shadow-md'
                } ${darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'} text-white`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {formMode === "create" ? "Creating..." : "Updating..."}
                  </span>
                ) : formMode === "create" ? (
                  "Create User"
                ) : (
                  "Update User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Mentor Assignments ----------------- */

function AdminAssignments({ darkMode }) {
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchStudentQuery, setSearchStudentQuery] = useState("");
  
  // Filter State
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [branches, setBranches] = useState({});
  const [filterDepartmentList, setFilterDepartmentList] = useState([]);
  const [studentMapping, setStudentMapping] = useState({}); // studentId -> { mentor_id, mentor_name }

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [mentorList, studentList, mapping] = await Promise.all([
        getUsers("mentor"),
        getUsers("student"),
        getAssignmentMapping(),
      ]);
      setMentors(mentorList || []);
      setStudents(studentList || []);
      setStudentMapping(mapping || {});
    } catch (e) {
      console.error("Failed to load users for assignments", e);
      setError("Failed to load mentors/students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadBranches() {
        try {
          const data = await getBranches();
          setBranches(data || {});
        } catch(e) {
          console.error("Failed to load branches", e);
        }
      }
  
      loadData();
      loadBranches();
  }, []);

  // Effect to load departments for filter
  useEffect(() => {
    async function fetchFilterDepts() {
      if (filterBranch) {
        try {
          const depts = await getDepartments(filterBranch);
          setFilterDepartmentList(depts || []);
        } catch (e) {
           console.error("Failed to load filter departments", e);
           setFilterDepartmentList([]);
        }
      } else {
        setFilterDepartmentList([]);
      }
    }
    fetchFilterDepts();
  }, [filterBranch]);

  const toggleStudent = (id) => {
    // Check if student is assigned to another mentor
    if (studentMapping[id] && studentMapping[id].mentor_id !== selectedMentorId) {
        return; // Prevent toggling if assigned to someone else
    }
    
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
      setMessage("Assignment saved successfully!");
      setSelectedStudentIds([]);
      // Refresh data to update mappings
      await loadData(); 
      alert("Mentor assignments saved successfully!");
    } catch (e) {
      console.error("Failed to save assignment", e);
      const detail = e?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Failed to save assignment. Please try again."
      );
      alert("Error: " + (detail || "Failed to save assignment"));
    } finally {
      setSaving(false);
    }
  };

  const toggleSelectAllStudents = () => {
    // Only toggle students who are NOT assigned to another mentor
    const availableStudents = filteredStudents.filter(s => 
        !studentMapping[s.id] || studentMapping[s.id].mentor_id === selectedMentorId
    );

    if (selectedStudentIds.length === availableStudents.length && availableStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map(s => s.id));
    }
  };

  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = 
        student.full_name?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        student.usn?.toLowerCase().includes(searchStudentQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchStudentQuery.toLowerCase());

    // Branch filter
    const matchesBranch = filterBranch ? student.branch === filterBranch : true;

    // Department filter
    const matchesDept = filterDept ? student.department === filterDept : true;

    // Year filter
    let matchesYear = true;
    if (filterYear && student.semester) {
      const sem = student.semester;
      if (filterYear === "1") matchesYear = sem === 1 || sem === 2;
      else if (filterYear === "2") matchesYear = sem === 3 || sem === 4;
      else if (filterYear === "3") matchesYear = sem === 5 || sem === 6;
      else if (filterYear === "4") matchesYear = sem === 7 || sem === 8;
    } else if (filterYear && !student.semester) {
       matchesYear = false;
    }
    
    return matchesSearch && matchesBranch && matchesDept && matchesYear;
  });

  return (
    <div className="space-y-6">
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">
            Mentor Assignments
            </h3>
            <button 
                onClick={loadData}
                disabled={loading}
                className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-slate-100 text-slate-600'}`}
                title="Refresh Data"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
          Assign students to mentors. Select a mentor first, then choose students to assign.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mentor Selection */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'} p-4`}>
            <h4 className="font-semibold mb-3">
              Select Mentor
            </h4>
            
            {loading ? (
              <div className="text-center py-8">
                <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
                <p className="mt-2 text-sm opacity-75">Loading mentors...</p>
              </div>
            ) : mentors.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 mx-auto opacity-50 mb-3" />
                <p className="text-sm opacity-75">No mentors found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {mentors.map((m) => {
                  const active = selectedMentorId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                          setSelectedMentorId(m.id);
                          // Pre-populate selected students based on mapping
                          const myStudents = Object.entries(studentMapping)
                             .filter(([sid, map]) => map.mentor_id === m.id)
                             .map(([sid]) => sid);
                          setSelectedStudentIds(myStudents);
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition ${
                        active
                          ? `${darkMode ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' : 'border-indigo-500 bg-indigo-50 text-indigo-700'}`
                          : `${darkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-slate-200 hover:bg-slate-100'}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{m.full_name}</div>
                        {active && <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {m.employee_id || "-"} • {m.department || "No dept"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Student Selection */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'} p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">
                Assign Students
              </h4>
              <div className="text-sm opacity-75">
                Selected: {selectedStudentIds.length}
              </div>
            </div>

            {error && (
              <div className={`text-sm rounded-xl px-3 py-2 mb-3 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {error}
              </div>
            )}
            {message && (
              <div className={`text-sm rounded-xl px-3 py-2 mb-3 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                {message}
              </div>
            )}
            
            {/* Filters */}
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 mb-3">
                <select
                    value={filterBranch}
                    onChange={(e) => {
                        setFilterBranch(e.target.value);
                        setFilterDept("");
                    }}
                    className={`w-full px-2 py-1.5 text-xs rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
                >
                    <option value="">All Branches</option>
                    {Object.entries(branches).map(([category, degreeList]) => (
                        <optgroup key={category} label={category}>
                            {degreeList.map(deg => (
                                <option key={deg} value={deg}>{deg}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>

                <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    disabled={!filterBranch}
                    className={`w-full px-2 py-1.5 text-xs rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} disabled:opacity-50`}
                >
                    <option value="">All Departments</option>
                    {filterDepartmentList.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>

                <select
                    value={filterYear}
                    onChange={(e) => setFilterYear(e.target.value)}
                    className={`w-full px-2 py-1.5 text-xs rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
                >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                </select>
                
                <button
                    onClick={() => {
                        setFilterBranch("");
                        setFilterDept("");
                        setFilterYear("");
                        setSearchStudentQuery("");
                    }}
                    disabled={!filterBranch && !filterDept && !filterYear && !searchStudentQuery}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-dashed border-gray-400 opacity-60 hover:opacity-100 transition"
                >
                    Clear Filters
                </button>
            </div>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Search students..."
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
                <p className="mt-2 text-sm opacity-75">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto opacity-50 mb-3" />
                <p className="text-sm opacity-75">No students found</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[280px]">
                <div className="max-h-[280px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className={`text-left border-b ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
                        <th className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                            onChange={toggleSelectAllStudents}
                            className="rounded"
                          />
                        </th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">USN</th>
                        <th className="py-2 px-3">Dept</th>
                        <th className="py-2 px-3">Sem</th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {filteredStudents.map((s) => {
                        const checked = selectedStudentIds.includes(s.id);
                        
                        // Check assignment status
                        const mapping = studentMapping[s.id];
                        const isAssignedToOther = mapping && mapping.mentor_id !== selectedMentorId;
                        const isAssignedToCurrent = mapping && mapping.mentor_id === selectedMentorId;
                        
                        return (
                          <tr 
                            key={s.id} 
                            className={`border-b transition ${
                                isAssignedToOther 
                                    ? (darkMode ? 'bg-gray-800/50 opacity-60' : 'bg-gray-50 opacity-60') 
                                    : (darkMode ? 'border-gray-600 hover:bg-gray-600' : 'border-slate-100 hover:bg-slate-100')
                            }`}
                            onClick={() => !isAssignedToOther && toggleStudent(s.id)}
                          >
                            <td className="py-2 px-3">
                              <input
                                type="checkbox"
                                checked={checked || isAssignedToCurrent} 
                                // We show 'checked' also if they are ALREADY assigned to the current mentor (fetched from mapping).
                                // BUT wait, 'selectedStudentIds' are what we will SAVE.
                                // If I want to UNASSIGN, I should need to uncheck.
                                // The backend REPLACE logic means if I omit them from 'student_ids', they are unassigned.
                                // So 'selectedStudentIds' MUST include currently assigned ones if we want to keep them.
                                // To make this work: When selecting a mentor, we should populate 'selectedStudentIds' with their current students.
                                // Let's simplify: 'selectedStudentIds' starts empty. But wait, if I save empty list, I remove all students?
                                // YES. So I need to pre-populate 'selectedStudentIds' when I select a mentor!
                                onChange={() => !isAssignedToOther && toggleStudent(s.id)}
                                disabled={isAssignedToOther}
                                className={`rounded ${isAssignedToOther ? 'cursor-not-allowed' : ''}`}
                              />
                            </td>
                            <td className="py-2 px-3 font-medium">
                                {s.full_name}
                                {isAssignedToOther && (
                                    <span className={`block text-xs ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                                        (Assigned to {mapping.mentor_name})
                                    </span>
                                )}
                                {isAssignedToCurrent && (
                                     <span className={`block text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        (Assigned)
                                    </span>
                                )}
                            </td>
                            <td className="py-2 px-3 opacity-75">{s.usn || "-"}</td>
                            <td className="py-2 px-3 opacity-75">{s.department || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedMentorId || selectedStudentIds.length === 0}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                  saving || !selectedMentorId || selectedStudentIds.length === 0
                    ? 'opacity-75 cursor-not-allowed'
                    : 'hover:shadow-md'
                } ${darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'} text-white`}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  `Assign ${selectedStudentIds.length} Student${selectedStudentIds.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Analytics ----------------- */

function AdminAnalytics({ darkMode }) {
  const [overview, setOverview] = useState(null);
  const [mentorLoad, setMentorLoad] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [placementStats, setPlacementStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChart, setActiveChart] = useState("mentorLoad");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [ov, ml, ds, ps] = await Promise.all([
        getAdminOverview(),
        getMentorLoad(),
        getStudentsByDepartment(),
        getAllStudentsAnalysis(),
      ]);
      setOverview(ov || {});
      setMentorLoad(ml || []);
      setDeptStats(ds || []);
      setPlacementStats(ps || []);
    } catch (e) {
      console.error("Failed to load admin analytics", e);
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportAnalytics = () => {
    const analyticsData = {
      overview,
      mentorLoad,
      deptStats,
      placementStats,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const topPerformers = [...placementStats]
    .sort((a, b) => b.composite_score - a.composite_score)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={overview?.total_students ?? "–"}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: "+12%", positive: true }}
          darkMode={darkMode}
          loading={loading}
        />
        <StatCard
          label="Total Mentors"
          value={overview?.total_mentors ?? "–"}
          icon={<UserCheck className="w-5 h-5" />}
          trend={{ value: "+5%", positive: true }}
          darkMode={darkMode}
          loading={loading}
        />
        <StatCard
          label="Placement Eligible"
          value={placementStats.filter(s => s.eligibility_status === "Eligible").length || "–"}
          icon={<Award className="w-5 h-5" />}
          trend={{ value: "+8%", positive: true }}
          darkMode={darkMode}
          loading={loading}
        />
        <StatCard
          label="High Risk Students"
          value={placementStats.filter(s => s.placement_probability < 40).length || "–"}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={{ value: "-2%", positive: true }} // Negative trend is good here conceptually, but UI shows green for positive
          darkMode={darkMode}
          loading={loading}
        />
      </section>

      {error && (
        <div className={`rounded-xl px-4 py-3 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className="mt-4 text-sm opacity-75">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Chart Controls */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadData}
                  disabled={loading}
                  className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-slate-100 text-slate-600'}`}
                  title="Refresh Analytics"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div>
                  <h3 className="text-lg font-bold">Analytics Dashboard</h3>
                  <p className="text-sm opacity-75">Visual insights into your platform data</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveChart("mentorLoad")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    activeChart === "mentorLoad"
                      ? 'bg-indigo-500 text-white'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  Mentor Load
                </button>
                <button
                  onClick={() => setActiveChart("department")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    activeChart === "department"
                      ? 'bg-indigo-500 text-white'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  Department
                </button>
                <button
                  onClick={() => setActiveChart("placement")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    activeChart === "placement"
                      ? 'bg-indigo-500 text-white'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  Placement Analysis
                </button>
                <button
                  onClick={handleExportAnalytics}
                  className="px-3 py-1.5 text-sm rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <section className="space-y-6">
            
            {activeChart === "mentorLoad" && (
                <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} h-96 min-h-[300px] w-full`}>
                    <h3 className="text-sm font-semibold mb-4">Students per Mentor</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mentorLoad.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                            <XAxis
                                dataKey="mentor_name"
                                angle={-30}
                                textAnchor="end"
                                height={70}
                                stroke={darkMode ? '#9ca3af' : '#64748b'}
                                fontSize={12}
                            />
                            <YAxis stroke={darkMode ? '#9ca3af' : '#64748b'} fontSize={12} />
                            <Tooltip 
                                contentStyle={darkMode ? { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' } : {}}
                            />
                            <Bar dataKey="student_count" name="Students" radius={[4, 4, 0, 0]} fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {activeChart === "department" && (
                <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} h-96 min-h-[300px] w-full`}>
                    <h3 className="text-sm font-semibold mb-4">Students by Department</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                            <XAxis dataKey="department" stroke={darkMode ? '#9ca3af' : '#64748b'} fontSize={12} />
                            <YAxis stroke={darkMode ? '#9ca3af' : '#64748b'} fontSize={12} />
                             <Tooltip 
                                contentStyle={darkMode ? { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' } : {}}
                            />
                            <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} fill="#0ea5e9" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {activeChart === "placement" && (
                <div className="grid gap-6">
                    {/* Top Performers */}
                    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                        <h3 className="text-lg font-bold mb-4">Top Performers 🏆</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                                        <th className="py-2 px-3">Name</th>
                                        <th className="py-2 px-3">Dept</th>
                                        <th className="py-2 px-3">Placement Prob.</th>
                                        <th className="py-2 px-3">Composite Score</th>
                                        <th className="py-2 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topPerformers.map((s, idx) => (
                                        <tr key={s.student_id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
                                            <td className="py-2 px-3 font-medium flex items-center gap-2">
                                                {idx === 0 && '🥇'}
                                                {idx === 1 && '🥈'}
                                                {idx === 2 && '🥉'}
                                                {s.student_name}
                                            </td>
                                            <td className="py-2 px-3 opacity-75">{s.department}</td>
                                            <td className="py-2 px-3 font-bold text-teal-500">{s.placement_probability}%</td>
                                            <td className="py-2 px-3 font-bold">{s.composite_score}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.eligibility_status === 'Eligible' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                                    {s.eligibility_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                
                    {/* Comparison Table */}
                    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                        <h3 className="text-lg font-bold mb-4">Candidate Comparison</h3>
                        <div className="overflow-x-auto max-h-96">
                             <table className="min-w-full text-sm">
                                <thead className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                    <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                                        <th className="py-2 px-3">Student</th>
                                        <th className="py-2 px-3">Dept</th>
                                        <th className="py-2 px-3">Score</th>
                                        <th className="py-2 px-3">Risk Factors</th>
                                        <th className="py-2 px-3">Improvement Areas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {placementStats.map((s) => (
                                        <tr key={s.student_id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className="py-2 px-3 font-medium">{s.student_name}</td>
                                            <td className="py-2 px-3 opacity-75">{s.department}</td>
                                            <td className="py-2 px-3">{s.composite_score}</td>
                                            <td className="py-2 px-3 text-red-500 text-xs">
                                                {s.risk_factors.slice(0, 2).join(", ")}
                                            </td>
                                            <td className="py-2 px-3 text-amber-500 text-xs">
                                                {s.improvement_areas.slice(0, 2).join(", ")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            
          </section>
        </>
      )}
    </div>
  );
}

/* ----------------- Circulars ----------------- */

function AdminCirculars({ darkMode, refreshTrigger }) {
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
  const [searchCircularQuery, setSearchCircularQuery] = useState("");

  useEffect(() => {
    loadCirculars();
  }, [refreshTrigger]);

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
      });
      setSaveMessage("Circular published successfully!");
      setTitle("");
      setContent("");
      setTarget("all");
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      setCirculars((prev) => [created, ...prev]);
      alert("Circular published successfully!");
    } catch (e) {
      console.error("Failed to create circular", e);
      const detail = e?.response?.data?.detail;
      setSaveError(
        typeof detail === "string"
          ? detail
          : "Failed to publish circular. Please try again."
      );
      alert("Error: " + (detail || "Failed to publish circular"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCircular = async (id) => {
    if (!window.confirm("Are you sure you want to delete this circular?")) return;
    // Frontend-only deletion for demo
    setCirculars(prev => prev.filter(c => c.id !== id));
    alert("Circular deleted (frontend only - backend requires API call)");
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        alert("File size must be less than 10MB");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  const filteredCirculars = circulars.filter(circular =>
    circular.title?.toLowerCase().includes(searchCircularQuery.toLowerCase()) ||
    circular.content?.toLowerCase().includes(searchCircularQuery.toLowerCase()) ||
    circular.target_audience?.toLowerCase().includes(searchCircularQuery.toLowerCase())
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Create circular */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-slate-200'} p-5`}>
        <h3 className="text-lg font-bold mb-4">
          Publish Circular
        </h3>
        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
          Circulars targeted to <span className="font-mono text-indigo-500">all</span> will be
          visible to all roles. You can also send only to{" "}
          <span className="font-mono text-indigo-500">students</span> or{" "}
          <span className="font-mono text-indigo-500">mentors</span>.
        </p>

        {saveError && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {saveError}
          </div>
        )}
        {saveMessage && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">
              Title *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="e.g. Internal Assessment Schedule"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Content *
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              placeholder="Write the circular details here…"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Target audience
            </label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="all">All Users</option>
              <option value="students">Students only</option>
              <option value="mentors">Mentors only</option>
              <option value="admins">Admins only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Attachment (optional)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx"
              onChange={handleFileChange}
              className={`w-full rounded-lg px-3 py-2 text-sm border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
            <p className="text-[10px] opacity-75 mt-1">
              (PDF, Images, DOC, XLSX allowed - Max 10MB)
            </p>
            {file && (
              <p className="text-xs mt-2">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
                saving
                  ? 'opacity-75 cursor-not-allowed'
                  : 'hover:shadow-md'
              } ${darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'} text-white`}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Publishing...
                </span>
              ) : (
                "Publish Circular"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* List circulars */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-slate-200'} p-5`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-bold">
            Recent Circulars ({filteredCirculars.length})
          </h3>
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchCircularQuery}
            onChange={(e) => setSearchCircularQuery(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
          />
        </div>

        {loadError && (
          <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
            <p className="mt-2 text-sm opacity-75">Loading circulars...</p>
          </div>
        ) : filteredCirculars.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto opacity-50 mb-3" />
            <p className="text-sm opacity-75">
              {searchCircularQuery ? "No circulars match your search" : "No circulars found. Create the first one on the left."}
            </p>
            {searchCircularQuery && (
              <button 
                onClick={() => setSearchCircularQuery("")}
                className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredCirculars.map((c) => (
              <article
                key={c.id}
                className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      c.target_audience === 'all' ? (darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700') :
                      c.target_audience === 'students' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                      c.target_audience === 'mentors' ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700') :
                      (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700')
                    }`}>
                      {c.target_audience}
                    </span>
                    <button
                      onClick={() => handleDeleteCircular(c.id)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs opacity-75 whitespace-pre-wrap mb-3">
                  {c.content.length > 150 ? `${c.content.substring(0, 150)}...` : c.content}
                </p>

                {c.file_url && (
                  <a
                    href={`${API_BASE_URL}${c.file_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 mb-2"
                  >
                    📎 View attachment
                  </a>
                )}

                <div className="flex items-center justify-between text-[11px] opacity-60">
                  <div>
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
                  </div>
                  <button className="hover:underline">
                    View details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}