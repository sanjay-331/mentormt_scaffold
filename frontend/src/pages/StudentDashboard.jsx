// // src/pages/StudentDashboard.jsx

// import React, { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { getStudentStats } from "../services/stats";
// import { getStudentAttendance } from "../services/attendance";
// import { getStudentMarks } from "../services/marks";
// import { getCirculars } from "../services/circulars";
// import { getStudentTimeline } from "../services/timeline";
// import { getAcademicHistory } from "../services/history";
// import { downloadReport } from "../services/reports";

// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
//   Legend,
//   BarChart,
//   Bar,
// } from "recharts";

// const API_BASE_URL = "http://127.0.0.1:8000";

// export default function StudentDashboard() {
//   const { user, logout } = useAuth();
//   const [stats, setStats] = useState(null);
//   const [loadingStats, setLoadingStats] = useState(true);
//   const [activeTab, setActiveTab] = useState("overview"); // overview | attendance | marks | circulars | timeline | history

//   useEffect(() => {
//     async function load() {
//       try {
//         const data = await getStudentStats();
//         setStats(data);
//       } catch (e) {
//         console.error("Failed to load student stats", e);
//       } finally {
//         setLoadingStats(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm">
//         <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
//           <h1 className="text-lg font-semibold text-slate-800">
//             Student Dashboard
//           </h1>
//           <div className="flex items-center gap-4">
//             {user && (
//               <div className="text-right text-sm text-slate-600">
//                 <div className="font-semibold">{user.full_name}</div>
//                 <div className="text-[11px] tracking-wide text-slate-500">
//                   {user.role.toUpperCase()}
//                 </div>
//               </div>
//             )}
//             <button
//               onClick={logout}
//               className="text-sm font-medium text-slate-700 border border-slate-300 rounded-full px-3 py-1 hover:bg-slate-100 transition"
//             >
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main */}
//       <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
//         {/* Hero */}
//         <div className="rounded-2xl bg-gradient-to-r from-teal-500 via-sky-500 to-blue-600 text-white p-6 shadow-lg">
//           <h2 className="text-xl font-semibold mb-1">
//             Welcome, {user?.full_name} 👋
//           </h2>
//           <p className="text-sm text-teal-50">
//             Track your attendance, marks, and important circulars here.
//           </p>
//         </div>

//         {/* Tabs */}
//         <div className="border-b border-slate-200 mb-2">
//           <nav className="-mb-px flex gap-4 flex-wrap">
//             <TabButton
//               active={activeTab === "overview"}
//               onClick={() => setActiveTab("overview")}
//             >
//               Overview
//             </TabButton>
//             <TabButton
//               active={activeTab === "attendance"}
//               onClick={() => setActiveTab("attendance")}
//             >
//               Attendance Details
//             </TabButton>
//             <TabButton
//               active={activeTab === "marks"}
//               onClick={() => setActiveTab("marks")}
//             >
//               Marks Details
//             </TabButton>
//             <TabButton
//               active={activeTab === "circulars"}
//               onClick={() => setActiveTab("circulars")}
//             >
//               Circulars
//             </TabButton>
//             <TabButton
//               active={activeTab === "timeline"}
//               onClick={() => setActiveTab("timeline")}
//             >
//               Timeline
//             </TabButton>
//             <TabButton
//               active={activeTab === "history"}
//               onClick={() => setActiveTab("history")}
//             >
//               Academic History
//             </TabButton>
//           </nav>
//         </div>

//         {/* Overview with quick stats + alerts */}
//         {activeTab === "overview" && (
//           <div className="space-y-4">
//             <div className="grid gap-4 md:grid-cols-3">
//               <InfoCard
//                 label="Attendance %"
//                 value={
//                   stats?.attendance_percentage != null
//                     ? `${stats.attendance_percentage}%`
//                     : loadingStats
//                     ? "…"
//                     : "0%"
//                 }
//               />
//               <InfoCard
//                 label="Average Marks %"
//                 value={
//                   stats?.average_marks_percentage != null
//                     ? `${stats.average_marks_percentage}%`
//                     : loadingStats
//                     ? "…"
//                     : "0%"
//                 }
//               />
//               <InfoCard
//                 label="Subjects"
//                 value={stats?.total_subjects ?? (loadingStats ? "…" : 0)}
//               />
//             </div>

//             {/* 🔔 Smart alerts */}
//             <StudentAlerts stats={stats} loading={loadingStats} />
//           </div>
//         )}

//         {activeTab === "attendance" && <StudentAttendanceDetails />}

//         {activeTab === "marks" && <StudentMarksDetails />}

//         {activeTab === "circulars" && <StudentCirculars />}
        
//         {activeTab === "timeline" && <StudentTimeline />}
        
//         {activeTab === "history" && <StudentAcademicHistory />}
//       </main>
//     </div>
//   );
// }

// function TabButton({ active, onClick, children }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
//         active
//           ? "border-teal-500 text-teal-600"
//           : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function InfoCard({ label, value }) {
//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//       <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
//         {label}
//       </div>
//       <div className="text-2xl font-semibold text-slate-800">{value}</div>
//     </div>
//   );
// }

// /* --------------- Student Alerts (Smart) --------------- */

// function StudentAlerts({ stats, loading }) {
//   if (loading) {
//     return (
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-sm text-slate-500">
//         Analysing your attendance and marks…
//       </div>
//     );
//   }

//   if (!stats) {
//     return (
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-sm text-slate-500">
//         No data available yet. Once your attendance and marks are uploaded,
//         alerts will appear here.
//       </div>
//     );
//   }

//   const alerts = [];

//   const att = stats.attendance_percentage ?? 0;
//   const marks = stats.average_marks_percentage ?? 0;

//   // Attendance alerts
//   if (att < 60) {
//     alerts.push({
//       level: "critical",
//       title: "Very low attendance",
//       message:
//         "Your attendance is below 60%. You are at risk of losing eligibility. Please talk to your mentor immediately.",
//     });
//   } else if (att < 75) {
//     alerts.push({
//       level: "warning",
//       title: "Attendance below recommended level",
//       message:
//         "Your attendance is below 75%. Try to attend more classes to avoid issues at the end of the semester.",
//     });
//   }

//   // Marks alerts
//   if (marks < 40) {
//     alerts.push({
//       level: "critical",
//       title: "Very low marks",
//       message:
//         "Your average marks are below 40%. Focus on weak subjects and seek help from your mentor/faculty.",
//     });
//   } else if (marks < 50) {
//     alerts.push({
//       level: "warning",
//       title: "Marks need improvement",
//       message:
//         "Your average marks are below 50%. You still have time to improve before final exams.",
//     });
//   }

//   if (alerts.length === 0) {
//     alerts.push({
//       level: "info",
//       title: "You are doing well 🎉",
//       message:
//         "Your attendance and marks are in a healthy range. Keep maintaining your performance!",
//     });
//   }

