import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Terminal as TermIcon, 
  Power, 
  RotateCcw, 
  Trash2, 
  RefreshCw,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Key
} from 'lucide-react';
import { api } from '../api/client';
import { VpsInstance } from '../types';

interface VpsListPageProps {
  onOpenConsole: (vps: VpsInstance) => void;
  onOpenCreateVps: () => void;
}

export const VpsListPage: React.FC<VpsListPageProps> = ({ onOpenConsole, onOpenCreateVps }) => {
  const [instances, setInstances] = useState<VpsInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchVps = () => {
    api.getVpsList()
      .then((res) => setInstances(res.instances || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVps();
    const interval = setInterval(fetchVps, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: string, payload?: any) => {
    setActionLoading(`${id}-${action}`);
    try {
      await api.actionVps(id, action, payload);
      fetchVps();
    } catch (err: any) {
      alert(err.message || `Failed to execute ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently terminate ${name}? This will destroy all data.`)) return;
    try {
      await api.deleteVps(id);
      fetchVps();
    } catch (err: any) {
      alert(err.message || 'Failed to terminate VPS');
    }
  };

  const filtered = instances.filter((vps) => {
    const matchesSearch = 
      vps.name.toLowerCase().includes(search.toLowerCase()) ||
      vps.hostname.toLowerCase().includes(search.toLowerCase()) ||
      vps.ip_address.includes(search);
    const matchesStatus = filterStatus === 'all' || vps.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Virtual Private Servers</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage provisioned virtual machines across your multi-node hypervisor cluster
          </p>
        </div>
        <button
          onClick={onOpenCreateVps}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Virtual Server</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1424] border border-slate-800 p-3.5 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search VPS name, hostname, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {['all', 'running', 'stopped'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                filterStatus === st
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchVps}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition ml-2"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* VPS Table */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Virtual Server</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">IPv4 & Node</th>
                <th className="py-3.5 px-4">Resources</th>
                <th className="py-3.5 px-4">Template / Image</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No virtual servers match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map((vps) => (
                  <tr key={vps.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-100">{vps.name}</div>
                      <div className="text-xs font-mono text-slate-400">{vps.hostname}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        vps.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        vps.status === 'stopped' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          vps.status === 'running' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`} />
                        {vps.status}
                      </span>
                    </td>

                    {/* IP & Node */}
                    <td className="py-4 px-4 text-xs">
                      <div className="font-mono text-cyan-300 font-semibold">{vps.ip_address}</div>
                      <div className="text-slate-400 mt-0.5">Node: {vps.node_name || vps.node_id}</div>
                    </td>

                    {/* Hardware */}
                    <td className="py-4 px-4 text-xs font-mono text-slate-300">
                      <div>{vps.cpu_cores} vCPU / {vps.ram_mb >= 1024 ? `${vps.ram_mb / 1024} GB` : `${vps.ram_mb} MB`} RAM</div>
                      <div className="text-slate-500 mt-0.5">{vps.disk_gb} GB NVMe Disk</div>
                    </td>

                    {/* OS */}
                    <td className="py-4 px-4 text-xs text-slate-300">
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-700/80 rounded-md font-mono text-[11px] text-slate-300">
                        {vps.os_image}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Terminal Console */}
                        <button
                          onClick={() => onOpenConsole(vps)}
                          title="Open Interactive Web Console (xterm.js)"
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                        >
                          <TermIcon className="w-3.5 h-3.5" />
                          <span>Console</span>
                        </button>

                        {/* Power Control */}
                        {vps.status === 'running' ? (
                          <button
                            onClick={() => handleAction(vps.id, 'stop')}
                            disabled={actionLoading === `${vps.id}-stop`}
                            title="Graceful Shutdown"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(vps.id, 'start')}
                            disabled={actionLoading === `${vps.id}-start`}
                            title="Power On"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                          >
                            <Power className="w-4 h-4 text-emerald-400" />
                          </button>
                        )}

                        {/* Restart */}
                        <button
                          onClick={() => handleAction(vps.id, 'restart')}
                          disabled={actionLoading === `${vps.id}-restart`}
                          title="Reboot VPS"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Terminate */}
                        <button
                          onClick={() => handleDelete(vps.id, vps.name)}
                          title="Delete / Terminate VPS"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
