import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { X, Maximize2, Minimize2, RefreshCw, Terminal as TermIcon } from 'lucide-react';
import { VpsInstance } from '../types';

interface TerminalModalProps {
  vps: VpsInstance;
  onClose: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ vps, onClose }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

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
    if (!terminalRef.current) return;

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

    // Send keystrokes
    term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Send resize
    term.onResize((size) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
      }
    });

    connect();

    const handleWindowResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [vps.id]);

  useEffect(() => {
    if (fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 100);
    }
  }, [isFullscreen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`flex flex-col bg-[#0b0f19] border border-slate-700/60 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[650px]'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
              <TermIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100">{vps.name}</h3>
                <span className="text-xs font-mono text-slate-400">({vps.ip_address})</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  connectionStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  connectionStatus === 'connecting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                    connectionStatus === 'connecting' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  {connectionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400">Host: {vps.node_name || vps.node_id} | OS: {vps.os_image}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => connect()}
              title="Reconnect Console"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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

        {/* Terminal Screen */}
        <div className="flex-1 bg-[#090d16] p-2 overflow-hidden terminal-container" ref={terminalRef}></div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Terminal: xterm.js (VT100 / xterm-256color)</span>
            <span>Encoding: UTF-8</span>
          </div>
          <div>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">Ctrl+C</kbd> to interrupt commands</div>
        </div>

      </div>
    </div>
  );
};
