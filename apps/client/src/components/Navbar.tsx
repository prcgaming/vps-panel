import React from 'react';
import { Plus, Server, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenCreateVps: () => void;
  onOpenAddNode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateVps, onOpenAddNode }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cluster Status: Operational</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user?.role === 'admin' && (
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Worker Node</span>
          </button>
        )}

        <button
          onClick={onOpenCreateVps}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New VPS Instance</span>
        </button>
      </div>
    </header>
  );
};
