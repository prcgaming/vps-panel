import React, { useState, useRef, useEffect } from 'react';
import { Plus, Server, Activity, ShieldCheck, Sparkles, Key, AlertTriangle, Palette, Check } from 'lucide-react';
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
  license,
  onNavigateTab 
}) => {
  const { user } = useAuth();
  const { currentTheme, setTheme, presets } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const isLifetime = license?.planType === 'lifetime';
  const isActive = license?.valid;

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
                ? currentTheme.bgBadge + ' hover:opacity-90'
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
                <ShieldCheck className={`w-3.5 h-3.5 ${currentTheme.textAccent}`} />
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
        {/* Quick Theme Presets Selector */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/80 transition shadow-sm"
            title="Change Theme Color Preset"
          >
            <Palette className={`w-4 h-4 ${currentTheme.textAccent}`} />
            <span className="hidden sm:inline">{currentTheme.name}</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-900"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Color Theme Presets</span>
                <span className="text-[10px] text-slate-500">{presets.length} Themes</span>
              </div>
              <div className="py-1 max-h-72 overflow-y-auto space-y-0.5">
                {presets.map((p) => {
                  const isSelected = p.id === currentTheme.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setTheme(p.id, user?.role === 'admin');
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                        isSelected 
                          ? 'bg-slate-800 text-white font-semibold' 
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center -space-x-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-900"
                            style={{ backgroundColor: p.primaryColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-slate-900"
                            style={{ backgroundColor: p.secondaryColor }}
                          />
                        </div>
                        <span>{p.name}</span>
                      </div>
                      {isSelected && <Check className={`w-3.5 h-3.5 ${p.textAccent}`} />}
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
