import React, { useState, useRef, useEffect } from 'react';
import { Plus, Server, Sparkles, Palette, Check, Layers, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LicenseStatus } from '../types';

interface NavbarProps {
  onOpenCreateVps: () => void;
  onOpenAddNode: () => void;
  license?: LicenseStatus | null;
  onNavigateTab?: (tab: string) => void;
  viewMode?: 'client' | 'admin';
  onToggleViewMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenCreateVps, 
  onOpenAddNode, 
  onNavigateTab,
  viewMode = 'client',
  onToggleViewMode
}) => {
  const { user } = useAuth();
  const { currentTheme, setTheme, presets } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close theme menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`h-16 px-8 flex items-center justify-between flex-shrink-0 z-10 transition-colors duration-200 border-b border-white/[0.06] backdrop-blur-2xl ${currentTheme.headerStyle}`}>
      <div className="flex items-center gap-3">
        {/* Operational Status Badge */}
        {viewMode === 'admin' ? (
          <div className="flex items-center gap-2 px-3.5 py-1 bg-purple-500/15 border border-purple-500/30 text-purple-300 rounded-full text-xs font-bold shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span>Admin Control Plane &bull; Cluster Infrastructure</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-full text-xs font-semibold shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Client Cloud: Online &bull; 99.99% SLA</span>
          </div>
        )}

        {/* Dedicated HVM Architecture Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Dedicated HVM Core</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Client VIP Status Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Enterprise Client Tier</span>
        </div>

        {/* Quick Theme Presets & Design Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-white/[0.08] transition shadow-md hover:border-white/20"
            title="Switch Theme & Design Style"
          >
            <Palette className={`w-4 h-4 ${currentTheme.textAccent}`} />
            <span className="hidden sm:inline font-bold">{currentTheme.name}</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ml-1"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0e1424]/95 border border-white/[0.12] rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-white/[0.08] text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Theme & Visual Designs</span>
                <span className="text-[10px] text-slate-400 font-mono">{presets.length} Styles</span>
              </div>
              <div className="py-1 max-h-80 overflow-y-auto space-y-1">
                {presets.map((p) => {
                  const isSelected = p.id === currentTheme.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setTheme(p.id, user?.role === 'admin');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition text-left ${
                        isSelected 
                          ? 'bg-white/[0.08] text-white font-bold border border-white/10' 
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex items-center -space-x-1 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-900"
                            style={{ backgroundColor: p.primaryColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-900"
                            style={{ backgroundColor: p.secondaryColor }}
                          />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                              {p.cardRadius}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{p.designStyle}</div>
                        </div>
                      </div>
                      {isSelected && <Check className={`w-4 h-4 ${p.textAccent} shrink-0`} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Admin Console Switcher for Administrators */}
        {user?.role === 'admin' && onToggleViewMode && (
          viewMode === 'client' ? (
            <button
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/10 hover:border-purple-400"
              title="Switch to Platform Admin Console (/admin-panel)"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/10 hover:border-cyan-400"
              title="Switch back to Client Panel (/panel)"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>← Client Panel</span>
            </button>
          )
        )}

        {user?.role === 'admin' && viewMode === 'admin' && (
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-white/[0.08] transition shadow-sm hover:border-white/20"
          >
            <Server className={`w-3.5 h-3.5 ${currentTheme.textAccent}`} />
            <span>Connect Node</span>
          </button>
        )}

        <button
          onClick={onOpenCreateVps}
          className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-xl transition shadow-lg ${currentTheme.btnPrimary}`}
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Cloud VPS</span>
        </button>
      </div>
    </header>
  );
};