//   const levelStyles = {
//     critical:
//       "border-red-200 bg-red-50 text-red-800 before:bg-red-400 before:shadow-red-300",
//     warning:
//       "border-amber-200 bg-amber-50 text-amber-800 before:bg-amber-400 before:shadow-amber-300",
//     info:
//       "border-emerald-200 bg-emerald-50 text-emerald-800 before:bg-emerald-400 before:shadow-emerald-300",
//   };

//   const levelLabel = {
//     critical: "CRITICAL",
//     warning: "WARNING",
//     info: "GOOD",
//   };

//   return (
//     <div className="bg-transparent">
//       <h3 className="text-sm font-semibold text-slate-800 mb-2">
//         Smart alerts
//       </h3>
//       <div className="space-y-2">
//         {alerts.map((a, idx) => (
//           <div
//             key={idx}
//             className={`relative pl-3 pr-3 py-2 rounded-2xl border text-sm flex flex-col gap-1 overflow-hidden before:absolute before:left-2 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:rounded-full before:shadow-sm ${levelStyles[a.level]}`}
//           >
//             <div className="flex items-center justify-between">
//               <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
//                 {levelLabel[a.level]}
//               </span>
//               <span className="text-xs opacity-60">
//                 Att: {att}% • Marks: {marks}%
//               </span>
//             </div>
//             <div className="font-semibold text-[13px]">{a.title}</div>
//             <div className="text-[12px] opacity-90">{a.message}</div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// /* --------------- Attendance Details + Chart --------------- */

// function StudentAttendanceDetails() {
//   const { user } = useAuth();
//   const [records, setRecords] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");
//   const [chartData, setChartData] = useState([]);

//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       setLoadError("");
//       try {
//         const data = await getStudentAttendance(user.id);
//         setRecords(data || []);
//         setChartData(buildAttendanceChartData(data || []));
//       } catch (e) {
//         console.error("Failed to load attendance", e);
//         setLoadError("Failed to load attendance.");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [user?.id]);

//   return (
//     <div className="grid gap-6 md:grid-cols-2">
//       {/* Chart */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//         <h3 className="text-sm font-semibold text-slate-800 mb-1">
//           Attendance trend (by month)
//         </h3>
//         <p className="text-xs text-slate-500 mb-3">
//           Shows your overall attendance percentage month-wise.
//         </p>

//         {chartData.length === 0 ? (
//           <div className="text-sm text-slate-500">
//             Not enough data to show chart yet.
//           </div>
//         ) : (
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="month" />
//                 <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
//                 <Tooltip formatter={(v) => `${v}%`} />
//                 <Legend />
//                 <Line
//                   type="monotone"
//                   dataKey="percentage"
//                   name="Attendance %"
//                   stroke="#0f766e"
//                   strokeWidth={2}
//                   dot={{ r: 3 }}
//                   activeDot={{ r: 5 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//         <h3 className="text-sm font-semibold text-slate-800 mb-3">
//           Attendance records ({records.length})
//         </h3>
        
//         <div className="flex gap-2 mb-3">
//             <button onClick={() => downloadReport('attendance', 'pdf')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Download PDF</button>
//             <button onClick={() => downloadReport('attendance', 'xlsx')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Download Excel</button>
//         </div>

//         {loadError && (
//           <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
//             {loadError}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-sm text-slate-500">Loading attendance…</div>
//         ) : records.length === 0 ? (
//           <div className="text-sm text-slate-500">
//             No attendance records available.
//           </div>
//         ) : (
//           <div className="max-h-[360px] overflow-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
//                   <th className="py-2 px-3">Date</th>
//                   <th className="py-2 px-3">Subject</th>
//                   <th className="py-2 px-3">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {records.map((r) => (
//                   <tr
//                     key={r.id}
//                     className="border-b border-slate-50 last:border-0"
//                   >
//                     <td className="py-1.5 px-3 text-slate-700">
//                       {formatDate(r.date)}
//                     </td>
//                     <td className="py-1.5 px-3 text-slate-700">
//                       {r.subject}
//                     </td>
//                     <td className="py-1.5 px-3">
//                       <span
//                         className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
//                           r.status === "present"
//                             ? "bg-emerald-50 text-emerald-700"
//                             : r.status === "absent"
//                             ? "bg-red-50 text-red-600"
//                             : "bg-amber-50 text-amber-700"
//                         }`}
//                       >
//                         {r.status.toUpperCase()}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // Build chart data: month-wise attendance percentage
// function buildAttendanceChartData(records) {
//   if (!records || records.length === 0) return [];

//   const byMonth = {}; // { '2025-12' : { present, total } }

//   for (const r of records) {
//     const d = new Date(r.date);
//     if (Number.isNaN(d.getTime())) continue;
//     const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
//       2,
//       "0"
//     )}`;
//     if (!byMonth[key]) {
//       byMonth[key] = { present: 0, total: 0 };
//     }
//     byMonth[key].total += 1;
//     if (r.status === "present") {
//       byMonth[key].present += 1;
//     }
//   }

//   return Object.entries(byMonth)
//     .sort(([a], [b]) => (a < b ? -1 : 1))
//     .map(([key, value]) => {
//       const [year, month] = key.split("-");
//       const dateObj = new Date(Number(year), Number(month) - 1, 1);
//       const label = dateObj.toLocaleString("default", {
//         month: "short",
//         year: "2-digit",
//       });
//       const percentage =
//         value.total > 0 ? Math.round((value.present / value.total) * 100) : 0;
//       return {
//         month: label,
//         percentage,
//       };
//     });
// }

// /* --------------- Marks Details + Chart --------------- */

// function StudentMarksDetails() {
//   const { user } = useAuth();
//   const [marks, setMarks] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");
//   const [chartData, setChartData] = useState([]);

//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       setLoadError("");
//       try {
//         const data = await getStudentMarks(user.id);
//         setMarks(data || []);
//         setChartData(buildMarksChartData(data || []));
//       } catch (e) {
//         console.error("Failed to load marks", e);
//         setLoadError("Failed to load marks.");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [user?.id]);

//   return (
//     <div className="grid gap-6 md:grid-cols-2">
//       {/* Chart */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//         <h3 className="text-sm font-semibold text-slate-800 mb-1">
//           Marks trend (per test)
//         </h3>
//         <p className="text-xs text-slate-500 mb-3">
//           Each bar shows percentage scored in a particular test for each
//           subject.
//         </p>

