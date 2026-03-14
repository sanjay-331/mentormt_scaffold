import React from "react";
import { X, User } from "lucide-react";
import StudentPortfolio from "../../pages/StudentPortfolio";

export default function PortfolioModal({ isOpen, onClose, darkMode, student }) {
  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <User className="w-6 h-6" />
             </div>
             <div>
                <h3 className="font-bold text-lg">{student.full_name}'s Portfolio</h3>
                <p className="text-xs opacity-60 uppercase tracking-wider">{student.usn} • Semester {student.semester}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          <StudentPortfolio darkMode={darkMode} user={student} role="mentor" />
        </div>

        <div className={`p-4 border-t flex justify-end ${darkMode ? 'border-gray-700' : 'border-slate-100'}`}>
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
