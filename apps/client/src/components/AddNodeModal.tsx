import React, { useState } from 'react';
import { X, Copy, Check, Server, Terminal, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface AddNodeModalProps {
  onClose: () => void;
  onNodeAdded?: () => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({ onClose, onNodeAdded }) => {
  const { currentTheme } = useTheme();
  const [nodeName, setNodeName] = useState('');
  const [driver, setDriver] = useState('docker');
  const [loading, setLoading] = useState(false);
  const [joinData, setJoinData] = useState<{ token: string; curl_command: string; panel_url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.generateJoinToken(nodeName || 'Worker-Node');
      setJoinData(res);
      if (onNodeAdded) onNodeAdded();
    } catch (err: any) {
      alert(err.message || 'Failed to generate node join token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0e1424] border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Connect New Worker Node</h3>
              <p className="text-xs text-slate-400">Join any external Linux VPS or bare metal hypervisor to this cluster</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!joinData ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Worker Node Name</label>
                <input
                  type="text"
                  placeholder="e.g. Node-Frankfurt-02 or us-east-kvm-1"
                  value={nodeName}
                  onChange={(e) => setNodeName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Virtualization Driver</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'docker', title: 'Docker / LXC', desc: 'Container-based VPS (Fast & High Density)' },
                    { id: 'kvm', title: 'KVM / Libvirt', desc: 'Hardware Virtualization (Linux & Windows)' },
                    { id: 'mock', title: 'Mock / Staging', desc: 'Zero-dependency simulated hypervisor' }
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setDriver(item.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        driver === item.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">{item.title}</div>
                      <div className="text-xs opacity-75">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 ${currentTheme.btnPrimary} text-white font-medium rounded-xl transition disabled:opacity-50`}
                >
                  {loading ? 'Generating Join Token...' : 'Generate Node Join Command'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-emerald-300">Join Token Generated!</span>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Execute the command below on your remote VPS via SSH as <code className="text-emerald-400 font-mono">root</code>. The node will automatically pair and appear in your dashboard.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  One-Line Auto-Join Script (Run on Worker VPS)
                </label>
                <div className="relative group">
                  <pre className="p-4 bg-[#080c14] border border-slate-800 rounded-xl text-cyan-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {joinData.curl_command}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(joinData.curl_command)}
                    className="absolute top-2 right-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Command'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400">Join Token</div>
                  <div className="text-sm font-mono text-slate-200 truncate mt-1">{joinData.token}</div>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="text-xs text-slate-400">Master Panel URL</div>
                  <div className="text-sm font-mono text-slate-200 truncate mt-1">{joinData.panel_url}</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Tokens are valid for 24 hours and automatically invalidate upon successful pairing.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
