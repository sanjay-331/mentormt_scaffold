import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import api from '../../services/api';

export default function AppointmentModal({ isOpen, onClose, onBook, services }) {
  const [mentor, setMentor] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    if (isOpen) {
        api.get('/api/users?role=mentor')
           .then(res => setMentors(res.data || []))
           .catch(err => console.error("Failed to fetch mentors", err));
    } else {
        setMentor('');
        setDate('');
        setReason('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (mentor && date && reason) {
      onBook({ mentor, date, reason });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Book Appointment"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mentor || !date || !reason}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Book Appointment
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Recipient (Mentor)
          </label>
          <select
            value={mentor}
            onChange={(e) => setMentor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          >
            <option value="">Select a mentor...</option>
            {mentors.map(m => (
                <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition resize-none"
            placeholder="Briefly explain the reason..."
          />
        </div>
      </div>
    </Modal>
  );
}
