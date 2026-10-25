import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
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
import { VpsInstance, LicenseStatus } from './types';
import { api } from './api/client';
import { AlertTriangle, Key } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [license, setLicense] = useState<LicenseStatus | null>(null);

  // Modals state
  const [terminalVps, setTerminalVps] = useState<VpsInstance | null>(null);
  const [showCreateVps, setShowCreateVps] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);

  const loadLicense = () => {
    api.getLicenseStatus()
      .then((res: any) => setLicense(res))
      .catch(console.error);
  };

  React.useEffect(() => {
    if (user) {
      loadLicense();
      const interval = setInterval(loadLicense, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
    <div className="flex h-screen bg-[#070a12] text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sidebar Navigation */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <Navbar
          onOpenCreateVps={() => setShowCreateVps(true)}
          onOpenAddNode={() => setShowAddNode(true)}
          license={license}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        {/* Expired / Unactivated License Warning Banner */}
        {license && !license.valid && (
          <div className="bg-rose-950/80 border-b border-rose-800/80 px-8 py-2.5 flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>License Attention Required:</strong> {license.message || 'Please activate a valid license key to continue unlimited operations.'}
              </span>
            </div>
            <button
              onClick={() => setCurrentTab('settings')}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Activate Key</span>
            </button>
          </div>
        )}

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
