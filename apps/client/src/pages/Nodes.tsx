import React, { useEffect, useState } from 'react';
import { Server, Plus, RefreshCw, Cpu, Activity, HardDrive, Trash2, ShieldOff, ShieldCheck, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { Node } from '../types';

interface NodesPageProps {
  onOpenAddNode: () => void;
}

export const NodesPage: React.FC<NodesPageProps> = ({ onOpenAddNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNodes = () => {
    api.getNodes()
      .then((res) => setNodes(res.nodes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDrain = async (nodeId: string) => {
    try {
      await api.toggleDrainNode(nodeId);
      fetchNodes();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle drain status');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Are you sure you want to remove this node from the cluster?')) return;
    try {
      await api.deleteNode(nodeId);
      fetchNodes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete node');
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Worker Nodes & Hypervisors</h2>
          <p className="text-sm text-slate-400 mt-1">
            Manage your distributed cluster of virtualization servers running Docker or KVM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchNodes}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Connect New Node</span>
          </button>
        </div>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {nodes.map((node) => {
          const ramTotalGb = Math.round(node.ram_total / 1024);
          const allocatedRamGb = Math.round((node.allocated_ram || 0) / 1024);
          const ramPercent = ramTotalGb ? Math.round((allocatedRamGb / ramTotalGb) * 100) : 0;

          return (
            <div key={node.id} className="p-6 bg-[#0e1424] border border-slate-800 rounded-2xl space-y-5 shadow-sm">
              
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{node.name}</h3>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">{node.ip_address}:{node.port}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    node.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${node.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    {node.status}
                  </span>

                  {node.is_drained === 1 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Drained
                    </span>
                  )}
                </div>
              </div>

              {/* Specs Pills */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">HYPERVISOR</div>
                  <div className="font-mono text-slate-200 uppercase font-semibold mt-0.5">{node.driver}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">VPS HOSTED</div>
                  <div className="font-semibold text-cyan-400 mt-0.5">{node.current_vps_count || node.vps_count}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px]">TOTAL CORES</div>
                  <div className="font-semibold text-slate-200 mt-0.5">{node.cpu_cores} Cores</div>
                </div>
              </div>

              {/* Resource Bars */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Activity className="w-3.5 h-3.5 text-purple-400" />
                      Memory Allocated
                    </span>
                    <span className="font-mono">{allocatedRamGb} GB / {ramTotalGb} GB ({ramPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${ramPercent}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Cpu className="w-3.5 h-3.5 text-amber-400" />
                      vCPU Cores Allocated
                    </span>
                    <span className="font-mono">{node.allocated_cpu || 0} / {node.cpu_cores} Cores</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, Math.round(((node.allocated_cpu || 0) / node.cpu_cores) * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleDrain(node.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    node.is_drained
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {node.is_drained ? 'Activate Node' : 'Drain Node'}
                </button>

                <button
                  onClick={() => handleDeleteNode(node.id)}
                  className="px-3 py-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
