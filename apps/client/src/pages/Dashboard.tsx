import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Layers, 
  Cpu, 
  HardDrive, 
  Activity, 
  Terminal as TermIcon, 
  ArrowUpRight, 
  Power, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { ClusterStats, VpsInstance, Node } from '../types';

interface DashboardProps {
  onOpenConsole: (vps: VpsInstance) => void;
  onOpenCreateVps: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenConsole, onOpenCreateVps, onNavigateTab }) => {
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [vpsList, setVpsList] = useState<VpsInstance[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = () => {
    Promise.all([api.getStats(), api.getVpsList(), api.getNodes()])
      .then(([statsRes, vpsRes, nodesRes]) => {
        setStats(statsRes);
        setVpsList(vpsRes.instances || []);
        setNodes(nodesRes.nodes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Cluster Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of your worker nodes, virtual servers, and distributed hardware allocation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateVps}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            Deploy New VPS
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Nodes Card */}
        <div 
          onClick={() => onNavigateTab('nodes')}
          className="p-5 bg-[#0e1424] border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cluster Nodes</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{stats?.nodes.total || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">({stats?.nodes.online || 0} online)</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Active virtualization worker nodes</p>
        </div>

        {/* VPS Instances Card */}
        <div 
          onClick={() => onNavigateTab('vps')}
          className="p-5 bg-[#0e1424] border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition group shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Virtual Servers</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">{stats?.vps.total || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">({stats?.vps.running || 0} running)</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Provisioned VPS instances</p>
        </div>

        {/* Allocated RAM */}
        <div className="p-5 bg-[#0e1424] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memory Allocation</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">
              {stats?.resources.ram.allocatedMb ? `${(stats.resources.ram.allocatedMb / 1024).toFixed(1)} GB` : '0 GB'}
            </span>
            <span className="text-xs text-slate-400">/ {(stats?.resources.ram.totalMb || 0) / 1024} GB</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.resources.ram.percent || 0}%` }}
            />
          </div>
        </div>

        {/* Allocated Cores */}
        <div className="p-5 bg-[#0e1424] border border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">vCPU Allocation</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-100">
              {stats?.resources.cpu.allocated || 0}
            </span>
            <span className="text-xs text-slate-400">/ {stats?.resources.cpu.total || 0} vCPUs</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats?.resources.cpu.percent || 0}%` }}
            />
          </div>
        </div>

      </div>

      {/* Cluster Nodes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Worker Hypervisors & Nodes
          </h3>
          <button
            onClick={() => onNavigateTab('nodes')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>View All Nodes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nodes.map((node) => (
            <div key={node.id} className="p-5 bg-[#0e1424] border border-slate-800 rounded-2xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{node.name}</h4>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">{node.ip_address}</div>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  node.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${node.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {node.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900/60 rounded-xl border border-slate-800/80">
                <div>
                  <div className="text-slate-400 text-[10px]">DRIVER</div>
                  <div className="font-mono text-slate-200 uppercase font-semibold mt-0.5">{node.driver}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">VPS HOSTED</div>
                  <div className="font-semibold text-cyan-400 mt-0.5">{node.current_vps_count || node.vps_count}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">TOTAL RAM</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{Math.round(node.ram_total / 1024)} GB</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active VPS Instances Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Active Virtual Private Servers
          </h3>
          <button
            onClick={() => onNavigateTab('vps')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>Manage All Servers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-[#0e1424] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">VPS Name / Hostname</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IPv4 Address</th>
                  <th className="py-3.5 px-4">Hypervisor Node</th>
                  <th className="py-3.5 px-4">OS / Plan</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {vpsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No virtual servers deployed yet. Click "Deploy New VPS" to provision one!
                    </td>
                  </tr>
                ) : (
                  vpsList.map((vps) => (
                    <tr key={vps.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{vps.name}</div>
                        <div className="text-xs font-mono text-slate-400">{vps.hostname}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          vps.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          vps.status === 'stopped' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${vps.status === 'running' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          {vps.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-cyan-300">
                        {vps.ip_address}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {vps.node_name || vps.node_id}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        <div>{vps.os_image}</div>
                        <div className="font-mono text-slate-500">{vps.cpu_cores} vCPU / {vps.ram_mb}MB / {vps.disk_gb}GB</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onOpenConsole(vps)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/30 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
                        >
                          <TermIcon className="w-3.5 h-3.5" />
                          <span>Console</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
