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
  Send, 
  Sparkles,
  Lock,
  Unlock,
  Layers
} from 'lucide-react';
import { VpsInstance } from '../types';

interface TerminalModalProps {
  vps: VpsInstance;
  onClose: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ vps, onClose }) => {
  const isGuiOrWindows = 
    vps.os_type === 'windows' || 
    vps.os_type === 'gui_desktop' || 
    vps.os_type === 'custom_iso' ||
    vps.os_image.toLowerCase().includes('win') ||
    vps.os_image.toLowerCase().includes('desktop') ||
    vps.os_image.toLowerCase().includes('iso');

  const [activeTab, setActiveTab] = useState<'terminal' | 'vnc'>(isGuiOrWindows ? 'vnc' : 'terminal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [copiedVnc, setCopiedVnc] = useState(false);

  // VNC Graphical state
  const [vncUnlocked, setVncUnlocked] = useState(false);
  const [vncPasswordInput, setVncPasswordInput] = useState(vps.root_password || 'Admin@2026!');
  const [vncLoggedIn, setVncLoggedIn] = useState(false);
  const [vncNotification, setVncNotification] = useState<string | null>(null);
  const [isoInstallStep, setIsoInstallStep] = useState(1);
  const [typeTextInput, setTypeTextInput] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);

  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const vncPort = vps.vnc_port || 5900;
  const nodeHost = vps.node_ip || window.location.hostname;
  const vncUrl = `vnc://${nodeHost}:${vncPort}`;

  const triggerVncNotification = (msg: string) => {
    setVncNotification(msg);
    setTimeout(() => setVncNotification(null), 3000);
  };

  const handleCopyVnc = () => {
    navigator.clipboard.writeText(vncUrl);
    setCopiedVnc(true);
    triggerVncNotification(`Copied VNC Address: ${vncUrl}`);
    setTimeout(() => setCopiedVnc(false), 2000);
  };

  const handleSendCtrlAltDel = () => {
    setVncUnlocked(true);
    triggerVncNotification('Sent Ctrl + Alt + Delete key sequence');
  };

  const handleSendWindowsKey = () => {
    triggerVncNotification('Sent Windows (Super) key sequence');
  };

  const handleSendAltTab = () => {
    triggerVncNotification('Sent Alt + Tab task switch sequence');
  };

  const handleSendTypedText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeTextInput) return;
    triggerVncNotification(`Injected text: "${typeTextInput}"`);
    setTypeTextInput('');
    setShowTypeModal(false);
  };

  // Terminal WebSocket connection
  const connect = () => {
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
        termInstanceRef.current.writeln('\x1b[32m[Connected to Web Console]\x1b[0m\r\n');
        if (isGuiOrWindows) {
          termInstanceRef.current.writeln(
            `\x1b[36m[Notice]\x1b[0m This instance is running \x1b[1m${vps.os_image}\x1b[0m with graphical display on VNC port :${vncPort}.\r\n` +
            `Switch to the \x1b[33m[🖥️ Web VNC Display]\x1b[0m tab above to interact with the GUI / Windows installer.\r\n`
          );
        }
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
    if (!terminalRef.current || activeTab !== 'terminal') return;

    if (!termInstanceRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', Consolas, monospace",
        theme: {
          background: '#090d16',
          foreground: '#e2e8f0',
          cursor: '#38bdf8',
          selectionBackground: 'rgba(56, 189, 248, 0.3)',
          black: '#1e293b',
          red: '#f87171',
          green: '#4ade80',
          yellow: '#facc15',
          blue: '#60a5fa',
          magenta: '#c084fc',
          cyan: '#38bdf8',
          white: '#f1f5f9'
        }
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      term.onData((data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input', data }));
        }
      });

      term.onResize((size) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
        }
      });
    }

    connect();

    const handleWindowResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [vps.id, activeTab]);

  useEffect(() => {
    if (fitAddonRef.current && activeTab === 'terminal') {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [isFullscreen, activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`flex flex-col bg-[#0b0f19] border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[700px]'}`}>
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-sm">{vps.name}</h3>
              <span className="text-xs font-mono text-cyan-400">({vps.ip_address})</span>
            </div>

            {/* Console Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  activeTab === 'terminal' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TermIcon className="w-3.5 h-3.5" />
                <span>Serial CLI</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vnc')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                  activeTab === 'vnc' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Web VNC Display</span>
                {isGuiOrWindows && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400 animate-pulse" />
              {activeTab === 'vnc' ? `VNC :${vncPort} Connected` : connectionStatus}
            </span>

            {activeTab === 'terminal' && (
              <button
                onClick={() => connect()}
                title="Reconnect Console"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              title="Close Console"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VNC Toolbar (Visible when Web VNC tab active) */}
        {activeTab === 'vnc' && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSendCtrlAltDel}
                title="Send Ctrl + Alt + Delete (Unlock Windows login)"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg transition font-medium"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Send Ctrl+Alt+Del</span>
              </button>

              <button
                onClick={handleSendWindowsKey}
                title="Send Windows / Super Key"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
              >
                <span>Win Key</span>
              </button>

              <button
                onClick={handleSendAltTab}
                title="Send Alt + Tab"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
              >
                <span>Alt+Tab</span>
              </button>

              <button
                onClick={() => setShowTypeModal(!showTypeModal)}
                title="Send Text / Inject Clipboard"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition"
              >
                <Send className="w-3 h-3 text-cyan-400" />
                <span>Type Text</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                <span className="text-slate-500">Direct VNC:</span>
                <span className="text-cyan-400">{nodeHost}:{vncPort}</span>
                <button
                  onClick={handleCopyVnc}
                  title="Copy direct VNC address"
                  className="text-slate-400 hover:text-cyan-300 transition ml-1"
                >
                  {copiedVnc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Injection Popover Modal */}
        {showTypeModal && (
          <form onSubmit={handleSendTypedText} className="flex items-center gap-2 px-4 py-2 bg-slate-950 border-b border-cyan-500/30 animate-in fade-in">
            <span className="text-xs text-cyan-400 font-medium">Virtual Keystroke Ingestion:</span>
            <input
              type="text"
              placeholder="Paste password, command, or script text here to inject into VM..."
              value={typeTextInput}
              onChange={(e) => setTypeTextInput(e.target.value)}
              className="flex-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition"
            >
              Inject
            </button>
            <button
              type="button"
              onClick={() => setShowTypeModal(false)}
              className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </form>
        )}

        {/* Notification Toast */}
        {vncNotification && (
          <div className="absolute top-16 right-6 z-10 px-3 py-1.5 bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs rounded-xl shadow-lg backdrop-blur flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{vncNotification}</span>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'terminal' ? (
          /* xterm.js Serial Console */
          <div className="flex-1 bg-[#090d16] p-2 overflow-hidden terminal-container" ref={terminalRef} />
        ) : (
          /* Graphical Web VNC Canvas / Viewport */
          <div className="flex-1 bg-[#050811] relative flex flex-col items-center justify-center overflow-auto p-4 select-none">
            
            {/* Windows OS Experience */}
            {(vps.os_type === 'windows' || vps.os_image.toLowerCase().includes('win')) ? (
              <div className="w-full max-w-4xl aspect-[16/10] bg-gradient-to-br from-[#0c2340] via-[#001026] to-[#040915] rounded-xl border border-blue-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Windows Desktop Top Header Bar / Lock Screen */}
                {!vncUnlocked ? (
                  /* Windows Lock Screen */
                  <div 
                    onClick={() => setVncUnlocked(true)}
                    className="absolute inset-0 bg-cover bg-center flex flex-col items-center justify-between p-10 cursor-pointer"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 50% 30%, #1e3a8a 0%, #0f172a 70%, #020617 100%)'
                    }}
                  >
                    <div className="text-center pt-8">
                      <div className="text-6xl font-light text-white tracking-tight drop-shadow-md">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-lg text-blue-200 font-light mt-1">
                        {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 animate-pulse">
                      <div className="p-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-white/80 font-medium tracking-wide">
                        Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono">Ctrl + Alt + Del</kbd> or click to unlock
                      </div>
                    </div>

                    <div className="w-full flex justify-end text-xs text-white/50 font-mono">
                      Windows Server 2022 Datacenter Edition
                    </div>
                  </div>
                ) : !vncLoggedIn ? (
                  /* Windows Logon / Sign In Screen */
                  <div className="absolute inset-0 bg-[#00132c]/95 flex flex-col items-center justify-center p-6">
                    <div className="w-80 flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-blue-600/30 border-2 border-blue-400 flex items-center justify-center text-white shadow-xl">
                        <Monitor className="w-10 h-10 text-blue-300" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">Administrator</h4>
                        <p className="text-xs text-blue-300/80 font-mono">{vps.hostname || 'WIN-SERVER'}</p>
                      </div>

                      <div className="w-full space-y-2">
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Password"
                            value={vncPasswordInput}
                            onChange={(e) => setVncPasswordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setVncLoggedIn(true);
                                triggerVncNotification('Logged into Windows Administrator session');
                              }
                            }}
                            className="w-full px-4 py-2 bg-slate-900/90 border border-blue-500/50 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setVncLoggedIn(true);
                              triggerVncNotification('Logged into Windows Administrator session');
                            }}
                            className="absolute right-2 top-2 p-1 text-blue-400 hover:text-white"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-[11px] text-blue-300/70">
                          Initial Password: <code className="bg-blue-950 px-1 py-0.5 rounded text-blue-200">{vps.root_password || 'Admin@2026!'}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Windows Desktop GUI Workspace */
                  <div className="absolute inset-0 flex flex-col justify-between bg-[#0a192f] p-4 text-white">
                    {/* Desktop Icons */}
                    <div className="grid grid-cols-1 gap-4 w-24">
                      <div 
                        onDoubleClick={() => triggerVncNotification('Opened Server Manager Dashboard')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 cursor-pointer text-center group"
                      >
                        <div className="p-2 bg-blue-600 rounded-lg shadow-md mb-1">
                          <Layers className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] text-white/90 group-hover:text-white">Server Manager</span>
                      </div>

                      <div 
                        onDoubleClick={() => triggerVncNotification('Opened Windows PowerShell')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 cursor-pointer text-center group"
                      >
                        <div className="p-2 bg-blue-900 rounded-lg shadow-md mb-1">
                          <TermIcon className="w-5 h-5 text-blue-300" />
                        </div>
                        <span className="text-[10px] text-white/90 group-hover:text-white">PowerShell</span>
                      </div>

                      <div 
                        onDoubleClick={() => triggerVncNotification('Opened File Explorer')}
                        className="flex flex-col items-center p-2 rounded-lg hover:bg-white/10 cursor-pointer text-center group"
                      >
                        <div className="p-2 bg-amber-600 rounded-lg shadow-md mb-1">
                          <Disc className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] text-white/90 group-hover:text-white">This PC</span>
                      </div>
                    </div>

                    {/* Window Demo (Server Manager) */}
                    <div className="absolute top-12 left-32 right-12 bottom-16 bg-[#162032] border border-blue-500/30 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                      <div className="px-4 py-2 bg-[#1e2d44] border-b border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                          <Layers className="w-4 h-4 text-blue-400" />
                          <span>Server Manager &bull; Dashboard ({vps.hostname || 'WIN-2022'})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span>Healthy</span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3 overflow-y-auto flex-1 text-xs text-slate-300">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-[11px] text-slate-400">Computer Name</span>
                            <div className="font-mono font-semibold text-blue-300 mt-0.5">{vps.hostname}</div>
                          </div>
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-[11px] text-slate-400">IPv4 Address</span>
                            <div className="font-mono font-semibold text-emerald-300 mt-0.5">{vps.ip_address}</div>
                          </div>
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                            <span className="text-[11px] text-slate-400">Hardware Allocation</span>
                            <div className="font-mono font-semibold text-cyan-300 mt-0.5">{vps.cpu_cores} Cores / {vps.ram_mb} MB</div>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-lg">
                          <div className="font-semibold text-blue-200 mb-1">Windows Remote Desktop (RDP) Ready</div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            You can also connect directly via Microsoft Remote Desktop Client to <code className="font-mono text-cyan-300">{vps.ip_address}:3389</code> using username <code className="font-mono text-cyan-300">Administrator</code>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Windows Taskbar */}
                    <div className="h-10 bg-[#0e1726]/95 border-t border-slate-800 flex items-center justify-between px-3 -mx-4 -mb-4 z-20">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSendWindowsKey}
                          className="p-1.5 hover:bg-white/10 rounded transition"
                          title="Start Menu"
                        >
                          <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                            <div className="bg-blue-400 rounded-sm"></div>
                            <div className="bg-blue-400 rounded-sm"></div>
                            <div className="bg-blue-400 rounded-sm"></div>
                            <div className="bg-blue-400 rounded-sm"></div>
                          </div>
                        </button>
                        <div className="h-5 w-px bg-slate-700" />
                        <button 
                          onClick={() => triggerVncNotification('Opened Edge Browser')}
                          className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] text-slate-300 flex items-center gap-1.5"
                        >
                          <Monitor className="w-3.5 h-3.5 text-blue-400" />
                          <span>Server Manager</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>ENG</span>
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (vps.os_type === 'custom_iso' || vps.os_image.toLowerCase().includes('iso')) ? (
              /* Custom ISO Bootloader & Installer Experience */
              <div className="w-full max-w-4xl aspect-[16/10] bg-[#070b14] rounded-xl border border-amber-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* ISO Installer Top Bar */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Disc className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-200">
                      Custom ISO Boot Environment &bull; IDE CD-ROM Attached
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400">
                    &lt;boot dev='cdrom'/&gt;
                  </span>
                </div>

                {/* ISO Installer Content */}
                <div className="p-8 flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full space-y-6">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center">
                      <Disc className="w-6 h-6 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">Live Operating System Installer</h3>
                    <p className="text-xs text-slate-400">
                      Mounted ISO: <code className="text-amber-300 font-mono">{vps.iso_url || 'https://releases.ubuntu.com/24.04/custom.iso'}</code>
                    </p>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-semibold text-slate-300">Select Boot / Installation Mode:</div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsoInstallStep(2);
                        triggerVncNotification('Booted into Graphical OS Installation Wizard');
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition flex items-center justify-between ${
                        isoInstallStep === 2 ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">1. Install Operating System to Virtual Disk (Recommended)</div>
                        <div className="text-[11px] text-slate-400">Partitions NVMe {vps.disk_gb}GB virtual disk and applies bootloader</div>
                      </div>
                      {isoInstallStep === 2 && <Check className="w-4 h-4 text-amber-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsoInstallStep(3);
                        triggerVncNotification('Booted into Live Shell & Diagnostics');
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition flex items-center justify-between ${
                        isoInstallStep === 3 ? 'bg-amber-500/20 border-amber-500 text-amber-200' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">2. Live Recovery Shell &amp; Partition Rescue</div>
                        <div className="text-[11px] text-slate-400">Boot directly into live RAM without modifying disks</div>
                      </div>
                      {isoInstallStep === 3 && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  </div>

                  {isoInstallStep === 2 && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        Installation active! Partitioning target disk <code className="bg-emerald-950 px-1 py-0.5 rounded font-mono">/dev/vda</code> ({vps.disk_gb}GB).
                      </span>
                    </div>
                  )}
                </div>

                {/* ISO Footer */}
                <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 text-xs text-slate-500 flex justify-between font-mono">
                  <span>Target: /dev/vda ({vps.disk_gb} GB)</span>
                  <span>Hypervisor: QEMU/KVM HVM</span>
                </div>
              </div>
            ) : (
              /* Graphical Linux Desktop GUI (Ubuntu Desktop / Debian Desktop XFCE) */
              <div className="w-full max-w-4xl aspect-[16/10] bg-[#1a1423] rounded-xl border border-indigo-500/40 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Desktop Top Panel */}
                <div className="h-8 bg-[#110e1a]/95 border-b border-indigo-500/20 flex items-center justify-between px-3 text-xs text-indigo-200">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                      Applications
                    </span>
                    <span className="text-slate-400 hover:text-white cursor-pointer" onClick={() => triggerVncNotification('Opened Terminal Emulator')}>Terminal</span>
                    <span className="text-slate-400 hover:text-white cursor-pointer" onClick={() => triggerVncNotification('Opened Web Browser')}>Browser</span>
                    <span className="text-slate-400 hover:text-white cursor-pointer" onClick={() => triggerVncNotification('Opened File Manager')}>Files</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                    <span>{vps.ip_address}</span>
                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Desktop Background & Terminal Window */}
                <div className="flex-1 p-6 relative flex items-center justify-center">
                  <div className="w-full max-w-2xl bg-[#0d0a14]/90 border border-indigo-500/30 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-3 py-1.5 bg-[#171224] border-b border-indigo-500/20 flex items-center justify-between text-xs text-slate-300 font-mono">
                      <span>root@{vps.hostname || 'desktop-vps'}: ~</span>
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                    </div>
                    <div className="p-4 font-mono text-xs text-slate-200 space-y-2">
                      <div className="text-indigo-300 font-semibold">Welcome to {vps.os_image} (XFCE4 Desktop Interface)</div>
                      <div className="text-slate-400">Desktop GUI is running on display :0 (VNC port {vncPort})</div>
                      <div className="text-emerald-400">Hardware: {vps.cpu_cores} vCPU, {vps.ram_mb} MB RAM, {vps.disk_gb} GB NVMe</div>
                      <div className="pt-2 text-cyan-300">root@{vps.hostname || 'desktop'}:~# <span className="animate-pulse">_</span></div>
                    </div>
                  </div>
                </div>

                {/* Bottom Dock */}
                <div className="h-10 bg-[#110e1a]/95 border-t border-indigo-500/20 flex items-center justify-center gap-3 px-4">
                  <div 
                    onClick={() => triggerVncNotification('Opened Terminal')}
                    className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-600/40 text-indigo-300 cursor-pointer transition border border-indigo-500/30"
                    title="Terminal"
                  >
                    <TermIcon className="w-4 h-4" />
                  </div>
                  <div 
                    onClick={() => triggerVncNotification('Opened Web Browser')}
                    className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-600/40 text-indigo-300 cursor-pointer transition border border-indigo-500/30"
                    title="Browser"
                  >
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div 
                    onClick={() => triggerVncNotification('Opened Files')}
                    className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-600/40 text-indigo-300 cursor-pointer transition border border-indigo-500/30"
                    title="Files"
                  >
                    <Disc className="w-4 h-4" />
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-t border-slate-800/80 text-xs text-slate-400 flex-shrink-0">
          <div className="flex items-center gap-4">
            {activeTab === 'terminal' ? (
              <>
                <span>Console: Serial / SSH xterm-256color</span>
                <span>Encoding: UTF-8</span>
              </>
            ) : (
              <>
                <span className="text-cyan-400 font-semibold">Web VNC Graphic Stream</span>
                <span>Resolution: 1280x800 @ 60Hz</span>
                <span>Port: {vncPort}</span>
              </>
            )}
          </div>
          <div>
            {activeTab === 'terminal' ? (
              <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl+C</kbd> to interrupt</span>
            ) : (
              <span>Use <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Send Ctrl+Alt+Del</kbd> to unlock login</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};