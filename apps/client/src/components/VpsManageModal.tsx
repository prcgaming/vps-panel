import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Terminal as TermIcon, 
  Monitor, 
  Keyboard,
  Copy, 
  Check, 
  Power, 
  Disc, 
  Key, 
  Folder, 
  FileText, 
  FileCode, 
  Trash2, 
  Plus, 
  Save, 
  ArrowLeft, 
  ExternalLink, 
  Shield, 
  Network, 
  Settings as SettingsIcon, 
  Cpu, 
  HardDrive, 
  Globe, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Download, 
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers,
  Share2,
  UserCheck
} from 'lucide-react';
import { VpsInstance } from '../types';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface VpsManageModalProps {
  vps: VpsInstance;
  onClose: () => void;
  onRefresh?: () => void;
}

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  mode: number;
}

export const VpsManageModal: React.FC<VpsManageModalProps> = ({ vps, onClose, onRefresh }) => {
  const { currentTheme } = useTheme();

  // Active Tab
  const isGuiOrWindows = 
    vps.os_type === 'windows' || 
    vps.os_type === 'gui_desktop' || 
    vps.os_type === 'custom_iso' ||
    vps.os_image.toLowerCase().includes('win') ||
    vps.os_image.toLowerCase().includes('desktop') ||
    vps.os_image.toLowerCase().includes('iso');

  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'ssh' | 'network' | 'settings'>('console');
  const [consoleMode, setConsoleMode] = useState<'terminal' | 'vnc'>(isGuiOrWindows ? 'vnc' : 'terminal');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Power actions
  const [powerLoading, setPowerLoading] = useState<string | null>(null);
  const [vpsStatus, setVpsStatus] = useState(vps.status);

  // File Manager State
  const [currentDir, setCurrentDir] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string; originalContent: string } | null>(null);
  const [savingFile, setSavingFile] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // SSH Maker State
  const [generatingKey, setGeneratingKey] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<{ privateKey: string; publicKey: string; fingerprint: string; command: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [rootPassword, setRootPassword] = useState(vps.root_password || 'Admin@2026!');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [customPasswordInput, setCustomPasswordInput] = useState('');

  // Terminal & VNC State
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [copiedVnc, setCopiedVnc] = useState(false);
  const [vncUnlocked, setVncUnlocked] = useState(false);
  const [vncNotification, setVncNotification] = useState<string | null>(null);

  // Rebuild state
  const [selectedRebuildOs, setSelectedRebuildOs] = useState('ubuntu:24.04');
  const [rebuilding, setRebuilding] = useState(false);

  // Transfer Ownership State
  const { user } = useAuth();
  const [transferUsers, setTransferUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [selectedTransferUserId, setSelectedTransferUserId] = useState<string>('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'settings' && user?.role === 'admin' && transferUsers.length === 0) {
      api.getUsers().then(res => setTransferUsers(res.users || [])).catch(console.error);
    }
  }, [activeTab, user]);

  const handleTransferOwnership = async () => {
    if (!selectedTransferUserId) {
      alert('Please select a registered user account to transfer this VPS to');
      return;
    }
    setTransferring(true);
    try {
      const res = await api.transferVpsOwner(vps.id, selectedTransferUserId);
      setTransferSuccess(res.message || 'VPS ownership transferred successfully!');
      if (onRefresh) onRefresh();
      setTimeout(() => setTransferSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to transfer VPS ownership');
    } finally {
      setTransferring(false);
    }
  };

  const vncPort = vps.vnc_port || 5900;
  const nodeHost = vps.node_ip || window.location.hostname;
  const vncUrl = `vnc://${nodeHost}:${vncPort}`;

  // Handle Power Actions
  const handlePowerAction = async (action: string) => {
    setPowerLoading(action);
    try {
      await api.actionVps(vps.id, action);
      if (action === 'start') setVpsStatus('running');
      if (action === 'stop' || action === 'kill') setVpsStatus('stopped');
      if (action === 'restart') setVpsStatus('running');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || `Failed to execute ${action}`);
    } finally {
      setPowerLoading(null);
    }
  };

  // Load Files
  const loadDirectory = async (dirPath: string) => {
    setLoadingFiles(true);
    try {
      const res = await api.getVpsFiles(vps.id, dirPath);
      setFiles(res.files || []);
      setCurrentDir(dirPath);
    } catch (err: any) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'files') {
      loadDirectory(currentDir);
    }
  }, [activeTab, currentDir]);

  // Open file for editing
  const handleOpenFile = async (filePath: string) => {
    try {
      const res = await api.getVpsFileContent(vps.id, filePath);
      setEditingFile({
        path: filePath,
        content: res.content,
        originalContent: res.content
      });
    } catch (err: any) {
      alert(err.message || 'Failed to read file content');
    }
  };

  // Save edited file
  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSavingFile(true);
    try {
      await api.saveVpsFileContent(vps.id, editingFile.path, editingFile.content);
      setEditingFile({
        ...editingFile,
        originalContent: editingFile.content
      });
      alert('File saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save file');
    } finally {
      setSavingFile(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (filePath: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${filePath}"?`)) return;
    try {
      await api.deleteVpsFile(vps.id, filePath);
      loadDirectory(currentDir);
    } catch (err: any) {
      alert(err.message || 'Failed to delete file');
    }
  };

  // Create new file
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim().replace(/^[\/\\]+/, '');
    const fullPath = currentDir === '/' ? `/${cleanName}` : `${currentDir}/${cleanName}`;
    try {
      await api.saveVpsFileContent(vps.id, fullPath, `# New file: ${cleanName}\n`);
      setShowNewFileModal(false);
      setNewFileName('');
      loadDirectory(currentDir);
      handleOpenFile(fullPath);
    } catch (err: any) {
      alert(err.message || 'Failed to create file');
    }
  };

  // Generate SSH Key Pair
  const handleGenerateSshKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await api.generateSshKey(vps.id);
      setGeneratedKey(res);
    } catch (err: any) {
      alert(err.message || 'Failed to generate SSH Key pair');
    } finally {
      setGeneratingKey(false);
    }
  };

  // Download Private Key
  const handleDownloadPrivateKey = () => {
    if (!generatedKey) return;
    const blob = new Blob([generatedKey.privateKey], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id_rsa_${vps.hostname || 'vps'}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reset Root Password
  const handleResetPassword = async (newPass?: string) => {
    setIsResettingPassword(true);
    try {
      const res = await api.resetVpsPassword(vps.id, newPass);
      setRootPassword(res.root_password);
      setCustomPasswordInput('');
      alert(`Root password updated successfully!`);
    } catch (err: any) {
      alert(err.message || 'Failed to update root password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Terminal WebSocket logic
  const triggerVncNotification = (msg: string) => {
    setVncNotification(msg);
    setTimeout(() => setVncNotification(null), 3000);
  };

  const connectTerminal = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const token = localStorage.getItem('vps_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/terminal?token=${token}&vpsId=${vps.id}&cols=80&rows=24`;

    setConnectionStatus('connecting');

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      if (termInstanceRef.current) {
        termInstanceRef.current.clear();
        termInstanceRef.current.writeln('\x1b[32m[Connected to Server Console]\x1b[0m\r\n');
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && termInstanceRef.current) {
          termInstanceRef.current.write(msg.data);
        }
      } catch (e) {
        if (termInstanceRef.current) {
          termInstanceRef.current.write(event.data);
        }
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      if (termInstanceRef.current) {
        termInstanceRef.current.writeln('\r\n\x1b[31m[Console session disconnected]\x1b[0m\r\n');
      }
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };
  };

  useEffect(() => {
    if (activeTab === 'console' && consoleMode === 'terminal' && terminalRef.current) {
      if (!termInstanceRef.current) {
        const term = new Terminal({
          cursorBlink: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontSize: 13,
          theme: {
            background: '#070a12',
            foreground: '#f8fafc',
            cursor: '#38bdf8',
            selectionBackground: '#1e293b'
          }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        term.onData((data) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', data }));
          }
        });

        termInstanceRef.current = term;
        fitAddonRef.current = fitAddon;
      }

      connectTerminal();

      const handleResize = () => {
        fitAddonRef.current?.fit();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (termInstanceRef.current) {
          termInstanceRef.current.dispose();
          termInstanceRef.current = null;
        }
      };
    }
  }, [activeTab, consoleMode]);

  // Rebuild VPS
  const handleRebuild = async () => {
    if (!confirm(`CAUTION: Rebuilding with ${selectedRebuildOs} will completely format the virtual disk. All data will be wiped. Proceed?`)) return;
    setRebuilding(true);
    try {
      await api.actionVps(vps.id, 'rebuild', { os_image: selectedRebuildOs });
      alert(`Rebuild triggered! Your server is rebuilding with ${selectedRebuildOs}.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to rebuild server');
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`bg-[#0a0f1d] border border-white/[0.12] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-300 ring-1 ring-white/[0.05] ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Header: Server Identity & Power Controls */}
        <div className="px-6 py-4 border-b border-white/[0.08] bg-[#0c1222]/90 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div 
              className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${currentTheme.previewGradient} flex items-center justify-center text-white shadow-lg`}
              style={{ boxShadow: `0 8px 20px -4px ${currentTheme.glowColor}` }}
            >
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-white text-base tracking-tight">{vps.name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  vpsStatus === 'running' 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${vpsStatus === 'running' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  {vpsStatus}
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {vps.virt_type === 'container' ? 'LXC' : 'HVM | KVM'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="text-cyan-300 font-semibold">{vps.ip_address}</span>
                <span className="text-slate-600">&bull;</span>
                <span>{vps.hostname}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-400">{vps.os_image}</span>
              </div>
            </div>
          </div>

          {/* Quick Power Actions Bar */}
          <div className="flex items-center gap-2">
            {vpsStatus === 'running' ? (
              <>
                <button
                  onClick={() => handlePowerAction('restart')}
                  disabled={!!powerLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
                  title="Graceful Reboot"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${powerLoading === 'restart' ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Restart</span>
                </button>
                <button
                  onClick={() => handlePowerAction('stop')}
                  disabled={!!powerLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
                  title="Graceful Shutdown"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
                <button
                  onClick={() => handlePowerAction('kill')}
                  disabled={!!powerLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                  title="Force Kill (Hard Power Off)"
                >
                  <Power className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Kill</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handlePowerAction('start')}
                disabled={!!powerLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/10"
              >
                <Power className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start Server</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition ml-1"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
              title="Close Management View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu (Pterodactyl Style) */}
        <div className="px-6 bg-[#080d19] border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: 'console', label: 'Console & Display', icon: TermIcon },
            { id: 'files', label: 'File Manager', icon: Folder },
            { id: 'ssh', label: 'SSH Maker & Access', icon: Key },
            { id: 'network', label: 'Networking & Ports', icon: Network },
            { id: 'settings', label: 'Settings & Reinstall', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? `border-cyan-400 text-white bg-white/[0.03]`
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto bg-[#070b16] p-6">
          
          {/* TAB 1: CONSOLE & VNC DISPLAY */}
          {activeTab === 'console' && (
            <div className="h-full flex flex-col space-y-4">
              {/* Console Sub-Switch: Terminal vs Web VNC */}
              <div className="flex items-center justify-between bg-[#0e1424] p-2 rounded-2xl border border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConsoleMode('terminal')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      consoleMode === 'terminal'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <TermIcon className="w-3.5 h-3.5" />
                    <span>Serial Console (xterm.js)</span>
                  </button>

                  <button
                    onClick={() => setConsoleMode('vnc')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      consoleMode === 'vnc'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    <span>Web VNC Graphical Viewer</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {consoleMode === 'terminal' ? (
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span>{connectionStatus}</span>
                      <button
                        onClick={connectTerminal}
                        className="p-1 hover:text-white rounded transition ml-1"
                        title="Reconnect Console"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setVncUnlocked(true);
                          triggerVncNotification('Sent Ctrl + Alt + Delete key sequence');
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition"
                      >
                        <Keyboard className="w-3 h-3 text-cyan-400" />
                        <span>Ctrl+Alt+Del</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vncUrl);
                          setCopiedVnc(true);
                          triggerVncNotification(`Copied VNC Address: ${vncUrl}`);
                          setTimeout(() => setCopiedVnc(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 transition"
                      >
                        {copiedVnc ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                        <span>Copy VNC URL</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Console Display Container */}
              <div className="flex-1 min-h-[420px] bg-[#05070e] rounded-2xl border border-white/[0.08] overflow-hidden relative shadow-inner">
                {consoleMode === 'terminal' ? (
                  <div ref={terminalRef} className="w-full h-full p-3" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none relative bg-gradient-to-br from-[#070b19] via-[#091124] to-[#04060d]">
                    {vncNotification && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-600/90 text-white text-xs font-bold rounded-xl shadow-2xl backdrop-blur border border-white/20 animate-in fade-in slide-in-from-top-2">
                        {vncNotification}
                      </div>
                    )}

                    <div className="max-w-md w-full bg-[#0d1428]/90 border border-white/[0.1] rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
                      <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Monitor className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-white tracking-tight">Interactive Graphical VNC</h4>
                      <p className="text-xs text-slate-400 mt-1 mb-6">
                        Display connected on <code className="text-cyan-300 font-mono">:{vncPort}</code> with native hardware rendering.
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setVncUnlocked(true);
                            triggerVncNotification('Interactive screen focus acquired');
                          }}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Focus Graphical Desktop</span>
                        </button>

                        <div className="pt-2 border-t border-white/[0.06] text-left">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Native VNC Client Credentials:</div>
                          <div className="bg-slate-900/90 p-3 rounded-xl border border-white/[0.06] space-y-1.5 font-mono text-xs">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Host IP:</span>
                              <span className="text-cyan-300">{nodeHost}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">VNC Port:</span>
                              <span className="text-cyan-300">{vncPort}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Password:</span>
                              <span className="text-slate-200">{rootPassword}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FILE MANAGER */}
          {activeTab === 'files' && (
            <div className="h-full flex flex-col space-y-4">
              {editingFile ? (
                /* INLINE LUXURY CODE & TEXT EDITOR */
                <div className="flex-1 flex flex-col bg-[#0b1020] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl">
                  {/* Editor Header */}
                  <div className="px-5 py-3 bg-[#0e162c] border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditingFile(null)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Files</span>
                      </button>
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-xs font-bold text-white">{editingFile.path}</span>
                      </div>
                      {editingFile.content !== editingFile.originalContent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Unsaved Changes
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveFile}
                        disabled={savingFile}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
                      >
                        <Save className={`w-3.5 h-3.5 ${savingFile ? 'animate-spin' : ''}`} />
                        <span>{savingFile ? 'Saving...' : 'Save File'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea Editor */}
                  <div className="flex-1 relative">
                    <textarea
                      value={editingFile.content}
                      onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                      spellCheck={false}
                      className="w-full h-full min-h-[480px] p-5 bg-[#070b16] font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed selection:bg-cyan-500/30"
                      placeholder="Enter file contents..."
                    />
                  </div>
                </div>
              ) : (
                /* DIRECTORY BROWSER */
                <div className="space-y-4">
                  {/* Top Bar: Breadcrumb & Actions */}
                  <div className="flex items-center justify-between bg-[#0e1424] p-3.5 rounded-2xl border border-white/[0.06]">
                    <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto">
                      <span className="text-slate-500">Path:</span>
                      <button
                        onClick={() => setCurrentDir('/')}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 transition"
                      >
                        /
                      </button>
                      {currentDir !== '/' && currentDir.split('/').filter(Boolean).map((part, idx, arr) => {
                        const targetPath = '/' + arr.slice(0, idx + 1).join('/');
                        return (
                          <React.Fragment key={targetPath}>
                            <span className="text-slate-600">/</span>
                            <button
                              onClick={() => setCurrentDir(targetPath)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition"
                            >
                              {part}
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowNewFileModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New File</span>
                      </button>
                      <button
                        onClick={() => loadDirectory(currentDir)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                        title="Refresh Directory"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Files Table */}
                  <div className="bg-[#0b1020] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0e162c] text-slate-400 font-semibold uppercase tracking-wider border-b border-white/[0.06]">
                        <tr>
                          <th className="py-3 px-6">Name</th>
                          <th className="py-3 px-4">Size</th>
                          <th className="py-3 px-4">Permissions</th>
                          <th className="py-3 px-4">Last Modified</th>
                          <th className="py-3 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {/* Parent Directory Link */}
                        {currentDir !== '/' && (
                          <tr 
                            onClick={() => {
                              const parts = currentDir.split('/').filter(Boolean);
                              parts.pop();
                              setCurrentDir(parts.length === 0 ? '/' : '/' + parts.join('/'));
                            }}
                            className="hover:bg-white/[0.04] cursor-pointer transition"
                          >
                            <td colSpan={5} className="py-3 px-6 font-mono text-cyan-400 flex items-center gap-2 font-bold">
                              <Folder className="w-4 h-4 text-amber-400" />
                              <span>.. (Parent Directory)</span>
                            </td>
                          </tr>
                        )}

                        {loadingFiles ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                              Loading directory contents...
                            </td>
                          </tr>
                        ) : files.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-500 font-mono">
                              This directory is empty.
                            </td>
                          </tr>
                        ) : (
                          files.map((file) => (
                            <tr key={file.path} className="hover:bg-white/[0.03] transition">
                              <td className="py-3 px-6">
                                <button
                                  onClick={() => {
                                    if (file.isDirectory) {
                                      setCurrentDir(file.path);
                                    } else {
                                      handleOpenFile(file.path);
                                    }
                                  }}
                                  className="flex items-center gap-2.5 text-left font-mono hover:underline group"
                                >
                                  {file.isDirectory ? (
                                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                                  ) : (
                                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                                  )}
                                  <span className={file.isDirectory ? 'text-amber-200 font-bold' : 'text-slate-200 group-hover:text-cyan-300'}>
                                    {file.name}
                                  </span>
                                </button>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-400">
                                {file.isDirectory ? '-' : `${(file.size / 1024).toFixed(1)} KB`}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500">
                                {file.mode.toString(8).slice(-3) || '0644'}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {new Date(file.modified).toLocaleDateString()} {new Date(file.modified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!file.isDirectory && (
                                    <button
                                      onClick={() => handleOpenFile(file.path)}
                                      className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 rounded-lg transition"
                                      title="Edit file"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteFile(file.path)}
                                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                    title="Delete file"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* New File Modal */}
                  {showNewFileModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                      <form onSubmit={handleCreateNewFile} className="bg-[#0e162c] border border-white/[0.1] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <h4 className="font-bold text-white text-sm">Create New File</h4>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            File Name (e.g. config.json, setup.sh)
                          </label>
                          <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder="filename.txt"
                            required
                            autoFocus
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowNewFileModal(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition"
                          >
                            Create
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SSH MAKER & REMOTE ACCESS */}
          {activeTab === 'ssh' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* SSH Maker Action Card */}
              <div className="bg-[#0b1020] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-base font-extrabold text-white">Instant SSH Key Pair Generator</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Generate a secure 2048-bit RSA key pair in 1-click. The public key is automatically injected into <code className="text-cyan-300 font-mono">~/.ssh/authorized_keys</code>.
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateSshKey}
                    disabled={generatingKey}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold rounded-2xl shadow-xl shadow-cyan-500/25 transition whitespace-nowrap self-start md:self-auto"
                  >
                    <Key className={`w-4 h-4 ${generatingKey ? 'animate-spin' : ''}`} />
                    <span>{generatingKey ? 'Generating Keys...' : '⚡ Generate New SSH Key'}</span>
                  </button>
                </div>

                {generatedKey && (
                  <div className="space-y-4 pt-4 border-t border-white/[0.08] animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Private Key Box */}
                      <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Private Key (id_rsa.pem)</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={handleDownloadPrivateKey}
                              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download .pem</span>
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(generatedKey.privateKey);
                                setCopiedKey(true);
                                setTimeout(() => setCopiedKey(false), 2000);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded transition"
                              title="Copy to clipboard"
                            >
                              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <pre className="text-[10px] font-mono text-slate-400 max-h-36 overflow-y-auto p-2 bg-slate-950/80 rounded-xl border border-white/[0.04]">
                          {generatedKey.privateKey}
                        </pre>
                      </div>

                      {/* Connection Command */}
                      <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.08] space-y-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                            Terminal Connect Command
                          </span>
                          <p className="text-xs text-slate-400">
                            Run this command directly in your Windows Terminal, macOS or Linux bash:
                          </p>
                        </div>
                        
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-500/20 flex items-center justify-between gap-2">
                          <code className="text-xs font-mono text-cyan-300 break-all">
                            {generatedKey.command}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKey.command);
                              setCopiedCommand(true);
                              setTimeout(() => setCopiedCommand(false), 2000);
                            }}
                            className="p-1.5 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 rounded-lg transition shrink-0"
                            title="Copy command"
                          >
                            {copiedCommand ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="text-[11px] font-mono text-slate-500">
                          Fingerprint: <span className="text-slate-400">{generatedKey.fingerprint}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SSHX Live Collaborative Terminal */}
              <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">SSHX Collaborative Terminal Link</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-lg">
                      Share real-time collaborative web terminal sessions with team members via encrypted tunnel. Run SSHX inside the server or connect via the web.
                    </p>
                    <div className="mt-2 text-xs font-mono text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20 inline-block">
                      curl -sSf https://sshx.io/get | sh -c sshx
                    </div>
                  </div>
                </div>

                <a
                  href="https://sshx.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/20 whitespace-nowrap self-start md:self-auto"
                >
                  <span>Open SSHX Web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Root Password & Direct Credentials */}
              <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-extrabold text-white">Root / Administrator Credentials</h4>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#070b16] p-4 rounded-2xl border border-white/[0.06]">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Root Password</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-mono text-sm text-cyan-300 font-bold">
                        {showPassword ? rootPassword : '••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(rootPassword);
                          setCopiedPassword(true);
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title="Copy password"
                      >
                        {copiedPassword ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResetPassword()}
                      disabled={isResettingPassword}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-white/[0.08] transition"
                    >
                      <span>Generate Random Password</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: NETWORKING & PORTS */}
          {activeTab === 'network' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Network Details Card */}
              <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-extrabold text-white">Virtual Network Configuration</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Primary IPv4</div>
                    <div className="font-mono text-cyan-300 font-bold text-sm mt-1">{vps.ip_address}</div>
                  </div>

                  <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Gateway</div>
                    <div className="font-mono text-slate-300 text-sm mt-1">{vps.gateway || '198.51.100.1'}</div>
                  </div>

                  <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">Subnet Mask</div>
                    <div className="font-mono text-slate-300 text-sm mt-1">{vps.netmask || '255.255.255.0'}</div>
                  </div>

                  <div className="bg-[#070b16] p-4 rounded-2xl border border-white/[0.06]">
                    <div className="text-[11px] font-bold text-slate-500 uppercase">DNS Nameservers</div>
                    <div className="font-mono text-slate-300 text-sm mt-1">1.1.1.1, 8.8.8.8</div>
                  </div>
                </div>
              </div>

              {/* Standard Open Ports & Firewall */}
              <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
                <h4 className="text-sm font-extrabold text-white">Default Port Bindings & Services</h4>
                
                <div className="divide-y divide-white/[0.06]">
                  {[
                    { port: 22, proto: 'TCP', service: 'SSH Secure Shell', status: 'Allowed' },
                    { port: 80, proto: 'TCP', service: 'HTTP Web Server', status: 'Allowed' },
                    { port: 443, proto: 'TCP', service: 'HTTPS Secure Web Server', status: 'Allowed' },
                    { port: vncPort, proto: 'TCP', service: 'VNC Remote Display Console', status: isGuiOrWindows ? 'Active' : 'Standby' },
                    { port: 3389, proto: 'TCP', service: 'RDP Remote Desktop Protocol', status: vps.os_type === 'windows' ? 'Active' : 'Standby' },
                  ].map((p) => (
                    <div key={p.port} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {p.port} / {p.proto}
                        </span>
                        <span className="text-slate-200 font-medium">{p.service}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & REINSTALL */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Transfer VPS Ownership / Give VPS to Client Account (Admin Only) */}
              {user?.role === 'admin' && (
                <div className="bg-[#0b1020] border border-cyan-500/20 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-sm font-extrabold text-white">Transfer VPS Ownership / Give to User Account</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Reassign this VPS to any client who created an account. The server will immediately appear in their client portal with full control.
                  </p>

                  {transferSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold">
                      {transferSuccess}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                    <select
                      value={selectedTransferUserId}
                      onChange={(e) => setSelectedTransferUserId(e.target.value)}
                      className="w-full sm:w-80 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Select Target Client Account...</option>
                      {transferUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.email} ({u.role})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleTransferOwnership}
                      disabled={transferring || !selectedTransferUserId}
                      className="w-full sm:w-auto px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition whitespace-nowrap"
                    >
                      {transferring ? 'Transferring...' : 'Transfer VPS Ownership'}
                    </button>
                  </div>
                </div>
              )}

              {/* OS Reinstall / Rebuild Card */}
              <div className="bg-[#0b1020] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Disc className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-extrabold text-white">Rebuild / Reinstall Operating System</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Select a fresh cloud image or custom ISO to reinstall onto this server. All data on the virtual drive will be replaced.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <select
                    value={selectedRebuildOs}
                    onChange={(e) => setSelectedRebuildOs(e.target.value)}
                    className="w-full sm:w-80 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ubuntu:24.04">Ubuntu 24.04 LTS (Noble Numbat)</option>
                    <option value="ubuntu:22.04">Ubuntu 22.04 LTS (Jammy)</option>
                    <option value="debian:12">Debian 12 (Bookworm)</option>
                    <option value="alpine:3.20">Alpine Linux 3.20 (Minimal)</option>
                    <option value="windows-server-2022">Windows Server 2022 (VNC Display)</option>
                    <option value="windows-11-pro">Windows 11 Pro (VNC Display)</option>
                    <option value="ubuntu-desktop-gui">Ubuntu Desktop GUI (XFCE4 VNC)</option>
                    <option value="archlinux:latest">Arch Linux (Rolling)</option>
                    <option value="custom-iso-installer">Custom ISO Installer</option>
                  </select>

                  <button
                    onClick={handleRebuild}
                    disabled={rebuilding}
                    className="w-full sm:w-auto px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 transition whitespace-nowrap"
                  >
                    {rebuilding ? 'Rebuilding OS...' : 'Reinstall Server OS'}
                  </button>
                </div>
              </div>

              {/* Danger Zone: Terminate VPS */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <h4 className="text-sm font-extrabold text-rose-300">Danger Zone</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Permanently terminate and destroy this virtual machine, deleting all stored disk blocks and releasing the IP address back to the pool.
                </p>

                <button
                  onClick={async () => {
                    if (!confirm(`Are you completely sure you want to PERMANENTLY DESTROY ${vps.name}? This action cannot be reversed.`)) return;
                    try {
                      await api.deleteVps(vps.id);
                      onClose();
                      if (onRefresh) onRefresh();
                    } catch (err: any) {
                      alert(err.message || 'Failed to destroy server');
                    }
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-rose-600/25 transition"
                >
                  Permanently Destroy Server
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
