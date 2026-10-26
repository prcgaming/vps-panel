import React, { useState, useRef, useEffect } from 'react';
import { Plus, Server, Sparkles, Palette, Check, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  onNavigateTab 
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
    <header className={`h-16 px-8 flex items-center justify-between flex-shrink-0 z-10 transition-colors duration-200 ${currentTheme.headerStyle}`}>
      <div className="flex items-center gap-3">
        {/* Cluster Operational Status */}
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Cluster: Operational</span>
        </div>

        {/* HVM Hypervisor Ready Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>[HVM | KVM] Hypervisor</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Theme Presets & Design Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-700/80 transition shadow-sm"
            title="Switch Theme & Design Style"
          >
            <Palette className={`w-4 h-4 ${currentTheme.textAccent}`} />
            <span className="hidden sm:inline font-semibold">{currentTheme.name}</span>
            <span className="hidden md:inline text-[10px] text-slate-400">({currentTheme.designStyle})</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-900"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Theme & Design Styles</span>
                <span className="text-[10px] text-slate-500">{presets.length} Styles</span>
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
                          ? 'bg-slate-800 text-white font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
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
                          <div className="font-medium text-slate-100 flex items-center gap-1.5">
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

        {user?.role === 'admin' && (
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition shadow-sm"
          >
            <Server className={`w-3.5 h-3.5 ${currentTheme.textAccent}`} />
            <span>Add Worker Node</span>
          </button>
        )}

        <button
          onClick={onOpenCreateVps}
          className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-semibold rounded-xl transition ${currentTheme.btnPrimary}`}
        >
          <Plus className="w-4 h-4" />
          <span>New VPS Instance</span>
        </button>
      </div>
    </header>
  );
};
