import React from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Layers, 
  Network, 
  Disc, 
  Users, 
  FileText, 
  LogOut, 
  ExternalLink, 
  ChevronRight, 
  Palette, 
  Orbit,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  viewMode?: 'client' | 'admin';
  onToggleViewMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab,
  viewMode = 'client',
  onToggleViewMode
}) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const [panelName, setPanelName] = React.useState('Lunar Client Cloud');
  const [logoUrl, setLogoUrl] = React.useState('');

  React.useEffect(() => {
    api.getSettings().then((res: any) => {
      if (res.settings) {
        if (res.settings.panel_name) setPanelName(res.settings.panel_name);
        if (res.settings.panel_logo_url) setLogoUrl(res.settings.panel_logo_url);
      }
    }).catch(() => {});
  }, []);

  const clientServices = [
    { id: 'dashboard', label: 'Cloud Overview', icon: LayoutDashboard },
    { id: 'vps', label: 'Virtual Servers', icon: Layers, badge: 'HVM' },
    { id: 'templates', label: 'OS & ISO Library', icon: Disc },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
  ];

  const adminCompute = [
    { id: 'dashboard', label: 'Cluster Overview', icon: LayoutDashboard },
    { id: 'vps', label: 'Virtual Servers', icon: Layers, badge: 'HVM' },
    { id: 'templates', label: 'OS & ISO Library', icon: Disc },
  ];

  const adminInfrastructure = [
    { id: 'nodes', label: 'Compute Nodes', icon: Server, badge: 'Cluster' },
    { id: 'ipam', label: 'IP Networks & DNS', icon: Network },
  ];

  const adminManagement = [
    { id: 'users', label: 'Client Accounts', icon: Users },
    { id: 'logs', label: 'Audit & Telemetry', icon: FileText },
    { id: 'settings', label: 'Portal Themes & Branding', icon: Palette, badge: 'Styles' },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col justify-between flex-shrink-0 select-none transition-colors duration-200 ${currentTheme.sidebarStyle}`}>
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06] gap-3 bg-white/[0.01]">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-xl object-contain bg-slate-900 border border-slate-700/80 p-1 shadow-md" />
          ) : (
            <div 
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentTheme.previewGradient} flex items-center justify-center shadow-lg text-white font-black text-lg relative overflow-hidden group`}
              style={{ boxShadow: `0 8px 24px -4px ${currentTheme.glowColor}` }}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <Orbit className="w-5 h-5 text-white relative z-10 animate-[spin_20s_linear_infinite]" />
            </div>
          )}
          <div className="overflow-hidden">
            <h1 className="font-extrabold text-white text-sm leading-tight tracking-tight truncate flex items-center gap-1.5">
              <span>{panelName}</span>
            </h1>
            <p className={`text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 mt-0.5 ${currentTheme.textAccent}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${viewMode === 'admin' ? 'bg-purple-400' : 'bg-cyan-400'} animate-pulse`} />
              <span>{viewMode === 'admin' ? 'Platform Admin' : 'Client Console'}</span>
            </p>
          </div>
        </div>

        {/* Admin Mode Top Switch Banner */}
        {viewMode === 'admin' && (
          <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Mode</span>
            </div>
            {onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                className="text-[11px] text-cyan-300 hover:text-white font-bold flex items-center gap-1 transition"
                title="Return to Client View"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Client View</span>
              </button>
            )}
          </div>
        )}

        {/* Navigation Section */}
        <div className="p-4 space-y-5">
          
          {viewMode === 'client' ? (
            /* CLIENT VIEW NAV */
            <div>
              <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                <span>Cloud Compute</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
              </div>
              <div className="space-y-1 mt-1.5">
                {clientServices.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentTab(item.id)}
                      className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-white font-bold border-l-2 border-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 transition ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                          isActive 
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                            : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ADMIN VIEW NAV */
            <>
              {/* Infrastructure */}
              <div>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>Cluster Infrastructure</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400/40" />
                </div>
                <div className="space-y-1 mt-1.5">
                  {adminInfrastructure.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent text-white font-bold border-l-2 border-purple-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 transition ${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                            isActive 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compute Services */}
              <div>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>Compute & Cloud</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                </div>
                <div className="space-y-1 mt-1.5">
                  {adminCompute.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-white font-bold border-l-2 border-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 transition ${isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                            isActive 
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Management */}
              <div>
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>Platform Administration</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
                </div>
                <div className="space-y-1 mt-1.5">
                  {adminManagement.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`w-full relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent text-white font-bold border-l-2 border-purple-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 transition ${isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                            isActive 
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* User Info & Client Portal Status */}
      <div className="p-4 border-t border-white/[0.06] space-y-2">
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-white/[0.08] flex items-center justify-between shadow-lg backdrop-blur">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div 
              className={`w-8 h-8 rounded-xl bg-gradient-to-br ${currentTheme.previewGradient} text-white font-extrabold flex items-center justify-center text-xs flex-shrink-0 shadow-md ring-1 ring-white/20`}
            >
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                <span>{user?.name}</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{user?.role === 'admin' ? (viewMode === 'admin' ? 'Platform Admin' : 'Admin [Client View]') : 'Client User'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out of Console"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Admin Toggle near profile */}
        {user?.role === 'admin' && onToggleViewMode && (
          viewMode === 'client' ? (
            <button
              onClick={onToggleViewMode}
              className="w-full py-2 px-3 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Open Administrator Console (/admin-panel)"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>🛡️ Switch to Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={onToggleViewMode}
              className="w-full py-2 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              title="Return to Client View (/panel)"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>← Return to Client Panel</span>
            </button>
          )
        )}
      </div>
    </aside>
  );
};
