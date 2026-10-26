import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { Login } from './pages/Login';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { VpsListPage } from './pages/VpsList';
import { NodesPage } from './pages/Nodes';
import { IpamPage } from './pages/Ipam';
import { TemplatesPage } from './pages/Templates';
import { UsersPage } from './pages/Users';
import { ActivityLogsPage } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';
import { TerminalModal } from './components/TerminalModal';
import { CreateVpsModal } from './components/CreateVpsModal';
import { AddNodeModal } from './components/AddNodeModal';
import { VpsManageModal } from './components/VpsManageModal';
import { VpsInstance } from './types';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();

  // Route & View Mode Management
  // Client Panel (/panel) vs Platform Admin Console (/admin-panel)
  const [viewMode, setViewMode] = useState<'client' | 'admin'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin-panel')) {
      return 'admin';
    }
    return 'client';
  });

  const [currentTab, setCurrentTab] = useState('dashboard');

  // Modals state
  const [managingVps, setManagingVps] = useState<VpsInstance | null>(null);
  const [terminalVps, setTerminalVps] = useState<VpsInstance | null>(null);
  const [showCreateVps, setShowCreateVps] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);

  // Sync URL based on auth status and viewMode
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return;
    }

    // When logged in:
    const pathname = window.location.pathname;

    if (viewMode === 'admin') {
      if (user.role === 'admin') {
        if (pathname !== '/admin-panel') {
          window.history.pushState(null, '', '/admin-panel');
        }
      } else {
        // Non-admin cannot access admin panel; redirect to /panel
        setViewMode('client');
        window.history.replaceState(null, '', '/panel');
      }
    } else {
      // Client mode (/panel)
      if (pathname === '/login' || pathname === '/' || pathname === '/admin-panel') {
        window.history.replaceState(null, '', '/panel');
      }
    }
  }, [user, isLoading, viewMode]);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (!user) {
        return;
      }
      if (pathname.startsWith('/admin-panel')) {
        if (user.role === 'admin') {
          setViewMode('admin');
        } else {
          setViewMode('client');
          window.history.replaceState(null, '', '/panel');
        }
      } else {
        setViewMode('client');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Toggle between Client View (/panel) and Admin View (/admin-panel)
  const handleToggleViewMode = useCallback(() => {
    if (viewMode === 'client') {
      setViewMode('admin');
      window.history.pushState(null, '', '/admin-panel');
    } else {
      setViewMode('client');
      // If currently on an admin-exclusive tab, switch back to dashboard
      if (['nodes', 'ipam', 'users', 'settings'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
      window.history.pushState(null, '', '/panel');
    }
  }, [viewMode, currentTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-400">Loading Client Cloud Console...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className={`flex h-screen ${currentTheme.bodyBg} text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200`}>
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        viewMode={viewMode}
        onToggleViewMode={user.role === 'admin' ? handleToggleViewMode : undefined}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar
          onOpenCreateVps={() => setShowCreateVps(true)}
          onOpenAddNode={() => setShowAddNode(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          viewMode={viewMode}
          onToggleViewMode={user.role === 'admin' ? handleToggleViewMode : undefined}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenConsole={(vps) => setManagingVps(vps)}
              onOpenManage={(vps) => setManagingVps(vps)}
              onOpenCreateVps={() => setShowCreateVps(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'vps' && (
            <VpsListPage
              onOpenConsole={(vps) => setTerminalVps(vps)}
              onOpenManage={(vps) => setManagingVps(vps)}
              onOpenCreateVps={() => setShowCreateVps(true)}
            />
          )}

          {currentTab === 'nodes' && (
            <NodesPage
              onOpenAddNode={() => setShowAddNode(true)}
            />
          )}

          {currentTab === 'ipam' && <IpamPage />}

          {currentTab === 'templates' && <TemplatesPage />}

          {currentTab === 'users' && <UsersPage />}

          {currentTab === 'logs' && <ActivityLogsPage />}

          {currentTab === 'settings' && (
            <Settings onLicenseUpdated={() => {}} />
          )}
        </main>
      </div>

      {/* Pterodactyl-Style VPS Management Console */}
      {managingVps && (
        <VpsManageModal
          vps={managingVps}
          onClose={() => setManagingVps(null)}
          onRefresh={() => {}}
        />
      )}

      {/* Direct Quick Terminal / Web VNC Modal */}
      {terminalVps && (
        <TerminalModal
          vps={terminalVps}
          onClose={() => setTerminalVps(null)}
        />
      )}

      {/* Create VPS Modal */}
      {showCreateVps && (
        <CreateVpsModal
          onClose={() => setShowCreateVps(false)}
          onCreated={() => {
            setShowCreateVps(false);
            setCurrentTab('vps');
          }}
        />
      )}

      {/* Add Worker Node Modal */}
      {showAddNode && (
        <AddNodeModal
          onClose={() => setShowAddNode(false)}
        />
      )}

    </div>
  );
};
