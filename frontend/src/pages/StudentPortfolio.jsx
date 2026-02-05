import React, { useEffect, useState } from "react";
import {
  getCertifications, addCertification, verifyCertification,
  getProjects, addProject,
  getLetters, submitLetter, replyToLetter,
  getSports, addSports,
  getCultural, addCultural,
  getPlacementAnalysis
} from "../services/portfolio";
import {
  Award, Briefcase, FileText, Activity, TrendingUp, Plus, Trash2, CheckCircle, AlertCircle, Loader, MessageSquare
} from "lucide-react";

export default function StudentPortfolio({ darkMode, user, role = "student" }) {
  const [activeTab, setActiveTab] = useState("analysis");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // Data lists
  const [certs, setCerts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [letters, setLetters] = useState([]);
  const [sports, setSports] = useState([]);
  const [cultural, setCultural] = useState([]);

  // Load data
  useEffect(() => {
    loadAllData();
  }, [user?.id]);

  async function loadAllData() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [aData, cData, pData, lData, sData, cuData] = await Promise.all([
        getPlacementAnalysis(user.id).catch(() => null),
        getCertifications(user.id),
        getProjects(user.id),
        getLetters(user.id),
        getSports(user.id),
        getCultural(user.id)
      ]);
      setAnalysis(aData);
      setCerts(cData || []);
      setProjects(pData || []);
      setLetters(lData || []);
      setSports(sData || []);
      setCultural(cuData || []);
    } catch (e) {
      console.error("Failed to load portfolio data", e);
    } finally {
      setLoading(false);
    }
  }

  const isMentor = role === "mentor" || role === "admin";

  return (
    <div className="space-y-6">
      {/* Navigation Sub-tabs */}
      <div className={`rounded-xl p-2 flex gap-2 overflow-x-auto ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm border border-slate-200'}`}>
        {[
          { id: 'analysis', label: 'AI Analysis', icon: TrendingUp },
          { id: 'certs', label: 'Certifications', icon: Award },
          { id: 'projects', label: 'Projects', icon: Briefcase },
          { id: 'letters', label: 'Letters', icon: FileText },
          { id: 'activities', label: 'Activities', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? (darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800')
                : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-slate-50 text-slate-600')
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <Loader className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'analysis' && <AnalysisView analysis={analysis} darkMode={darkMode} refresh={loadAllData} isMentor={isMentor} />}
          {activeTab === 'certs' && <CertificationsView data={certs} refresh={loadAllData} darkMode={darkMode} isMentor={isMentor} />}
          {activeTab === 'projects' && <ProjectsView data={projects} refresh={loadAllData} darkMode={darkMode} isMentor={isMentor} />}
          {activeTab === 'letters' && <LettersView data={letters} refresh={loadAllData} darkMode={darkMode} isMentor={isMentor} />}
          {activeTab === 'activities' && <ActivitiesView sports={sports} cultural={cultural} refresh={loadAllData} darkMode={darkMode} isMentor={isMentor} />}
        </>
      )}
    </div>
  );
}

// --- Sub Components ---

