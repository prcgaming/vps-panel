import React, { useEffect, useState } from 'react';
import { FileText, RefreshCw, Activity } from 'lucide-react';
import { api } from '../api/client';
import { ActivityLog } from '../types';

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    api.getLogs()
      .then((res) => setLogs(res.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Activity & Audit Logs</h2>
          <p className="text-sm text-slate-400 mt-1">
            Immutable security event tracking and lifecycle audit history across all cluster nodes
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 self-start"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Event Action</th>
                <th className="py-3.5 px-4">Actor / User</th>
                <th className="py-3.5 px-6">Event Details</th>
                <th className="py-3.5 px-4">Client IP</th>
                <th className="py-3.5 px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-6 font-mono font-semibold text-cyan-400">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    {log.user_name || log.user_email || 'System'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-300">
                    {log.details || '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {log.ip_address || '—'}
                  </td>
                  <td className="py-3.5 px-6 text-right text-slate-400 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
