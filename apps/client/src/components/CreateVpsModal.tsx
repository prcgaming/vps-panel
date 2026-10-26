import React, { useState, useEffect } from 'react';
import { X, Cpu, HardDrive, Shield, Server, Check, Layers, Sparkles, Monitor, Disc, Terminal, AlertCircle } from 'lucide-react';
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
  const [osCategory, setOsCategory] = useState<'all' | 'linux' | 'windows' | 'gui_desktop' | 'custom_iso'>('all');
  const [osImage, setOsImage] = useState('ubuntu:24.04');
  const [selectedTemplate, setSelectedTemplate] = useState<OsTemplate | null>(null);
  const [customIsoUrl, setCustomIsoUrl] = useState('');

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
        const tmpls: OsTemplate[] = tmplRes.templates || [];
        setTemplates(tmpls);
        if (tmpls.length > 0) {
          const defaultTmpl = tmpls.find(t => t.image_ref === 'ubuntu:24.04') || tmpls[0];
          setSelectedTemplate(defaultTmpl);
          setOsImage(defaultTmpl.image_ref);
        }
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

  const handleSelectTemplate = (tmpl: OsTemplate) => {
    setSelectedTemplate(tmpl);
    setOsImage(tmpl.image_ref);
    if (tmpl.iso_url) {
      setCustomIsoUrl(tmpl.iso_url);
    }

    if (tmpl.os_type === 'windows') {
      setVirtType('hvm');
      if (cpuCores < 2) setCpuCores(2);
      if (ramMb < 4096) setRamMb(4096);
      if (diskGb < 40) setDiskGb(40);
    } else if (tmpl.os_type === 'gui_desktop') {
      setVirtType('hvm');
      if (ramMb < 2048) setRamMb(2048);
    } else if (tmpl.os_type === 'custom_iso') {
      setVirtType('hvm');
    }
  };

  const filteredTemplates = templates.filter(t => {
    if (osCategory === 'all') return true;
    if (osCategory === 'linux') return !t.os_type || t.os_type === 'linux';
    return t.os_type === osCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a VPS name');

    const effectiveOsType = selectedTemplate?.os_type || 
      (osImage.includes('win') ? 'windows' : osImage.includes('desktop') ? 'gui_desktop' : osImage.includes('iso') ? 'custom_iso' : 'linux');

    if (effectiveOsType === 'custom_iso' && !customIsoUrl.trim()) {
      return alert('Please enter a direct HTTP/HTTPS ISO download URL for the custom ISO boot.');
    }

    setSubmitting(true);
    try {
      await api.createVps({
        name,
        hostname: hostname || `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.local`,
        virt_type: effectiveOsType !== 'linux' ? 'hvm' : virtType,
        node_id: nodeId || undefined,
        os_image: osImage,
        os_type: effectiveOsType,
        iso_url: customIsoUrl || selectedTemplate?.iso_url || undefined,
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
      <div className="w-full max-w-4xl bg-[#0e1424] border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">Deploy Virtual Private Server</h3>
              <p className="text-xs text-slate-400">Choose node placement, operating system (Linux, Windows, Desktop GUI, Custom ISO), and hardware plan</p>
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
                  Full dedicated Hardware VM. Supports <strong>Windows Server, Windows 11, GUI Desktop, Custom Boot ISO</strong>, Docker inside VPS, WireGuard, nested virtualization.
                </p>
              </div>

              <div
                onClick={() => {
                  if (selectedTemplate?.os_type && selectedTemplate.os_type !== 'linux') {
                    alert('Windows, Graphical Desktop, and Custom ISO require the Dedicated HVM (KVM) hypervisor engine.');
                    return;
                  }
                  setVirtType('container');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  virtType === 'container'
                    ? 'bg-purple-500/10 border-purple-500 text-purple-200 shadow-md ring-1 ring-purple-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                } ${selectedTemplate?.os_type && selectedTemplate.os_type !== 'linux' ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2 text-slate-100">
                    <Server className="w-4 h-4 text-purple-400" />
                    ⚡ System Container (LXC / Docker)
                  </span>
                  {virtType === 'container' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Ultra lightweight Linux container. Instant 1s boot, shared kernel, high density memory for bots and fast web services. (Linux only)
                </p>
              </div>
            </div>
          </div>

          {/* Step 2: Identification & Cluster Placement */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
              Instance Identification & Node Placement
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">VPS Name *</label>
                <input
                  type="text"
                  placeholder="e.g. win-server-production"
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
                  placeholder="e.g. win01.example.com"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                onClick={() => setNodeId('')}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  nodeId === ''
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Auto-Schedule
                  </span>
                  {nodeId === '' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] opacity-75">Places on least loaded worker</p>
              </div>

              {nodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => setNodeId(node.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    nodeId === node.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs truncate">{node.name}</span>
                    {nodeId === node.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] opacity-75 truncate">{node.ip_address} | {node.driver}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Operating System (Linux, Windows, Desktop GUI, Custom ISO) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">3</span>
                Operating System & Interface
              </h4>

              {/* OS Category Tabs */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setOsCategory('all')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium ${osCategory === 'all' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All ({templates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOsCategory('linux')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${osCategory === 'linux' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Server className="w-3 h-3" /> Linux
                </button>
                <button
                  type="button"
                  onClick={() => setOsCategory('windows')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${osCategory === 'windows' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Monitor className="w-3 h-3 text-cyan-300" /> Windows
                </button>
                <button
                  type="button"
                  onClick={() => setOsCategory('gui_desktop')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${osCategory === 'gui_desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Monitor className="w-3 h-3" /> Desktop GUI
                </button>
                <button
                  type="button"
                  onClick={() => setOsCategory('custom_iso')}
                  className={`px-2.5 py-1 rounded-lg transition font-medium flex items-center gap-1 ${osCategory === 'custom_iso' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Disc className="w-3 h-3" /> Custom ISO
                </button>
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
              {filteredTemplates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id || osImage === tmpl.image_ref;
                const isWindows = tmpl.os_type === 'windows';
                const isGui = tmpl.os_type === 'gui_desktop';
                const isIso = tmpl.os_type === 'custom_iso';

                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? isWindows ? 'bg-blue-900/30 border-blue-500 text-blue-100 ring-1 ring-blue-500/50 shadow-md'
                          : isIso ? 'bg-amber-900/30 border-amber-500 text-amber-100 ring-1 ring-amber-500/50 shadow-md'
                          : 'bg-cyan-500/10 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {isWindows ? (
                          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <Monitor className="w-4 h-4" />
                          </div>
                        ) : isGui ? (
                          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            <Monitor className="w-4 h-4" />
                          </div>
                        ) : isIso ? (
                          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <Disc className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            <Server className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-xs text-slate-100 line-clamp-1">{tmpl.name}</div>
                          <div className="text-[10px] text-slate-400">{tmpl.distro} {tmpl.version}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80">
                      <span className="font-mono text-slate-400">{tmpl.image_ref}</span>
                      <span className={`px-1.5 py-0.5 rounded font-mono ${isWindows ? 'bg-blue-500/20 text-blue-300' : isIso ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                        {isWindows ? 'HVM+VNC' : isGui ? 'Desktop GUI' : isIso ? 'Boot ISO' : 'HVM/LXC'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom ISO URL Input Field */}
            {(selectedTemplate?.os_type === 'custom_iso' || osCategory === 'custom_iso') && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <Disc className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-semibold text-amber-300">Custom ISO Boot Configuration</h5>
                    <p className="text-[11px] text-amber-200/80">
                      Provide a direct HTTP or HTTPS download URL for any bootable .iso file. The worker node attaches this as a CD-ROM drive and boots first (<code className="text-xs text-amber-100">&lt;boot dev='cdrom'/&gt;</code>). You can complete installation via Web VNC Display Console.
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Direct ISO Download URL (HTTP/HTTPS) *</label>
                  <input
                    type="url"
                    placeholder="https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso"
                    value={customIsoUrl}
                    onChange={(e) => setCustomIsoUrl(e.target.value)}
                    required={selectedTemplate?.os_type === 'custom_iso'}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">Quick ISO Presets:</span>
                  <button
                    type="button"
                    onClick={() => setCustomIsoUrl('https://releases.ubuntu.com/24.04/ubuntu-24.04-live-server-amd64.iso')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
                  >
                    Ubuntu 24.04 ISO
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomIsoUrl('https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-12.7.0-amd64-netinst.iso')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
                  >
                    Debian 12 ISO
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomIsoUrl('https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-extended-3.20.0-x86_64.iso')}
                    className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
                  >
                    Alpine Extended ISO
                  </button>
                </div>
              </div>
            )}

            {/* Windows / GUI Notification Badge */}
            {selectedTemplate?.os_type === 'windows' && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2.5 text-xs text-blue-200 animate-in fade-in">
                <Monitor className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>
                  <strong>Windows Dedicated HVM:</strong> Initialized with SATA controller &amp; VNC graphical display port. Once created, open the <strong>Web VNC Console</strong> to view the Windows desktop and press <strong>Send Ctrl+Alt+Del</strong> to sign in.
                </span>
              </div>
            )}

            {selectedTemplate?.os_type === 'gui_desktop' && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center gap-2.5 text-xs text-indigo-200 animate-in fade-in">
                <Monitor className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>
                  <strong>Graphical Desktop Interface:</strong> Pre-installed with lightweight XFCE desktop environment and VNC display server. Launch with one click in the Web VNC Console tab!
                </span>
              </div>
            )}
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
              Root / Administrator Credentials
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {selectedTemplate?.os_type === 'windows' ? 'Administrator Password' : 'Root Password (Optional)'}
                </label>
                <input
                  type="password"
                  placeholder="Leave blank for auto-generated password"
                  value={rootPassword}
                  onChange={(e) => setRootPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">SSH Public Key (Linux only)</label>
                <input
                  type="text"
                  placeholder="ssh-rsa AAAA..."
                  value={sshKey}
                  onChange={(e) => setSshKey(e.target.value)}
                  disabled={selectedTemplate?.os_type === 'windows'}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 font-mono disabled:opacity-40"
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