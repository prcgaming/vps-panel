import React, { useState, useEffect } from 'react';
import { X, Cpu, HardDrive, Shield, Server, Check, Layers, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { Node, OsTemplate } from '../types';

interface CreateVpsModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateVpsModal: React.FC<CreateVpsModalProps> = ({ onClose, onCreated }) => {
  const { currentTheme } = useTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [templates, setTemplates] = useState<OsTemplate[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [hostname, setHostname] = useState('');
  const [virtType, setVirtType] = useState<'hvm' | 'container'>('hvm');
  const [nodeId, setNodeId] = useState(''); // empty = auto-schedule
  const [osImage, setOsImage] = useState('ubuntu:24.04');
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [cpuCores, setCpuCores] = useState(1);
  const [ramMb, setRamMb] = useState(1024);
  const [diskGb, setDiskGb] = useState(20);
  const [rootPassword, setRootPassword] = useState('');
  const [sshKey, setSshKey] = useState('');

  useEffect(() => {
    Promise.all([api.getNodes(), api.getTemplates()])
      .then(([nodesRes, tmplRes]) => {
        setNodes(nodesRes.nodes || []);
        setTemplates(tmplRes.templates || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, []);

  const plans = [
    { id: 'starter', name: 'Starter Micro', cpu: 1, ram: 1024, disk: 20, desc: 'Ideal for test apps & bots' },
    { id: 'standard', name: 'Standard Cloud', cpu: 2, ram: 2048, disk: 40, desc: 'Websites & APIs' },
    { id: 'pro', name: 'Pro High-Perf', cpu: 4, ram: 8192, disk: 80, desc: 'Production databases & heavy workloads' },
    { id: 'custom', name: 'Custom Sizing', cpu: cpuCores, ram: ramMb, disk: diskGb, desc: 'Tune exact cores & RAM' }
  ];

  const handlePlanSelect = (p: typeof plans[0]) => {
    setSelectedPlan(p.id);
    if (p.id !== 'custom') {
      setCpuCores(p.cpu);
      setRamMb(p.ram);
      setDiskGb(p.disk);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a VPS name');

    setSubmitting(true);
    try {
      await api.createVps({
        name,
        hostname: hostname || `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
        virt_type: virtType,
        node_id: nodeId || undefined,
        os_image: osImage,
        cpu_cores: cpuCores,
        ram_mb: ramMb,
        disk_gb: diskGb,
        root_password: rootPassword || undefined,
        ssh_key: sshKey || undefined
      });

      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create VPS');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#0e1424] border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Deploy Virtual Private Server</h3>
              <p className="text-xs text-slate-400">Choose node placement, operating system, and hardware plan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Step 1: Virtualization Engine */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">1</span>
              Virtualization Hypervisor Engine
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setVirtType('hvm')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  virtType === 'hvm'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2 text-slate-100">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    🚀 Dedicated HVM (KVM / QEMU)
                  </span>
                  {virtType === 'hvm' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Hardware Virtual Machine. Full dedicated OS kernel, Docker inside VPS, WireGuard, Windows Server, Custom ISO.
                </p>
              </div>

              <div
                onClick={() => setVirtType('container')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  virtType === 'container'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2 text-slate-100">
                    <Server className="w-4 h-4 text-purple-400" />
                    ⚡ System Container (LXC / Docker)
                  </span>
                  {virtType === 'container' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ultra lightweight container. Instant 1s boot, shared kernel, high density memory for bots and fast web services.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Identification */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
              Instance Identification
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">VPS Name *</label>
                <input
                  type="text"
                  placeholder="e.g. web-app-production"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!hostname) {
                      setHostname(`${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`);
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Hostname</label>
                <input
                  type="text"
                  placeholder="e.g. web01.example.com"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Cluster Placement */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
              Node Placement (Multi-Node Cluster)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => setNodeId('')}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  nodeId === ''
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Auto-Schedule
                  </span>
                  {nodeId === '' && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-xs opacity-75">Places on the least loaded worker node automatically</p>
              </div>

              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setNodeId(node.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    nodeId === node.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm truncate">{node.name}</span>
                    {nodeId === node.id && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="text-xs opacity-75 truncate">{node.ip_address} | {node.driver}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Operating System */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">3</span>
              Operating System Template
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setOsImage(tmpl.image_ref)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    osImage === tmpl.image_ref
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm text-slate-200">{tmpl.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{tmpl.image_ref}</div>
                  </div>
                  {osImage === tmpl.image_ref && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Hardware Sizing */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">4</span>
              Hardware Resources & Plan
            </h4>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handlePlanSelect(p)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedPlan === p.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">{p.name}</div>
                  {p.id !== 'custom' ? (
                    <div className="text-xs font-mono text-cyan-300">
                      {p.cpu} vCPU / {p.ram >= 1024 ? `${p.ram / 1024}GB` : `${p.ram}MB`} / {p.disk}GB
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Custom Sliders</div>
                  )}
                  <p className="text-[11px] opacity-75 mt-1.5">{p.desc}</p>
                </div>
              ))}
            </div>

            {selectedPlan === 'custom' && (
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 animate-in fade-in">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>CPU Cores: {cpuCores} vCPU</span>
                    <span className="text-slate-500">Max: 16 Cores</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={cpuCores}
                    onChange={(e) => setCpuCores(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>RAM: {ramMb >= 1024 ? `${(ramMb / 1024).toFixed(1)} GB` : `${ramMb} MB`}</span>
                    <span className="text-slate-500">Max: 32 GB</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="32768"
                    step="512"
                    value={ramMb}
                    onChange={(e) => setRamMb(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Disk: {diskGb} GB NVMe</span>
                    <span className="text-slate-500">Max: 500 GB</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="5"
                    value={diskGb}
                    onChange={(e) => setDiskGb(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Credentials */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">5</span>
              Root Credentials & Access
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Root Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave blank for auto-generated password"
                  value={rootPassword}
                  onChange={(e) => setRootPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SSH Public Key (Optional)</label>
                <input
                  type="text"
                  placeholder="ssh-rsa AAAA..."
                  value={sshKey}
                  onChange={(e) => setSshKey(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-400">
            Selected: <span className="font-semibold text-cyan-300">{cpuCores} vCPU</span>, <span className="font-semibold text-cyan-300">{ramMb}MB RAM</span>, <span className="font-semibold text-cyan-300">{diskGb}GB Disk</span> ({osImage})
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`px-6 py-2 ${currentTheme.btnPrimary} text-white text-sm font-medium rounded-xl transition disabled:opacity-50`}
            >
              {submitting ? 'Provisioning VPS...' : 'Deploy VPS Now'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