function AnalysisView({ analysis, darkMode, refresh, isMentor }) {
  if (!analysis) return <div className="p-4 opacity-75">Analysis not generated yet. Interaction needed.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Prediction Card */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
         <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Placement Prediction
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                analysis.eligibility_status.includes('Not') 
                ? 'bg-red-500/20 text-red-500' 
                : 'bg-emerald-500/20 text-emerald-500'
            }`}>
                {analysis.eligibility_status}
            </span>
         </div>
         
         <div className="flex items-center justify-center my-6">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-4 border-emerald-500/30">
                <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.placement_probability}%</div>
                    <div className="text-xs opacity-75">Probability</div>
                </div>
            </div>
         </div>
         
         <div className="space-y-3">
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
                <div className="text-xs opacity-75 mb-1">Composite Score</div>
                <div className="font-semibold">{analysis.composite_score} / 100</div>
            </div>
            <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-slate-50'}`}>
                <div className="text-xs opacity-75 mb-1">Predicted Role</div>
                <div className="font-semibold text-emerald-500">{analysis.predicted_role}</div>
            </div>
         </div>
      </div>

      {/* Risk & Improvement */}
      <div className="space-y-6">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} shadow-sm`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Areas for Improvement
            </h3>
            {analysis.improvement_areas.length === 0 ? (
                <div className="text-sm opacity-75">No specific warnings. Keep up the good work!</div>
            ) : (
                <ul className="space-y-2">
                    {analysis.improvement_areas.map((area, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {area}
                        </li>
                    ))}
                </ul>
            )}
        </div>
        
        <button onClick={refresh} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:opacity-90 transition shadow-lg">
            Refresh Analysis
        </button>
      </div>
    </div>
  );
}

function CertificationsView({ data, refresh, darkMode, isMentor }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ certificate_name: "", platform: "", completion_date: "", skill_category: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addCertification(form);
            setShowForm(false);
            setForm({ certificate_name: "", platform: "", completion_date: "", skill_category: "" });
            refresh();
        } catch (err) { alert("Failed to add certification"); }
    };

    const handleVerify = async (id) => {
        if (!window.confirm("Verify this certificate?")) return;
        try {
            await verifyCertification(id);
            refresh();
        } catch (err) { alert("Failed to verify"); }
    };

    return (
        <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} p-6`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Certifications ({data.length})</h3>
                {!isMentor && (
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                )}
            </div>

            {showForm && !isMentor && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 grid gap-4 md:grid-cols-2">
                    <input placeholder="Certificate Name" className={inputClass(darkMode)} required 
                        value={form.certificate_name} onChange={e => setForm({...form, certificate_name: e.target.value})} />
                    <input placeholder="Platform (e.g. Coursera)" className={inputClass(darkMode)} required 
                        value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} />
                    <input placeholder="Skill Category" className={inputClass(darkMode)} required 
                        value={form.skill_category} onChange={e => setForm({...form, skill_category: e.target.value})} />
                    <input type="date" className={inputClass(darkMode)} required 
                        value={form.completion_date} onChange={e => setForm({...form, completion_date: e.target.value})} />
                    <button type="submit" className="md:col-span-2 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Save</button>
                </form>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {data.map(cert => (
                    <div key={cert.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-semibold">{cert.certificate_name}</div>
                                <div className="text-sm opacity-75">{cert.platform} • {cert.skill_category}</div>
                                <div className="text-xs opacity-50 mt-2">Completed: {cert.completion_date}</div>
                            </div>
                            <div>
                                {cert.is_verified ? (
                                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium bg-emerald-500/10 px-2 py-1 rounded">
                                        <CheckCircle className="w-3 h-3" /> Verified ({cert.verified_by})
                                    </span>
                                ) : isMentor ? (
                                    <button onClick={() => handleVerify(cert.id)} className="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600">
                                        Verify
                                    </button>
                                ) : (
                                    <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Pending</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProjectsView({ data, refresh, darkMode, isMentor }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", role: "", project_type: "Mini", tech_stack: "" });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addProject({ ...form, tech_stack: form.tech_stack.split(',').map(s => s.trim()) });
            setShowForm(false);
            setForm({ title: "", description: "", role: "", project_type: "Mini", tech_stack: "" });
            refresh();
        } catch (err) { alert("Failed to add project"); }
    };

    return (
        <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} p-6`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Projects ({data.length})</h3>
                {!isMentor && (
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                        <Plus className="w-4 h-4" /> Add New
                    </button>
                )}
            </div>

            {showForm && !isMentor && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 grid gap-4">
                    <input placeholder="Project Title" className={inputClass(darkMode)} required 
                        value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                    <textarea placeholder="Description" className={inputClass(darkMode)} required 
                        value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <input placeholder="Role (e.g. Lead)" className={inputClass(darkMode)} required 
                            value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
                        <select className={inputClass(darkMode)} value={form.project_type} onChange={e => setForm({...form, project_type: e.target.value})}>
                            <option value="Mini">Mini Project</option>
                            <option value="Major">Major Project</option>
                            <option value="Hackathon">Hackathon</option>
                            <option value="Personal">Personal</option>
                        </select>
                    </div>
                    <input placeholder="Tech Stack (comma separated)" className={inputClass(darkMode)} 
                        value={form.tech_stack} onChange={e => setForm({...form, tech_stack: e.target.value})} />
                    <button type="submit" className="py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Save Project</button>
                </form>
            )}

            <div className="space-y-4">
                {data.map(p => (
                    <div key={p.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-slate-100 bg-slate-50'}`}>
                        <div className="flex justify-between items-start">
                             <div className="font-semibold text-lg">{p.title}</div>
                             <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">{p.project_type}</span>
                        </div>
                        <p className="text-sm opacity-75 mt-1">{p.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {p.tech_stack.map((t, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/20 opacity-75">{t}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function LettersView({ data, refresh, darkMode, isMentor }) {
     const [showForm, setShowForm] = useState(false);
     const [form, setForm] = useState({ letter_type: "Apology", reason: "", content: "" });
     
     const [replyId, setReplyId] = useState(null);
     const [replyForm, setReplyForm] = useState({ response: "", status: "accepted" });
 
     const handleSubmit = async (e) => {
         e.preventDefault();
         try {
             await submitLetter(form);
             setShowForm(false);
             setForm({ letter_type: "Apology", reason: "", content: "" });
             refresh();
         } catch (err) { alert("Failed to submit letter"); }
     };

     const handleReply = async (e) => {
        e.preventDefault();
         try {
             await replyToLetter(replyId, replyForm);
             setReplyId(null);
             setReplyForm({ response: "", status: "accepted" });
             refresh();
         } catch (err) { alert("Failed to reply"); }
     }
 
     return (
         <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} p-6`}>
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg">Apology / Explanation Letters</h3>
                 {!isMentor && (
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                        <Plus className="w-4 h-4" /> Write New
                    </button>
                 )}
             </div>
 
             {showForm && !isMentor && (
                 <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 grid gap-4">
                     <select className={inputClass(darkMode)} value={form.letter_type} onChange={e => setForm({...form, letter_type: e.target.value})}>
                         <option value="Apology">Apology Letter</option>
                         <option value="Explanation">Explanation</option>
                         <option value="Improvement">Improvement Plan</option>
                     </select>
                     <input placeholder="Reason / Subject" className={inputClass(darkMode)} required 
                         value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} />
                     <textarea placeholder="Write your content here..." rows={4} className={inputClass(darkMode)} required 
                         value={form.content} onChange={e => setForm({...form, content: e.target.value})} />
                     <button type="submit" className="py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Submit Letter</button>
                 </form>
             )}
 
             <div className="space-y-4">
                 {data.map(l => (
                     <div key={l.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/50' : 'border-slate-100 bg-slate-50'}`}>
                         <div className="flex justify-between">
                             <div className="font-semibold">{l.letter_type}: {l.reason}</div>
                             <div className="text-xs opacity-50">{new Date(l.submitted_date).toLocaleDateString()}</div>
                         </div>
                         <p className="text-sm opacity-75 mt-2 whitespace-pre-wrap">{l.content}</p>
                         
                         {l.mentor_response && (
                            <div className="mt-3 p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-sm">
                                <span className="font-bold text-emerald-500">Mentor Response:</span> {l.mentor_response}
                            </div>
                         )}
                         
                         <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs uppercase tracking-wide opacity-50 font-bold">Status: {l.status}</span>
                            {isMentor && !l.mentor_response && (
                                <button onClick={() => setReplyId(l.id)} className="text-xs text-blue-500 hover:underline">Reply</button>
                            )}
                         </div>

                         {replyId === l.id && (
                             <form onSubmit={handleReply} className="mt-3 p-3 rounded border border-gray-600 bg-gray-800/50">
                                 <textarea placeholder="Your response..." className={inputClass(darkMode) + " mb-2"} required
                                    value={replyForm.response} onChange={e => setReplyForm({...replyForm, response: e.target.value})} />
                                 <div className="flex justify-between">
                                     <select className={inputClass(darkMode) + " w-1/2"} value={replyForm.status} onChange={e => setReplyForm({...replyForm, status: e.target.value})}>
                                         <option value="accepted">Accept</option>
                                         <option value="rejected">Reject</option>
                                     </select>
                                     <div className="flex gap-2">
                                        <button type="button" onClick={() => setReplyId(null)} className="text-xs opacity-75 hover:opacity-100">Cancel</button>
                                        <button type="submit" className="text-xs bg-emerald-500 text-white px-3 py-1 rounded">Send</button>
                                     </div>
                                 </div>
                             </form>
                         )}
                     </div>
                 ))}
             </div>
         </div>
     );
}

function ActivitiesView({ sports, cultural, refresh, darkMode, isMentor }) {
    // Simplified single form for demo, ideally two forms
    const [type, setType] = useState('sports'); // sports | cultural
    const [form, setForm] = useState({ name: "", role: "", level: "", achievements: "" });
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (type === 'sports') {
                await addSports({ sport_name: form.name, role: form.role, level: form.level, achievements: form.achievements });
            } else {
                await addCultural({ activity_name: form.name, activity_type: form.level, role: form.role, achievements: form.achievements });
            }
            setShowForm(false);
            setForm({ name: "", role: "", level: "", achievements: "" });
            refresh();
        } catch (err) { alert("Failed to add activity"); }
    };

    return (
        <div className={`rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} p-6`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Sports & Cultural Activities</h3>
                {!isMentor && (
                    <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 text-sm text-emerald-500 hover:text-emerald-400 font-medium">
                        <Plus className="w-4 h-4" /> Add Activity
                    </button>
                )}
            </div>

            {showForm && !isMentor && (
                 <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 grid gap-4">
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={type === 'sports'} onChange={() => setType('sports')} /> Sports
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" checked={type === 'cultural'} onChange={() => setType('cultural')} /> Cultural
                        </label>
                     </div>
                     <input placeholder={type === 'sports' ? "Sport Name" : "Activity Name"} className={inputClass(darkMode)} required 
                         value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                     <input placeholder={type === 'sports' ? "Level (e.g. State)" : "Type (e.g. Dance)"} className={inputClass(darkMode)} required 
                         value={form.level} onChange={e => setForm({...form, level: e.target.value})} />
                     <input placeholder="Role (e.g. Captain / Participant)" className={inputClass(darkMode)} 
                         value={form.role} onChange={e => setForm({...form, role: e.target.value})} />
                     <input placeholder="Achievements / Awards" className={inputClass(darkMode)} 
                         value={form.achievements} onChange={e => setForm({...form, achievements: e.target.value})} />
                     <button type="submit" className="py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Save Activity</button>
                 </form>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <h4 className="font-semibold mb-3 border-b pb-2 opacity-75">Sports</h4>
                    <div className="space-y-3">
                        {sports.map(s => (
                            <div key={s.id} className="text-sm">
                                <div className="font-medium">{s.sport_name} ({s.level})</div>
                                <div className="opacity-75">{s.role} {s.achievements && `• ${s.achievements}`}</div>
                            </div>
                        ))}
                         {sports.length === 0 && <div className="text-xs opacity-50 italic">No sports added.</div>}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-3 border-b pb-2 opacity-75">Cultural</h4>
                    <div className="space-y-3">
                        {cultural.map(c => (
                            <div key={c.id} className="text-sm">
                                <div className="font-medium">{c.activity_name} ({c.activity_type})</div>
                                <div className="opacity-75">{c.role} {c.achievements && `• ${c.achievements}`}</div>
                            </div>
                        ))}
                         {cultural.length === 0 && <div className="text-xs opacity-50 italic">No cultural activities added.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function inputClass(darkMode) {
    return `w-full px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        darkMode 
        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' 
        : 'bg-white border-slate-300 text-gray-900 placeholder-slate-400'
    }`;
}
