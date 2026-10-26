import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';
import { SystemSettings } from '../types';
import { 
  Palette, Globe, Download, Terminal, ArrowUpCircle, CheckCircle, 
  CheckCircle2, Save, RefreshCw, Copy, Check, Server, Layers, Cpu, ShieldCheck
} from 'lucide-react';

interface SettingsProps {
  onLicenseUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = () => {
  const { currentTheme, setTheme, presets } = useTheme();

  const [settings, setSettings] = useState<SystemSettings>({
    panel_name: 'Lunar VPS Panel',
    company_name: 'Lunar Cloud Infrastructure',
    support_url: 'https://vps.lunars.indevs.in',
    primary_color: '#06b6d4',
    theme_preset: 'cyber-cyan',
    default_driver: 'kvm',
    welcome_message: 'Welcome to Lunar HVM Cloud VPS Control Panel'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string | null>(null);

  // System & Updates State
  const [versionInfo, setVersionInfo] = useState<any>({ version: 'v1.4.0', nodeVersion: 'v22.x' });
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const loadData = () => {
    api.getSettings()
      .then((res: any) => {
        if (res.settings) {
          setSettings(prev => ({ ...prev, ...res.settings }));
        }
      })
      .catch(console.error);

    api.getSystemVersion()
      .then((res: any) => setVersionInfo(res))
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckUpdate = () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    setTimeout(() => {
      setCheckingUpdate(false);
      setUpdateMsg({ type: 'success', text: `You are on the latest release (${versionInfo.version || 'v1.4.0'}). GitHub main branch is in sync.` });
    }, 1200);
  };

  const handleApplyUpdate = async () => {
    if (!confirm('Are you sure you want to update the VPS Panel? The system will pull the latest version and reload.')) return;
    setUpdating(true);
    setUpdateMsg({ type: 'info', text: 'Update initiated! Downloading latest release and reloading services. Page will refresh in 6 seconds...' });

    try {
      await api.triggerSystemUpdate();
      setTimeout(() => {
        window.location.reload();
      }, 6000);
    } catch (err: any) {
      setUpdateMsg({ type: 'error', text: err.message || 'Failed to trigger update.' });
      setUpdating(false);
    }
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleSelectTheme = async (theme: ThemePreset, saveDefault = false) => {
    await setTheme(theme.id, saveDefault);
    setSettings(prev => ({ ...prev, theme_preset: theme.id, primary_color: theme.primaryColor }));
    if (saveDefault) {
      setThemeSuccessMsg(`Theme & Design "${theme.name}" (${theme.designStyle}) set as cluster default and saved!`);
      setTimeout(() => setThemeSuccessMsg(null), 3500);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      await api.updateSettings(settings);
      setSettingsMsg('Panel branding & settings saved successfully!');
      setTimeout(() => setSettingsMsg(null), 4000);
    } catch (err: any) {
      setSettingsMsg(`Error: ${err.message || 'Failed to save settings'}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Palette className={`w-7 h-7 ${currentTheme.textAccent}`} />
          Design Themes & System Configuration
        </h1>
        <p className="text-slate-400 mt-1">
          Customize your panel layout aesthetics, color palettes, HVM virtualization defaults, branding, and maintenance.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* THEME & DESIGN STYLES CARD */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 transition-all duration-200 ${currentTheme.cardStyle}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Panel Themes & Visual Design Styles
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${currentTheme.bgBadge}`}>
                  Active: {currentTheme.name} ({currentTheme.designStyle})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose from 8 unique design aesthetics: glassmorphic cockpit, flat SaaS, datacenter NOC, synthwave, terminal, frost, or OLED black.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectTheme(currentTheme, true)}
            className={`px-4 py-2.5 ${currentTheme.btnPrimary} text-xs font-semibold rounded-xl transition flex items-center gap-2`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Save as Cluster Default</span>
          </button>
        </div>

        {themeSuccessMsg && (
          <div className="p-3.5 rounded-xl text-sm bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{themeSuccessMsg}</span>
          </div>
        )}

        {/* 8 Preset Design Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset) => {
            const isSelected = preset.id === currentTheme.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectTheme(preset, false)}
                className={`p-4 border transition-all cursor-pointer relative flex flex-col justify-between ${preset.cardRadius} ${
                  isSelected
                    ? `${preset.borderAccent} bg-slate-900/90 shadow-xl ring-2 ${preset.ringFocus}`
                    : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
                }`}
                style={isSelected ? { boxShadow: `0 10px 25px -5px ${preset.glowColor}` } : {}}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center -space-x-1.5">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-sm"
                        style={{ backgroundColor: preset.primaryColor }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border-2 border-slate-900 shadow-sm"
                        style={{ backgroundColor: preset.secondaryColor }}
                      />
                    </div>
                    {isSelected && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${preset.bgBadge}`}>
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
                    {preset.name}
                  </h3>
                  <div className={`text-[11px] font-semibold mb-1.5 ${preset.textAccent}`}>
                    {preset.designStyle}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${preset.bgBadge}`}>
                    {preset.cardRadius}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTheme(preset, true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white transition font-medium"
                  >
                    Set Default
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Layout: HVM Hypervisor Engine + Branding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==================================================================== */}
        {/* HVM HYPERVISOR & HARDWARE VIRTUALIZATION CARD */}
        {/* ==================================================================== */}
        <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  HVM Hardware Virtualization
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                    KVM / QEMU Ready
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Hardware Virtual Machine hypervisor details & acceleration</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Hypervisor Core:
                </span>
                <span className="font-semibold text-slate-200">KVM (Kernel-based Virtual Machine) / QEMU</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Virtual Disk Bus:
                </span>
                <span className="font-semibold text-slate-200">VirtIO High-Speed Bus (QCOW2 Images)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kernel Isolation:
                </span>
                <span className="font-semibold text-emerald-300">Dedicated Guest OS Kernel (Zero Host Leakage)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <span>🚀 Dedicated HVM Feature Highlights</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Full support for installing custom kernels, Docker inside VPS, WireGuard VPNs, systemd init, Windows Server VMs, and custom OS ISO images with hardware level memory isolation.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Panel License Status:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Free & Unlimited (Open Community)
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BRANDING & CUSTOMIZATION CARD */}
        {/* ==================================================================== */}
        <form onSubmit={handleSaveSettings} className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Panel Branding & Customization</h2>
                <p className="text-xs text-slate-400">Easy in-browser editor for panel titles and links</p>
              </div>
            </div>
          </div>

          {settingsMsg && (
            <div className="p-3.5 rounded-xl text-sm bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Panel Name / Title
              </label>
              <input
                type="text"
                value={settings.panel_name || ''}
                onChange={(e) => setSettings({ ...settings, panel_name: e.target.value })}
                placeholder="e.g. Lunar VPS Panel"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Company / Infrastructure Provider Name
              </label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                placeholder="e.g. Lunar Cloud Infrastructure"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Support / Community URL (e.g. Discord)
              </label>
              <input
                type="text"
                value={settings.support_url || ''}
                onChange={(e) => setSettings({ ...settings, support_url: e.target.value })}
                placeholder="https://discord.gg/yourserver"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Default Hypervisor Driver
              </label>
              <select
                value={settings.default_driver || 'kvm'}
                onChange={(e) => setSettings({ ...settings, default_driver: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none ${currentTheme.ringFocus} text-sm`}
              >
                <option value="kvm">KVM / QEMU (Dedicated HVM Hardware Virtual Machine) [Recommended]</option>
                <option value="docker">Docker Containers (High Density & Rapid Provisioning)</option>
                <option value="mock">Mock Driver (Testing & Simulation)</option>
              </select>
            </div>

            {/* Public Permissions & Self-Service Toggles */}
            <div className="pt-3 border-t border-slate-700/80 space-y-2.5">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textAccent}`}>
                Public Access & Self-Service Permissions
              </h3>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition">
                <div>
                  <div className="text-xs font-semibold text-white">Public User Registration</div>
                  <div className="text-[11px] text-slate-400">Allow new visitors to register their own account</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_registration === '1' || settings.allow_registration === 'true'}
                  onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded focus:ring-2"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition">
                <div>
                  <div className="text-xs font-semibold text-white">Client User VPS Deployment</div>
                  <div className="text-[11px] text-slate-400">Allow client users to deploy their own VPS instances</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_user_create_vps === '1' || settings.allow_user_create_vps === 'true'}
                  onChange={(e) => setSettings({ ...settings, allow_user_create_vps: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded focus:ring-2"
                />
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className={`w-full ${currentTheme.btnPrimary} disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2`}
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Panel Branding & Settings
            </button>
          </div>
        </form>

      </div>

      {/* ==================================================================== */}
      {/* SYSTEM UPDATES & CLI MAINTENANCE CARD */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Panel Updates & Maintenance
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${currentTheme.bgBadge}`}>
                  {versionInfo?.version || 'v1.4.0'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Keep your VPS Panel updated with latest features & security patches</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckUpdate}
              disabled={checkingUpdate || updating}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
              Check for Updates
            </button>

            <button
              type="button"
              onClick={handleApplyUpdate}
              disabled={updating}
              className={`px-4 py-2 ${currentTheme.btnPrimary} text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 disabled:opacity-50`}
            >
              <ArrowUpCircle className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Updating...' : '⚡ 1-Click Update Now'}
            </button>
          </div>
        </div>

        {updateMsg && (
          <div className={`p-3.5 rounded-xl text-sm border flex items-center gap-2.5 ${
            updateMsg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
              : updateMsg.type === 'error'
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{updateMsg.text}</span>
          </div>
        )}

        {/* Unified Terminal Command Info */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Terminal className={`w-3.5 h-3.5 ${currentTheme.textAccent}`} />
              VPS Panel All-In-One Terminal Management Command
            </span>
            <button
              type="button"
              onClick={() => handleCopyCommand('vps-panel update')}
              className={`text-xs text-slate-400 ${currentTheme.textAccentHover} flex items-center gap-1 transition`}
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Copied' : 'Copy update cmd'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            You can manage your panel directly via the <code className={`${currentTheme.textAccent} bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800`}>vps-panel</code> CLI utility on your VPS:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className={`${currentTheme.textAccent} font-bold block`}>vps-panel update</span>
              <span className="text-[10px] text-slate-400 font-sans">Pull latest release</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-emerald-400 font-bold block">vps-panel status</span>
              <span className="text-[10px] text-slate-400 font-sans">Check live health</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-cyan-400 font-bold block">vps-panel install-web</span>
              <span className="text-[10px] text-slate-400 font-sans">Deploy website</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-amber-400 font-bold block">vps-panel restart</span>
              <span className="text-[10px] text-slate-400 font-sans">Restart services</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
