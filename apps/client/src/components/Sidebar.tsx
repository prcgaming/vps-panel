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
  Key
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vps', label: 'Virtual Servers', icon: Layers },
    { id: 'nodes', label: 'Nodes & Hypervisors', icon: Server, badge: 'Multi-Node' },
    { id: 'ipam', label: 'IPAM & Networking', icon: Network },
    { id: 'templates', label: 'OS Templates', icon: Disc },
    { id: 'logs', label: 'Activity Logs', icon: FileText },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'users', label: 'Users & Roles', icon: Users });
    navItems.push({ id: 'settings', label: 'Settings & License', icon: Key, badge: 'License' });
  }

  return (
    <aside className="w-64 bg-[#0a0e1a] border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
            V
          </div>
          <div>
            <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight flex items-center gap-1.5">
              VPS Panel
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">v1.0</span>
            </h1>
            <p className="text-[11px] text-slate-400">Multi-Node Cloud Controller</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-300 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User info & Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
