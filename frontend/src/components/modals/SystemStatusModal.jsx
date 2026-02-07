import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { CheckCircle, AlertCircle, Server, Database, Activity, Clock } from 'lucide-react';

export default function SystemStatusModal({ isOpen, onClose }) {
  const [statuses, setStatuses] = useState([
    { name: 'API Server', status: 'checking', icon: Server },
    { name: 'Database Connection', status: 'checking', icon: Database },
    { name: 'Third-party Services', status: 'checking', icon: Activity },
    { name: 'Job Scheduler', status: 'checking', icon: Clock },
  ]);

  useEffect(() => {
    if (isOpen) {
      // Simulate checking statuses
      const timers = statuses.map((_, index) => 
        setTimeout(() => {
          setStatuses(prev => prev.map((s, i) => 
            i === index ? { ...s, status: 'operational' } : s
          ));
        }, (index + 1) * 800)
      );
      return () => timers.forEach(clearTimeout);
    } else {
        // Reset on close
        setStatuses(prev => prev.map(s => ({...s, status: 'checking'})));
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System Diagnostics"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          Close
        </button>
      }
    >
      <div className="space-y-4">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2">
                {item.status === 'checking' && (
                    <span className="flex items-center text-amber-500 text-sm animate-pulse">
                        <Activity className="w-4 h-4 mr-1" /> Checking...
                    </span>
                )}
                {item.status === 'operational' && (
                    <span className="flex items-center text-emerald-500 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Operational
                    </span>
                )}
            </div>
          </div>
        ))}
        
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Last checked:</span>
                <span>{new Date().toLocaleTimeString()}</span>
            </div>
             <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>Server Uptime:</span>
                <span>99.98%</span>
            </div>
        </div>
      </div>
    </Modal>
  );
}
