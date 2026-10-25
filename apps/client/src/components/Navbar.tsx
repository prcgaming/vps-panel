import React from 'react';
import { Plus, Server, Activity, ShieldCheck, Sparkles, Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LicenseStatus } from '../types';

interface NavbarProps {
  onOpenCreateVps: () => void;
  onOpenAddNode: () => void;
  license?: LicenseStatus | null;
  onNavigateTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCreateVps, 
  onOpenAddNode, 
  license,
  onNavigateTab 
}) => {
  const { user } = useAuth();

  const isLifetime = license?.planType === 'lifetime';
  const isActive = license?.valid;

  return (
    <header className="h-16 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        {/* Cluster Operational Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cluster: Operational</span>
        </div>

        {/* License Badge */}
        {license && onNavigateTab && (
          <button
            onClick={() => onNavigateTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
              isLifetime
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                : isActive
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title="Click to view/manage license"
          >
            {isLifetime ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>👑 Lifetime Enterprise</span>
              </>
            ) : isActive ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>⚡ 30-Day Pro ({license.daysRemaining ?? 30}d left)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>⚠️ License Expired</span>
              </>
            )}
          </button>
        )}
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
