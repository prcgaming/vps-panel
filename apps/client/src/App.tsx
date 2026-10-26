import React, { useState } from 'react';
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
import { VpsInstance } from './types';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Modals state
  const [terminalVps, setTerminalVps] = useState<VpsInstance | null>(null);
  const [showCreateVps, setShowCreateVps] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-xs font-mono text-slate-400">Loading VPS Control Panel...</div>
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
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar
          onOpenCreateVps={() => setShowCreateVps(true)}
          onOpenAddNode={() => setShowAddNode(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenConsole={(vps) => setTerminalVps(vps)}
              onOpenCreateVps={() => setShowCreateVps(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'vps' && (
            <VpsListPage
              onOpenConsole={(vps) => setTerminalVps(vps)}
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
            <Settings onLicenseUpdated={loadLicense} />
          )}
        </main>
      </div>

      {/* Global Interactive Modals */}
      {terminalVps && (
        <TerminalModal
          vps={terminalVps}
          onClose={() => setTerminalVps(null)}
        />
      )}

      {showCreateVps && (
        <CreateVpsModal
          onClose={() => setShowCreateVps(false)}
          onCreated={() => {
            setShowCreateVps(false);
            setCurrentTab('vps');
          }}
        />
      )}

      {showAddNode && (
        <AddNodeModal
          onClose={() => setShowAddNode(false)}
        />
      )}

    </div>
  );
};