//         {chartData.length === 0 ? (
//           <div className="text-sm text-slate-500">
//             Not enough data to show chart yet.
//           </div>
//         ) : (
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={chartData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis
//                   dataKey="label"
//                   angle={-30}
//                   textAnchor="end"
//                   height={60}
//                 />
//                 <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
//                 <Tooltip formatter={(v) => `${v}%`} />
//                 <Legend />
//                 <Bar
//                   dataKey="percentage"
//                   name="Marks %"
//                   fill="#2563eb"
//                   radius={[4, 4, 0, 0]}
//                 />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//         <h3 className="text-sm font-semibold text-slate-800 mb-3">
//           Marks records ({marks.length})
//         </h3>
        
//         <div className="flex gap-2 mb-3">
//             <button onClick={() => downloadReport('marks', 'pdf')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Download PDF</button>
//             <button onClick={() => downloadReport('marks', 'xlsx')} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100">Download Excel</button>
//         </div>

//         {loadError && (
//           <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
//             {loadError}
//           </div>
//         )}

//         {loading ? (
//           <div className="text-sm text-slate-500">Loading marks…</div>
//         ) : marks.length === 0 ? (
//           <div className="text-sm text-slate-500">
//             No marks records available.
//           </div>
//         ) : (
//           <div className="max-h-[360px] overflow-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
//                   <th className="py-2 px-3">Subject</th>
//                   <th className="py-2 px-3">Type</th>
//                   <th className="py-2 px-3">Semester</th>
//                   <th className="py-2 px-3">Marks</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {marks.map((m) => {
//                   const percent =
//                     m.max_marks > 0
//                       ? Math.round((m.marks_obtained / m.max_marks) * 100)
//                       : 0;
//                   return (
//                     <tr
//                       key={m.id}
//                       className="border-b border-slate-50 last:border-0"
//                     >
//                       <td className="py-1.5 px-3 text-slate-700">
//                         {m.subject}
//                       </td>
//                       <td className="py-1.5 px-3 text-slate-700">
//                         {m.marks_type}
//                       </td>
//                       <td className="py-1.5 px-3 text-slate-700">
//                         {m.semester}
//                       </td>
//                       <td className="py-1.5 px-3 text-slate-700">
//                         {m.marks_obtained}/{m.max_marks} ({percent}%)
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function buildMarksChartData(marks) {
//   if (!marks || marks.length === 0) return [];

//   // One bar per (subject + test)
//   return marks.map((m) => {
//     const label = `${m.subject} ${m.marks_type}`;
//     const percentage =
//       m.max_marks > 0
//         ? Math.round((m.marks_obtained / m.max_marks) * 100)
//         : 0;
//     return { label, percentage };
//   });
// }

// /* --------------- Circulars (with attachment link) --------------- */

// function StudentCirculars() {
//   const [circulars, setCirculars] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       setError("");
//       try {
//         const data = await getCirculars();
//         setCirculars(data || []);
//       } catch (e) {
//         console.error("Failed to load circulars", e);
//         setError("Failed to load circulars.");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//       <h3 className="text-sm font-semibold text-slate-800 mb-3">
//         Circulars ({circulars.length})
//       </h3>

//       {error && (
//         <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-2">
//           {error}
//         </div>
//       )}

//       {loading ? (
//         <div className="text-sm text-slate-500">Loading circulars…</div>
//       ) : circulars.length === 0 ? (
//         <div className="text-sm text-slate-500">
//           No circulars available for you yet.
//         </div>
//       ) : (
//         <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
//           {circulars.map((c) => (
//             <article
//               key={c.id}
//               className="border border-slate-100 rounded-xl px-3 py-2 bg-slate-50"
//             >
//               <div className="flex items-center justify-between mb-1.5">
//                 <h4 className="text-sm font-semibold text-slate-800">
//                   {c.title}
//                 </h4>
//                 <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-sky-50 text-sky-700">
//                   {c.target_audience}
//                 </span>
//               </div>
//               <p className="text-xs text-slate-600 whitespace-pre-wrap mb-1">
//                 {c.content}
//               </p>

//               {c.file_url && (
//                 <a
//                   href={`${API_BASE_URL}${c.file_url}`}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="inline-flex items-center text-[11px] font-medium text-sky-600 hover:underline mb-1"
//                 >
//                   📎 View attachment
//                 </a>
//               )}

//               <div className="text-[11px] text-slate-500">
//                 {c.created_at ? new Date(c.created_at).toLocaleString() : ""}
//               </div>
//             </article>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /* --------------- Helpers --------------- */

// function formatDate(dateStr) {
//   const d = new Date(dateStr);
//   if (Number.isNaN(d.getTime())) return dateStr;
//   return d.toLocaleDateString();
// }

// /* --------------- Timeline --------------- */

// function StudentTimeline() {
//   const [timeline, setTimeline] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const data = await getStudentTimeline();
//         setTimeline(data || []);
//       } catch (e) {
//         console.error("Failed to load timeline");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//       <h3 className="text-sm font-semibold text-slate-800 mb-3">Activity Timeline</h3>
//       {loading ? (
//         <div className="text-sm text-slate-500">Loading timeline...</div>
//       ) : timeline.length === 0 ? (
//         <div className="text-sm text-slate-500">No recent activity.</div>
//       ) : (
//         <div className="space-y-4">
//           {timeline.map((item, idx) => (
//             <div key={idx} className="flex gap-3">
//               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg">
//                 {item.type === "notification" ? "🔔" : "💬"}
//               </div>
//               <div>
//                 <div className="text-sm font-medium text-slate-800">{item.title}</div>
//                 <div className="text-xs text-slate-600 mt-0.5">{item.description}</div>
//                 <div className="text-[10px] text-slate-400 mt-1">
//                   {new Date(item.timestamp).toLocaleString()}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// /* --------------- Academic History --------------- */

// function StudentAcademicHistory() {
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     async function load() {
//       try {
//         const data = await getAcademicHistory();
//         setHistory(data || []);
//       } catch (e) {
//         console.error("Failed to load history");
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, []);

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
//       <h3 className="text-sm font-semibold text-slate-800 mb-3">Semester-wise History</h3>
//        {loading ? (
//         <div className="text-sm text-slate-500">Loading history...</div>
//       ) : history.length === 0 ? (
//         <div className="text-sm text-slate-500">No academic history available.</div>
//       ) : (
//         <>
//             <div className="h-64 mb-6">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={history}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="semester" tickFormatter={(v) => `Sem ${v}`} />
//                     <YAxis domain={[0, 100]} />
//                     <Tooltip />
//                     <Bar dataKey="average_percentage" name="Avg %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//             </div>
          
//            {/* Table */}
//            <table className="min-w-full text-sm">
//               <thead>
//                 <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
//                   <th className="py-2 px-3">Semester</th>
//                   <th className="py-2 px-3">Subjects</th>
//                   <th className="py-2 px-3">Avg %</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history.map((h) => (
//                    <tr key={h.semester} className="border-b border-slate-50 last:border-0">
//                       <td className="py-2 px-3">Semester {h.semester}</td>
//                       <td className="py-2 px-3">{h.subjects_count}</td>
//                       <td className="py-2 px-3 font-medium text-slate-700">{h.average_percentage}%</td>
//                    </tr>
//                 ))}
//               </tbody>
//            </table>
//         </>
//       )}
//     </div>
//   );
// }


// src/pages/StudentDashboard.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentStats } from "../services/stats";
import { getStudentAttendance } from "../services/attendance";
import { getStudentMarks } from "../services/marks";
import { getCirculars } from "../services/circulars";
import { getStudentTimeline } from "../services/timeline";
import { getAcademicHistory } from "../services/history";
import { downloadReport } from "../services/reports";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  Bookmark,
  Star,
  Trophy,
  Target as TargetIcon,
  CalendarDays,
  Clock4,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon2,
  LineChart as LineChartIcon,
  Heart,
  Flag,
  ShieldAlert,
  BellRing,
  Mail,
  Phone,
  Home,
  School,
  Book,
  Notebook,
  Calculator,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  DownloadCloud,
  Share2,
  Printer,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronDown,
  Check,
  XCircle,
  Zap,
  Battery,
  BatteryCharging,
  Thermometer,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Sparkles,
  Rocket,
  Target as TargetIcon2,
} from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
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
        const data = await getStudentStats();
        setStats(data);
        setNotifications([
          { id: 1, title: "New feedback", message: "Your mentor gave you feedback", time: "10 min ago", type: "info", read: false },
          { id: 2, title: "Attendance alert", message: "Your attendance is below 75%", time: "1 hour ago", type: "warning", read: false },
          { id: 3, title: "Marks updated", message: "IA1 marks have been published", time: "3 hours ago", type: "success", read: true },
          { id: 4, title: "New circular", message: "VTU exam schedule published", time: "1 day ago", type: "info", read: true },
        ]);
      } catch (e) {
        console.error("Failed to load student stats", e);
      } finally {
        setLoadingStats(false);
      }
    }
    load();
  }, []);

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      stats: stats,
      student: user,
      timestamp: Date.now()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `student-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  const handleRequestTranscript = () => {
    alert("Transcript request submitted!\n\nYour academic transcript will be generated and sent to your email.\n\nNote: This is a frontend demo.");
  };

  const handleBookAppointment = () => {
    const mentor = prompt("Enter mentor name for appointment:");
    const date = prompt("Enter preferred date (YYYY-MM-DD):");
    const reason = prompt("Enter reason for appointment:");
    
    if (mentor && date && reason) {
      alert(`Appointment booked!\n\nMentor: ${mentor}\nDate: ${date}\nReason: ${reason}\n\nNote: This is a frontend demo.`);
    }
  };

  const handleDownloadCertificate = () => {
    alert("Certificate download started!\n\nYour course completion certificate is being generated.\n\nNote: This is a frontend demo.");
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  Student Dashboard
                </h1>
                <p className="text-xs opacity-75">
                  Track your academic progress and performance
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 opacity-60" />
                <input
                  type="text"
                  placeholder="Search circulars, subjects, marks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border bg-white/5 border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 rounded-full hover:bg-gray-700 transition"
                  onClick={() => document.getElementById('student-notifications-panel').classList.toggle('hidden')}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                <div id="student-notifications-panel" className="hidden absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Notifications</h3>
                      <button 
                        onClick={clearAllNotifications}
                        className="text-sm text-emerald-400 hover:text-emerald-300"
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
                          onClick={() => markNotificationAsRead(notif.id)}
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
                                {notif.time}
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
                    {user?.full_name || "Student"}
                  </div>
                  <div className="text-[11px] opacity-75">
                    {user?.role?.toUpperCase() || "STUDENT"}
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.full_name?.charAt(0) || 'S'}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition shadow-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-emerald-50 to-teal-50'} border ${darkMode ? 'border-gray-700' : 'border-emerald-100'}`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome back, {user?.full_name}!
              </h2>
              <p className="opacity-75">
                Track your attendance, marks, and important circulars here. Stay on top of your academic journey! 🚀
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  USN: {user?.usn || "Not assigned"}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                  Sem: {user?.semester || "Not assigned"}
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                  Dept: {user?.department || "Not assigned"}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => alert("Contact your mentor for guidance")}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition text-sm font-medium"
              >
                Contact Mentor
              </button>
              <button
                onClick={() => alert("View your academic calendar")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
              >
                View Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Attendance %"
            value={
              stats?.attendance_percentage != null
                ? `${stats.attendance_percentage}%`
                : loadingStats ? "…" : "0%"
            }
            icon={<Percent className="w-5 h-5" />}
            trend={{ value: "+2.3%", positive: stats?.attendance_percentage > 75 }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Average Marks %"
            value={
              stats?.average_marks_percentage != null
                ? `${stats.average_marks_percentage}%`
                : loadingStats ? "…" : "0%"
            }
            icon={<Award className="w-5 h-5" />}
            trend={{ value: "+1.8%", positive: stats?.average_marks_percentage > 60 }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Subjects"
            value={stats?.total_subjects ?? (loadingStats ? "…" : 0)}
            icon={<Book className="w-5 h-5" />}
            trend={{ value: "Current", positive: true }}
            darkMode={darkMode}
            loading={loadingStats}
          />
          <StatCard
            label="Pending Tasks"
            value={stats?.pending_tasks ?? (loadingStats ? "…" : 3)}
            icon={<ClipboardList className="w-5 h-5" />}
            trend={{ value: "Due soon", positive: false }}
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
              title="Request Transcript"
              description="Get academic transcript"
              icon={<FileSpreadsheet className="w-5 h-5" />}
              color="emerald"
              darkMode={darkMode}
              onClick={handleRequestTranscript}
            />
            <QuickActionCard
              title="Book Appointment"
              description="Meet with mentor"
              icon={<Calendar className="w-5 h-5" />}
              color="blue"
              darkMode={darkMode}
              onClick={handleBookAppointment}
            />
            <QuickActionCard
              title="Download Certificate"
              description="Course completion"
              icon={<Trophy className="w-5 h-5" />}
              color="amber"
              darkMode={darkMode}
              onClick={handleDownloadCertificate}
            />
            <QuickActionCard
              title="Academic Calendar"
              description="View schedule"
              icon={<CalendarDays className="w-5 h-5" />}
              color="purple"
              darkMode={darkMode}
              onClick={() => alert("View academic calendar and important dates")}
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
                  active={activeTab === "timeline"}
                  onClick={() => setActiveTab("timeline")}
                  icon={<Activity className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  Timeline
                </EnhancedTabButton>
                <EnhancedTabButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                  icon={<BookOpen className="w-4 h-4" />}
                  darkMode={darkMode}
                >
                  History
                </EnhancedTabButton>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && <StudentOverview darkMode={darkMode} stats={stats} />}
              {activeTab === "attendance" && <StudentAttendanceDetails darkMode={darkMode} />}
              {activeTab === "marks" && <StudentMarksDetails darkMode={darkMode} />}
              {activeTab === "circulars" && <StudentCirculars darkMode={darkMode} />}
              {activeTab === "timeline" && <StudentTimeline darkMode={darkMode} />}
              {activeTab === "history" && <StudentAcademicHistory darkMode={darkMode} />}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Upcoming Deadlines
              </h3>
              <button className="text-sm text-emerald-400 hover:text-emerald-300">
                View all
              </button>
            </div>
            <div className="space-y-4">
              <DeadlineItem
                title="IA2 Submission"
                subject="Mathematics"
                date="2024-03-15"
                daysLeft={3}
                darkMode={darkMode}
              />
              <DeadlineItem
                title="Project Review"
                subject="Computer Science"
                date="2024-03-20"
                daysLeft={8}
                darkMode={darkMode}
              />
              <DeadlineItem
                title="Assignment"
                subject="Physics"
                date="2024-03-25"
                daysLeft={13}
                darkMode={darkMode}
              />
              <DeadlineItem
                title="VTU Exam"
                subject="All Subjects"
                date="2024-04-10"
                daysLeft={29}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-12 py-6 border-t ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-sm opacity-75">
              © 2024 Student Portal • Empower Your Academic Journey
            </div>
            <div className="flex items-center space-x-6">
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Academic Resources
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Student Support
              </button>
              <button className="text-sm opacity-75 hover:opacity-100 transition">
                Help Center
              </button>
            </div>
          </div>
          <div className="mt-4 text-center text-xs opacity-50">
            <p>All student features are functional without backend changes</p>
            <p>Mock data will be replaced by actual data when backend is connected</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StudentOverview({ darkMode, stats }) {
  const [performanceChart, setPerformanceChart] = useState([]);
  const [subjectDistribution, setSubjectDistribution] = useState([]);

  useEffect(() => {
    // Mock performance data
    const performanceData = [
      { month: 'Jan', attendance: 78, marks: 72 },
      { month: 'Feb', attendance: 82, marks: 75 },
      { month: 'Mar', attendance: 85, marks: 78 },
      { month: 'Apr', attendance: 88, marks: 81 },
      { month: 'May', attendance: 90, marks: 85 },
      { month: 'Jun', attendance: 92, marks: 88 },
    ];
    
    const subjectData = [
      { subject: 'Math', attendance: 85, marks: 78, color: '#0d9488' },
      { subject: 'Physics', attendance: 92, marks: 82, color: '#3b82f6' },
      { subject: 'Chemistry', attendance: 88, marks: 75, color: '#8b5cf6' },
      { subject: 'CS', attendance: 95, marks: 88, color: '#10b981' },
      { subject: 'English', attendance: 90, marks: 80, color: '#f59e0b' },
    ];

    setPerformanceChart(performanceData);
    setSubjectDistribution(subjectData);
  }, []);

  return (
    <div className="space-y-6">
      {/* Smart Alerts */}
      <StudentAlerts stats={stats} darkMode={darkMode} />

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <h3 className="font-semibold mb-5">
            Performance Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                <XAxis 
                  dataKey="month" 
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
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="attendance" 
                  name="Attendance %"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="marks" 
                  name="Marks %"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
          <h3 className="font-semibold mb-5">
            Subject-wise Performance
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectDistribution}>
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
                <Legend />
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
      </div>

      {/* Quick Stats */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'} shadow-sm`}>
        <h3 className="font-semibold mb-5">
          Academic Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Classes"
            value="128"
            change="+12"
            trend="up"
            darkMode={darkMode}
          />
          <SummaryCard
            title="Present Days"
            value="112"
            change="+8"
            trend="up"
            darkMode={darkMode}
          />
          <SummaryCard
            title="Tests Taken"
            value="18"
            change="+3"
            trend="up"
            darkMode={darkMode}
          />
          <SummaryCard
            title="Assignments"
            value="7/10"
            change="2 pending"
            trend="warning"
            darkMode={darkMode}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, change, trend, darkMode }) {
  const trendColors = {
    up: darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
    down: darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
    warning: darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
    neutral: darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700',
  };

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    warning: '⚠️',
    neutral: '➡️',
  };

  return (
    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'} border ${darkMode ? 'border-gray-600' : 'border-slate-200'}`}>
      <div className="text-sm opacity-75 mb-1">
        {title}
      </div>
      <div className="text-2xl font-bold mb-2">
        {value}
      </div>
      <div className={`text-xs font-medium px-2 py-1 rounded-full inline-block ${trendColors[trend]}`}>
        {trendIcons[trend]} {change}
      </div>
    </div>
  );
}

function StudentAlerts({ stats, darkMode }) {
  if (!stats) return null;

  const att = stats.attendance_percentage ?? 0;
  const marks = stats.average_marks_percentage ?? 0;

  const alerts = [];

  if (att < 60) {
    alerts.push({
      level: "critical",
      title: "Very low attendance",
      message: "Your attendance is below 60%. You are at risk of losing eligibility.",
      action: "Contact mentor",
      icon: "🚨"
    });
  } else if (att < 75) {
    alerts.push({
      level: "warning",
      title: "Attendance below recommended",
      message: "Your attendance is below 75%. Attend more classes to avoid issues.",
      action: "Improve attendance",
      icon: "⚠️"
    });
  }

  if (marks < 40) {
    alerts.push({
      level: "critical",
      title: "Very low marks",
      message: "Your average marks are below 40%. Focus on weak subjects.",
      action: "Seek help",
      icon: "📉"
    });
  } else if (marks < 50) {
    alerts.push({
      level: "warning",
      title: "Marks need improvement",
      message: "Your average marks are below 50%. Work on improvement.",
      action: "Study plan",
      icon: "📚"
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      level: "info",
      title: "You are doing well 🎉",
      message: "Your attendance and marks are in a healthy range.",
      action: "Keep it up",
      icon: "🌟"
    });
  }

  const handleAlertAction = (action) => {
    alert(`Action: ${action}\n\nThis would trigger specific guidance or resources.`);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold">
        Smart Alerts
      </h3>
      <div className="grid gap-3">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${darkMode ? 'border-gray-600' : 'border-slate-200'} ${
              alert.level === "critical" 
                ? darkMode ? 'bg-red-500/10' : 'bg-red-50' 
                : alert.level === "warning" 
                ? darkMode ? 'bg-amber-500/10' : 'bg-amber-50'
                : darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {alert.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">
                    {alert.title}
                  </h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    alert.level === "critical" 
                      ? darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700' 
                      : alert.level === "warning" 
                      ? darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                      : darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {alert.level.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm opacity-75 mb-2">
                  {alert.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs opacity-60">
                    Att: {att}% • Marks: {marks}%
                  </span>
                  <button
                    onClick={() => handleAlertAction(alert.action)}
                    className={`text-xs font-medium px-3 py-1 rounded-lg transition ${
                      alert.level === "critical" 
                        ? darkMode ? 'bg-red-500 hover:bg-red-600' : 'bg-red-500 text-white hover:bg-red-600' 
                        : alert.level === "warning" 
                        ? darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-amber-500 text-white hover:bg-amber-600'
                        : darkMode ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {alert.action}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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
          ? `${darkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`
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
    emerald: darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    blue: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600',
    amber: darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-600',
    purple: darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600',
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

function DeadlineItem({ title, subject, date, daysLeft, darkMode }) {
  const getDaysColor = (days) => {
    if (days <= 3) return "red";
    if (days <= 7) return "amber";
    return "emerald";
  };

  const colorClasses = {
    red: darkMode ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200',
    amber: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
    emerald: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${colorClasses[getDaysColor(daysLeft)]}`}>
      <div>
        <h5 className="font-medium text-sm">
          {title}
        </h5>
        <p className="text-xs opacity-75">
          {subject} • Due: {new Date(date).toLocaleDateString()}
        </p>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
        daysLeft <= 3 
          ? darkMode ? 'bg-red-500 text-white' : 'bg-red-500 text-white'
          : daysLeft <= 7
          ? darkMode ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white'
          : darkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white'
      }`}>
        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

function StudentAttendanceDetails({ darkMode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [chartData, setChartData] = useState([]);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getStudentAttendance(user.id);
        setRecords(data || []);
        setChartData(buildAttendanceChartData(data || []));
      } catch (e) {
        console.error("Failed to load attendance", e);
        setLoadError("Failed to load attendance.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleDownloadPDF = () => {
    const reportWindow = window.open();
    reportWindow.document.write(`
      <html>
        <head><title>Attendance Report - ${user?.full_name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Attendance Report</h1>
          <p>Student: ${user?.full_name || "Unknown"}</p>
          <p>USN: ${user?.usn || "Not assigned"}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <hr>
          <h2>Attendance Records (${records.length})</h2>
          <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
            ${records.slice(0, 50).map(r => `
              <tr>
                <td>${formatDate(r.date)}</td>
                <td>${r.subject || "Unknown"}</td>
                <td>${r.status.toUpperCase()}</td>
              </tr>
            `).join('')}
          </table>
          <hr>
          <p>Total Records: ${records.length}</p>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const handleDownloadExcel = () => {
    const csvData = [
      ["Date", "Subject", "Status"],
      ...records.map(r => [formatDate(r.date), r.subject, r.status])
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Attendance Report',
        text: `Attendance report for ${user?.full_name}`,
        url: window.location.href
      });
    } else {
      alert("Share feature not available in your browser");
    }
  };

  const filteredRecords = records.filter(record => {
    if (filterSubject !== "all" && record.subject !== filterSubject) return false;
    if (filterMonth !== "all") {
      const recordMonth = new Date(record.date).toISOString().slice(0, 7);
      if (recordMonth !== filterMonth) return false;
    }
    return true;
  });

  const subjects = [...new Set(records.map(r => r.subject))];
  const months = [...new Set(records.map(r => new Date(r.date).toISOString().slice(0, 7)))].sort().reverse();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Attendance Details
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
              Track your attendance records and trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            >
              <option value="all">All Months</option>
              {months.map(month => {
                const [year, m] = month.split('-');
                const date = new Date(year, m-1);
                return (
                  <option key={month} value={month}>
                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">
                Attendance Trend
              </h4>
              <p className={`text-sm opacity-75 mt-1`}>
                Monthly attendance percentage
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded hover:bg-gray-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                Not enough data to show chart yet.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="month" 
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
                    formatter={(v) => [`${v}%`, 'Attendance']}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    } : {}}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Attendance %"
                    stroke="#0f766e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Table */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">
                Attendance Records ({filteredRecords.length})
              </h4>
              <p className={`text-sm opacity-75 mt-1`}>
                Showing {filterSubject !== "all" ? filterSubject : "all subjects"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Download PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadExcel}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Download Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={handleShareReport}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadError && (
            <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
              <p className="mt-2 text-sm opacity-75">Loading attendance...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                {filterSubject !== "all" || filterMonth !== "all" 
                  ? "No records match your filters"
                  : "No attendance records available."}
              </p>
              {(filterSubject !== "all" || filterMonth !== "all") && (
                <button 
                  onClick={() => {
                    setFilterSubject("all");
                    setFilterMonth("all");
                  }}
                  className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'} transition`}
                    >
                      <td className="py-2 px-3">
                        {formatDate(r.date)}
                      </td>
                      <td className="py-2 px-3 font-medium">
                        {r.subject}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            r.status === "present"
                              ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                              : r.status === "absent"
                              ? darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                              : darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => alert(`View details for ${formatDate(r.date)} - ${r.subject}`)}
                          className={`text-xs ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <h4 className="font-semibold mb-4">
          Attendance Statistics
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredRecords.filter(r => r.status === "present").length}
            </div>
            <div className="text-sm opacity-75">Present</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredRecords.filter(r => r.status === "absent").length}
            </div>
            <div className="text-sm opacity-75">Absent</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredRecords.filter(r => r.status === "leave").length}
            </div>
            <div className="text-sm opacity-75">Leave</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredRecords.length > 0 
                ? Math.round((filteredRecords.filter(r => r.status === "present").length / filteredRecords.length) * 100)
                : 0}%
            </div>
            <div className="text-sm opacity-75">Overall %</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentMarksDetails({ darkMode }) {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [chartData, setChartData] = useState([]);
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const data = await getStudentMarks(user.id);
        setMarks(data || []);
        setChartData(buildMarksChartData(data || []));
      } catch (e) {
        console.error("Failed to load marks", e);
        setLoadError("Failed to load marks.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  const handleDownloadPDF = () => {
    const reportWindow = window.open();
    reportWindow.document.write(`
      <html>
        <head><title>Marks Report - ${user?.full_name}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Marks Report</h1>
          <p>Student: ${user?.full_name || "Unknown"}</p>
          <p>USN: ${user?.usn || "Not assigned"}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <hr>
          <h2>Marks Records (${marks.length})</h2>
          <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
              <th>Subject</th>
              <th>Type</th>
              <th>Semester</th>
              <th>Marks</th>
              <th>Percentage</th>
            </tr>
            ${marks.slice(0, 50).map(m => {
              const percent = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
              return `
                <tr>
                  <td>${m.subject || "Unknown"}</td>
                  <td>${m.marks_type || "N/A"}</td>
                  <td>${m.semester || "N/A"}</td>
                  <td>${m.marks_obtained}/${m.max_marks}</td>
                  <td>${percent}%</td>
                </tr>
              `;
            }).join('')}
          </table>
          <hr>
          <p>Total Records: ${marks.length}</p>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const handleDownloadExcel = () => {
    const csvData = [
      ["Subject", "Type", "Semester", "Marks Obtained", "Max Marks", "Percentage"],
      ...marks.map(m => {
        const percent = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
        return [m.subject, m.marks_type, m.semester, m.marks_obtained, m.max_marks, percent];
      })
    ];
    
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marks-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAnalyzePerformance = () => {
    if (marks.length === 0) {
      alert("No marks data available for analysis");
      return;
    }

    const average = marks.reduce((sum, m) => {
      const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
      return sum + percent;
    }, 0) / marks.length;

    const bestSubject = marks.reduce((best, m) => {
      const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
      return percent > best.percent ? { subject: m.subject, percent } : best;
    }, { subject: "None", percent: 0 });

    const worstSubject = marks.reduce((worst, m) => {
      const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
      return percent < worst.percent ? { subject: m.subject, percent } : worst;
    }, { subject: "None", percent: 100 });

    alert(`Performance Analysis:\n\n` +
          `Average Score: ${average.toFixed(1)}%\n` +
          `Best Subject: ${bestSubject.subject} (${bestSubject.percent.toFixed(1)}%)\n` +
          `Weakest Subject: ${worstSubject.subject} (${worstSubject.percent.toFixed(1)}%)\n\n` +
          `Recommendation: Focus on improving ${worstSubject.subject}`);
  };

  const filteredMarks = marks.filter(mark => {
    if (filterSubject !== "all" && mark.subject !== filterSubject) return false;
    if (filterType !== "all" && mark.marks_type !== filterType) return false;
    return true;
  });

  const subjects = [...new Set(marks.map(m => m.subject))];
  const types = [...new Set(marks.map(m => m.marks_type))];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Marks Details
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
              Track your academic performance and test scores
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-slate-300'}`}
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              onClick={handleAnalyzePerformance}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition text-sm font-medium"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">
                Marks Trend
              </h4>
              <p className={`text-sm opacity-75 mt-1`}>
                Test-wise performance percentage
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded hover:bg-gray-700 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                Not enough data to show chart yet.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                  <XAxis
                    dataKey="label"
                    angle={-30}
                    textAnchor="end"
                    height={60}
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
                    formatter={(v) => [`${v}%`, 'Marks']}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    } : {}}
                  />
                  <Bar
                    dataKey="percentage"
                    name="Marks %"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Table */}
        <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold">
                Marks Records ({filteredMarks.length})
              </h4>
              <p className={`text-sm opacity-75 mt-1`}>
                Showing {filterSubject !== "all" ? filterSubject : "all subjects"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Download PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadExcel}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Download Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
              <button
                onClick={() => alert("Generate performance insights report")}
                className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-slate-100'}`}
                title="Insights"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadError && (
            <div className={`text-sm rounded-xl px-3 py-2 mb-4 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
              <p className="mt-2 text-sm opacity-75">Loading marks...</p>
            </div>
          ) : filteredMarks.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p className="text-sm opacity-75">
                {filterSubject !== "all" || filterType !== "all" 
                  ? "No records match your filters"
                  : "No marks records available."}
              </p>
              {(filterSubject !== "all" || filterType !== "all") && (
                <button 
                  onClick={() => {
                    setFilterSubject("all");
                    setFilterType("all");
                  }}
                  className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Sem</th>
                    <th className="py-2 px-3">Marks</th>
                    <th className="py-2 px-3">%</th>
                    <th className="py-2 px-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarks.map((m) => {
                    const percent = m.max_marks > 0
                      ? Math.round((m.marks_obtained / m.max_marks) * 100)
                      : 0;
                    const grade = percent >= 90 ? 'A+' :
                                 percent >= 80 ? 'A' :
                                 percent >= 70 ? 'B' :
                                 percent >= 60 ? 'C' :
                                 percent >= 50 ? 'D' : 'F';
                    
                    const gradeColor = percent >= 60 
                      ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                      : darkMode ? 'text-red-400' : 'text-red-600';

                    return (
                      <tr
                        key={m.id}
                        className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'} transition`}
                      >
                        <td className="py-2 px-3 font-medium">
                          {m.subject}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            darkMode ? 'bg-gray-700' : 'bg-slate-100'
                          }`}>
                            {m.marks_type}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          Sem {m.semester}
                        </td>
                        <td className="py-2 px-3">
                          {m.marks_obtained}/{m.max_marks}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {percent}%
                        </td>
                        <td className={`py-2 px-3 font-bold ${gradeColor}`}>
                          {grade}
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

      {/* Statistics */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <h4 className="font-semibold mb-4">
          Marks Statistics
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredMarks.length > 0 
                ? Math.round(filteredMarks.reduce((sum, m) => {
                    const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
                    return sum + percent;
                  }, 0) / filteredMarks.length)
                : 0}%
            </div>
            <div className="text-sm opacity-75">Average %</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredMarks.filter(m => {
                const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
                return percent >= 60;
              }).length}
            </div>
            <div className="text-sm opacity-75">Passed</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredMarks.filter(m => {
                const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
                return percent >= 80;
              }).length}
            </div>
            <div className="text-sm opacity-75">Excellent</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
            <div className="text-2xl font-bold mb-1">
              {filteredMarks.filter(m => {
                const percent = m.max_marks > 0 ? (m.marks_obtained / m.max_marks) * 100 : 0;
                return percent < 40;
              }).length}
            </div>
            <div className="text-sm opacity-75">Need Help</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentCirculars({ darkMode }) {
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTarget, setFilterTarget] = useState("all");
  const [selectedCircular, setSelectedCircular] = useState(null);

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
    alert(`Circular marked as read (ID: ${id})`);
  };

  const handleDownloadAttachment = (circular) => {
    if (circular.file_url) {
      alert(`Downloading attachment: ${circular.title}\n\nURL: ${API_BASE_URL}${circular.file_url}`);
    } else {
      alert("No attachment available for this circular");
    }
  };

  const handleShareCircular = (circular) => {
    if (navigator.share) {
      navigator.share({
        title: circular.title,
        text: circular.content.substring(0, 100) + '...',
        url: window.location.href
      });
    } else {
      alert(`Share: ${circular.title}\n\n${circular.content.substring(0, 200)}...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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
              <option value="students">Students Only</option>
              <option value="mentors">Mentors Only</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className={`text-sm rounded-xl px-3 py-2 ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>
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
              className="text-sm text-emerald-400 hover:text-emerald-300 mt-2"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Circulars List */}
          <div className="grid gap-4">
            {filteredCirculars.map((c) => (
              <article
                key={c.id}
                className={`p-5 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">
                      {c.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        c.target_audience === 'all' ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700') :
                        c.target_audience === 'students' ? (darkMode ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700') :
                        (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700')
                      }`}>
                        {c.target_audience}
                      </span>
                      <span className="text-[11px] opacity-60">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMarkAsRead(c.id)}
                      className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-slate-200'}`}
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadAttachment(c)}
                      className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-slate-200'}`}
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareCircular(c)}
                      className={`p-1.5 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-slate-200'}`}
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm opacity-75 whitespace-pre-wrap mb-3">
                  {c.content}
                </p>

                {c.file_url && (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleDownloadAttachment(c)}
                      className="inline-flex items-center text-xs font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      📎 Download attachment
                    </button>
                    <button
                      onClick={() => setSelectedCircular(selectedCircular === c.id ? null : c.id)}
                      className="text-xs opacity-75 hover:opacity-100"
                    >
                      {selectedCircular === c.id ? "Show less" : "Read more"}
                    </button>
                  </div>
                )}

                {selectedCircular === c.id && (
                  <div className="mt-3 p-3 rounded-lg bg-black/5">
                    <p className="text-xs opacity-75">
                      {c.content}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Statistics */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <h4 className="font-semibold mb-4">
              Circular Statistics
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {filteredCirculars.length}
                </div>
                <div className="text-sm opacity-75">Total</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {filteredCirculars.filter(c => c.target_audience === 'students' || c.target_audience === 'all').length}
                </div>
                <div className="text-sm opacity-75">For Students</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {filteredCirculars.filter(c => c.file_url).length}
                </div>
                <div className="text-sm opacity-75">With Attachments</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {filteredCirculars.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm opacity-75">Last 7 Days</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StudentTimeline({ darkMode }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getStudentTimeline();
        setTimeline(data || []);
      } catch (e) {
        console.error("Failed to load timeline");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddEvent = () => {
    const title = prompt("Enter event title:");
    const description = prompt("Enter event description:");
    if (title && description) {
      const newEvent = {
        id: Date.now(),
        title,
        description,
        timestamp: new Date().toISOString(),
        type: "custom"
      };
      setTimeline(prev => [newEvent, ...prev]);
      alert("Event added to timeline!");
    }
  };

  const handleClearTimeline = () => {
    if (window.confirm("Clear all timeline events?")) {
      setTimeline([]);
    }
  };

  return (
    <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">
            Activity Timeline
          </h3>
          <p className={`text-sm opacity-75 mt-1`}>
            Track your academic activities and important events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddEvent}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition text-sm font-medium"
          >
            Add Event
          </button>
          <button
            onClick={handleClearTimeline}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Clear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className="mt-2 text-sm opacity-75">Loading timeline...</p>
        </div>
      ) : timeline.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p className="text-sm opacity-75">No recent activity.</p>
          <button
            onClick={handleAddEvent}
            className="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
          >
            Add your first event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {timeline.map((item, idx) => (
            <div key={item.id || idx} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.type === "notification" ? (darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
                  item.type === "feedback" ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600') :
                  item.type === "marks" ? (darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600') :
                  item.type === "attendance" ? (darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600') :
                  (darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-slate-100 text-slate-600')
                }`}>
                  {item.type === "notification" ? "🔔" :
                   item.type === "feedback" ? "💬" :
                   item.type === "marks" ? "📊" :
                   item.type === "attendance" ? "📝" :
                   "⭐"}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">
                    {item.title}
                  </div>
                  <span className="text-xs opacity-60">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm opacity-75 mb-2">
                  {item.description}
                </div>
                <div className="text-[10px] opacity-40">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentAcademicHistory({ darkMode }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getAcademicHistory();
        setHistory(data || []);
      } catch (e) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDownloadHistory = () => {
    const reportWindow = window.open();
    reportWindow.document.write(`
      <html>
        <head><title>Academic History Report</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Academic History Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <hr>
          <h2>Semester-wise Performance</h2>
          <table border="1" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0;">
              <th>Semester</th>
              <th>Subjects</th>
              <th>Average %</th>
              <th>Status</th>
            </tr>
            ${history.map(h => `
              <tr>
                <td>${h.semester}</td>
                <td>${h.subjects_count}</td>
                <td>${h.average_percentage}%</td>
                <td>${h.average_percentage >= 60 ? 'PASS' : 'FAIL'}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const handleAnalyzeProgress = () => {
    if (history.length === 0) {
      alert("No academic history available");
      return;
    }

    const progress = history.map((h, i) => {
      if (i === 0) return { semester: h.semester, change: 0 };
      const change = h.average_percentage - history[i-1].average_percentage;
      return { semester: h.semester, change };
    });

    const improvement = progress.filter(p => p.change > 0).length;
    const decline = progress.filter(p => p.change < 0).length;

    alert(`Academic Progress Analysis:\n\n` +
          `Semesters Completed: ${history.length}\n` +
          `Improvement Trend: ${improvement} semester(s)\n` +
          `Decline Trend: ${decline} semester(s)\n\n` +
          `Overall Performance: ${history[history.length-1]?.average_percentage || 0}%`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Academic History
            </h3>
            <p className={`text-sm opacity-75 mt-1`}>
              Semester-wise performance and progress tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadHistory}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition text-sm font-medium"
            >
              Download Report
            </button>
            <button
              onClick={handleAnalyzeProgress}
              className="px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              Analyze Progress
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className={`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] ${darkMode ? 'text-gray-600' : 'text-slate-300'}`} />
          <p className="mt-2 text-sm opacity-75">Loading academic history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto opacity-50 mb-3" />
          <p className="text-sm opacity-75">No academic history available.</p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="semester" 
                    tickFormatter={(v) => `Sem ${v}`}
                    stroke={darkMode ? '#9ca3af' : '#64748b'}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={darkMode ? '#9ca3af' : '#64748b'}
                    fontSize={12}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Average']}
                    contentStyle={darkMode ? { 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    } : {}}
                  />
                  <Bar 
                    dataKey="average_percentage" 
                    name="Average %" 
                    fill="#8b5cf6" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <h4 className="font-semibold mb-4">
              Semester Details ({history.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className={`text-left border-b ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
                    <th className="py-3 px-3">Semester</th>
                    <th className="py-3 px-3">Subjects</th>
                    <th className="py-3 px-3">Average %</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr
                      key={h.semester}
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-slate-100 hover:bg-slate-50'} transition`}
                    >
                      <td className="py-2 px-3 font-medium">
                        Semester {h.semester}
                      </td>
                      <td className="py-2 px-3">
                        {h.subjects_count}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`font-medium ${
                          h.average_percentage >= 60 
                            ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                            : darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {h.average_percentage}%
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          h.average_percentage >= 60 
                            ? darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            : darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                        }`}>
                          {h.average_percentage >= 60 ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => alert(`View detailed report for Semester ${h.semester}`)}
                          className={`text-xs ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className={`rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-5 border ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
            <h4 className="font-semibold mb-4">
              Academic Summary
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {history.length}
                </div>
                <div className="text-sm opacity-75">Semesters</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {history.reduce((sum, h) => sum + h.subjects_count, 0)}
                </div>
                <div className="text-sm opacity-75">Total Subjects</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {history.length > 0 
                    ? Math.round(history.reduce((sum, h) => sum + h.average_percentage, 0) / history.length)
                    : 0}%
                </div>
                <div className="text-sm opacity-75">Overall Average</div>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-slate-50'}`}>
                <div className="text-2xl font-bold mb-1">
                  {history.filter(h => h.average_percentage >= 60).length}
                </div>
                <div className="text-sm opacity-75">Passed</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* --------------- Helpers --------------- */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString();
}

function buildAttendanceChartData(records) {
  if (!records || records.length === 0) return [];

  const byMonth = {};
  for (const r of records) {
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[key]) {
      byMonth[key] = { present: 0, total: 0 };
    }
    byMonth[key].total += 1;
    if (r.status === "present") {
      byMonth[key].present += 1;
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => {
      const [year, month] = key.split("-");
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const label = dateObj.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const percentage = value.total > 0 ? Math.round((value.present / value.total) * 100) : 0;
      return { month: label, percentage };
    });
}

function buildMarksChartData(marks) {
  if (!marks || marks.length === 0) return [];
  return marks.map((m) => {
    const label = `${m.subject} ${m.marks_type}`;
    const percentage = m.max_marks > 0 ? Math.round((m.marks_obtained / m.max_marks) * 100) : 0;
    return { label, percentage };
  });
}