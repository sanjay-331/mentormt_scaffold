import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, Save, X } from 'lucide-react';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../services/subjects';
import { useNotification } from '../hooks/useNotification';

export default function SubjectManagement({ user, isOpen, onClose }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    semester: "",
    credits: 3,
    department: ""
  });
  
  const { notify } = useNotification();

  useEffect(() => {
    if (isOpen && user) {
      // Initialize form with user's department if available
      setFormData(prev => ({ ...prev, department: user.department || "" }));
      loadSubjects();
    }
  }, [isOpen, user]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      // Fetch all subjects for the mentor's department (if they have one)
      // Otherwise fetch all (or let backend filter)
      const data = await getSubjects(user?.department, null);
      setSubjects(data);
    } catch (e) {
      console.error("Failed to load subjects", e);
      setError("Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' || name === 'credits' ? parseInt(value) || "" : value
    }));
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      semester: "",
      credits: 3,
      department: user?.department || ""
    });
    setIsEditing(false);
    setCurrentSubject(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && currentSubject) {
        await updateSubject(currentSubject.id, formData);
        notify("Subject Updated", { body: `${formData.code} updated successfully` });
      } else {
        await createSubject(formData);
        notify("Subject Created", { body: `${formData.code} created successfully` });
      }
      resetForm();
      loadSubjects();
    } catch (e) {
        console.error(e);
        const msg = e.response?.data?.detail || "Operation failed";
        notify("Error", { body: msg, type: "error" });
    }
  };

  const handleEdit = (subject) => {
    setIsEditing(true);
    setCurrentSubject(subject);
    setFormData({
        code: subject.code,
        name: subject.name,
        semester: subject.semester,
        credits: subject.credits,
        department: subject.department
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      notify("Subject Deleted", { type: "success" });
      loadSubjects();
    } catch (e) {
      notify("Delete Failed", { body: "Could not delete subject", type: "error" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-gray-700">
          <div>
             <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-500" />
                Subject Management
             </h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage academic subjects for {user?.department || "your department"}
             </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Sidebar Form */}
            <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isEditing ? "Edit Subject" : "Add New Subject"}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Code</label>
                        <input 
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="e.g. CS401"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subject Name</label>
                        <input 
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Database Systems"
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                            <input 
                                type="number"
                                name="semester"
                                value={formData.semester}
                                onChange={handleInputChange}
                                min="1" max="8"
                                className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Credits</label>
                            <input 
                                type="number"
                                name="credits"
                                value={formData.credits}
                                onChange={handleInputChange}
                                min="0" max="10"
                                className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                        <input 
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            className="w-full rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>

                    <div className="pt-2 flex gap-2">
                        <button 
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isEditing ? "Update" : "Save"}
                        </button>
                        {isEditing && (
                            <button 
                                type="button"
                                onClick={resetForm}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List View */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Existing Subjects</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                        {subjects.length} Subjects
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading subjects...</p>
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No subjects found</p>
                        <p className="text-sm text-gray-400">Add a subject from the sidebar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {subjects.map((sub) => (
                            <div key={sub.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700/50 border border-slate-200 dark:border-gray-700 rounded-xl hover:shadow-md transition group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.code}</span>
                                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{sub.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span>Sem {sub.semester}</span>
                                        <span>•</span>
                                        <span>{sub.department}</span>
                                        <span>•</span>
                                        <span>{sub.credits} Credits</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(sub)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                        title="Edit"
                                        >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(sub.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
