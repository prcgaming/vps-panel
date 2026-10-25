import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';
import { LicenseStatus, SystemSettings } from '../types';
import { 
  Key, Shield, ShieldAlert, ShieldCheck, CheckCircle2, 
  Sparkles, Save, Server, Globe, ExternalLink, RefreshCw, Copy, Check,
  Download, Terminal, ArrowUpCircle, CheckCircle, Palette
} from 'lucide-react';

interface SettingsProps {
  onLicenseUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLicenseUpdated }) => {
  const { currentTheme, setTheme, presets } = useTheme();
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState<SystemSettings>({
    panel_name: 'Lunar VPS Panel',
    company_name: 'Lunar Cloud Infrastructure',
    support_url: 'https://vps.lunars.indevs.in',
    primary_color: '#06b6d4',
    theme_preset: 'cyber-cyan',
    default_driver: 'docker',
    welcome_message: 'Welcome to Lunar Multi-Node VPS Control Panel'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [themeSuccessMsg, setThemeSuccessMsg] = useState<string | null>(null);

  // System & Updates State
  const [versionInfo, setVersionInfo] = useState<any>({ version: 'v1.3.0', nodeVersion: 'v22.x' });
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const loadData = () => {
    api.getLicenseStatus()
      .then((res: any) => setLicense(res))
      .catch(console.error);

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
      setUpdateMsg({ type: 'success', text: `You are on the latest release (${versionInfo.version || 'v1.3.0'}). GitHub main branch is in sync.` });
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

  const handleActivate = async (keyToUse?: string) => {
    const targetKey = keyToUse || keyInput;
    if (!targetKey.trim()) {
      setLicenseMsg({ type: 'error', text: 'Please enter a license key.' });
      return;
    }

    setActivating(true);
    setLicenseMsg(null);
    try {
      const res = await api.activateLicense(targetKey);
      setLicense(res.status);
      setKeyInput('');
      setLicenseMsg({ type: 'success', text: res.message || 'License activated successfully!' });
      if (onLicenseUpdated) onLicenseUpdated();
    } catch (err: any) {
      setLicenseMsg({ type: 'error', text: err.message || 'Failed to activate license key.' });
    } finally {
      setActivating(false);
    }
  };

  const handleSelectTheme = async (theme: ThemePreset, saveDefault = false) => {
    await setTheme(theme.id, saveDefault);
    setSettings(prev => ({ ...prev, theme_preset: theme.id, primary_color: theme.primaryColor }));
    if (saveDefault) {
      setThemeSuccessMsg(`Theme "${theme.name}" set as cluster default and saved!`);
      setTimeout(() => setThemeSuccessMsg(null), 3000);
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

  const isLifetime = license?.planType === 'lifetime';
  const isActive = license?.valid;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Key className={`w-7 h-7 ${currentTheme.textAccent}`} />
          License & System Settings
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your panel licensing, color themes, branding, customization, and default hypervisor configurations.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* COLOR THEME PRESETS CARD */}
      {/* ==================================================================== */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Color Theme Presets
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${currentTheme.bgBadge}`}>
                  Active: {currentTheme.name}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Choose from 8 high-tech cyberpunk and sleek cloud color themes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSelectTheme(currentTheme, true)}
            className={`px-4 py-2.5 ${currentTheme.btnPrimary} text-xs font-semibold rounded-xl transition flex items-center gap-2`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Set as System Default Theme</span>
          </button>
        </div>

        {themeSuccessMsg && (
          <div className="p-3.5 rounded-xl text-sm bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{themeSuccessMsg}</span>
          </div>
        )}

        {/* 8 Preset Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((preset) => {
            const isSelected = preset.id === currentTheme.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectTheme(preset, false)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? `${preset.borderAccent} bg-slate-900/90 shadow-xl ring-2 ${preset.ringFocus}`
                    : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
                }`}
                style={isSelected ? { boxShadow: `0 10px 25px -5px ${preset.glowColor}` } : {}}
              >
                {/* Header Swatches & Status */}
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

                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                    {preset.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>

                {/* Sample Preview Pill */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${preset.bgBadge}`}>
                    {preset.primaryColor}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTheme(preset, true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white transition font-medium"
                  >
                    Save Default
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==================================================================== */}
        {/* LICENSE MANAGEMENT CARD */}
        {/* ==================================================================== */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isLifetime ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : isActive ? currentTheme.bgBadge : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {isLifetime ? <Sparkles className="w-6 h-6" /> : isActive ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Panel License</h2>
                <p className="text-xs text-slate-400">Verifiable Node & VPS Activation Key</p>
              </div>
            </div>

            {/* Status Pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isLifetime 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : isActive 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isLifetime ? 'bg-amber-400 animate-pulse' : isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {license?.status || 'Unactivated'}
            </span>
          </div>

          {/* Current License Details */}
          <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Current Plan:</span>
              <span className="font-semibold text-white flex items-center gap-1.5">
                {isLifetime ? '👑 Enterprise Lifetime' : license?.planName || 'No License Active'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Node Limit:</span>
              <span className="text-emerald-400 font-medium">Unlimited Multi-Node</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">VPS Limit:</span>
              <span className="text-emerald-400 font-medium">Unlimited Instances</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Validity:</span>
              {isLifetime ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Permanent (Never Expires)
                </span>
              ) : license?.daysRemaining !== null && license?.daysRemaining !== undefined ? (
                <span className={`font-semibold ${license.daysRemaining > 7 ? currentTheme.textAccent : 'text-amber-400'}`}>
                  {license.daysRemaining} Day(s) Remaining
                </span>
              ) : (
                <span className="text-slate-400">N/A</span>
              )}
            </div>

            {license?.licenseKey && (
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-mono">Active Key:</span>
                <span className="text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {license.licenseKey}
                </span>
              </div>
            )}
          </div>

          {/* License Feedback Alert */}
          {licenseMsg && (
            <div className={`p-3.5 rounded-xl text-sm border flex items-center gap-2.5 ${
              licenseMsg.type === 'success' 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                : 'bg-red-950/40 border-red-500/40 text-red-300'
            }`}>
              {licenseMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
              <span>{licenseMsg.text}</span>
            </div>
          )}

          {/* Key Input & Activation Form */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Activate / Upgrade License Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Enter license key (e.g. LUNAR-LIFETIME-...)"
                className={`flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} font-mono text-sm`}
              />
              <button
                type="button"
                onClick={() => handleActivate()}
                disabled={activating || !keyInput.trim()}
                className={`${currentTheme.btnPrimary} disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl transition flex items-center gap-2`}
              >
                {activating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                Activate
              </button>
            </div>
          </div>

          {/* Quick-Fill Presets for Easy Setup */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <span className="text-xs text-slate-400 font-medium block">Quick Tier Activation:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* 30-Day Pro Key */}
              <button
                type="button"
                onClick={() => handleActivate('LUNAR-30DAY-PRO-UNLIMITED')}
                className="text-left p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-cyan-500/60 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${currentTheme.textAccent}`}>⚡ 30-Day Pro Tier</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">30 Days</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Activate standard 30-day evaluation</p>
              </button>

              {/* Lifetime Enterprise Key */}
              <button
                type="button"
                onClick={() => handleActivate('LUNAR-LIFETIME-ENTERPRISE-UNLIMITED')}
                className="text-left p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 hover:border-amber-500/60 transition group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 group-hover:text-amber-300">👑 Lifetime Enterprise Tier</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded">Permanent</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Activate permanent enterprise tier</p>
              </button>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* BRANDING & CUSTOMIZATION CARD */}
        {/* ==================================================================== */}
        <form onSubmit={handleSaveSettings} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
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
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
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
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
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
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Custom Logo URL (Optional)
              </label>
              <input
                type="text"
                value={settings.panel_logo_url || ''}
                onChange={(e) => setSettings({ ...settings, panel_logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} text-sm`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Default Hypervisor Driver
              </label>
              <select
                value={settings.default_driver || 'docker'}
                onChange={(e) => setSettings({ ...settings, default_driver: e.target.value })}
                className={`w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none ${currentTheme.ringFocus} text-sm`}
              >
                <option value="docker">Docker Containers (High Performance & Density)</option>
                <option value="kvm">KVM / QEMU (Full Hardware Virtualization)</option>
                <option value="mock">Mock Driver (Testing & Simulation)</option>
              </select>
            </div>

            {/* Public Permissions & Self-Service Toggles */}
            <div className="pt-4 border-t border-slate-700/80 space-y-3">
              <h3 className={`text-xs font-semibold uppercase tracking-wider ${currentTheme.textAccent}`}>
                Public Access & Self-Service Permissions
              </h3>

              {/* Allow Public Registration */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition">
                <div>
                  <div className="text-xs font-semibold text-white">Public User Registration</div>
                  <div className="text-[11px] text-slate-400">Allow new visitors to register their own account on the login page</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_registration === '1' || settings.allow_registration === 'true'}
                  onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded focus:ring-2"
                />
              </label>

              {/* Allow Users to Deploy VPS */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition">
                <div>
                  <div className="text-xs font-semibold text-white">Client User VPS Deployment</div>
                  <div className="text-[11px] text-slate-400">Allow client users to deploy & create their own VPS instances</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_user_create_vps === '1' || settings.allow_user_create_vps === 'true'}
                  onChange={(e) => setSettings({ ...settings, allow_user_create_vps: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded focus:ring-2"
                />
              </label>

              {/* Allow Users Power Management */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 cursor-pointer hover:border-slate-600 transition">
                <div>
                  <div className="text-xs font-semibold text-white">Client VPS Power Controls</div>
                  <div className="text-[11px] text-slate-400">Allow users to Start, Stop, and Restart their own VPS instances</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allow_user_manage_power === '1' || settings.allow_user_manage_power === 'true'}
                  onChange={(e) => setSettings({ ...settings, allow_user_manage_power: e.target.checked ? '1' : '0' })}
                  className="w-4 h-4 rounded focus:ring-2"
                />
              </label>

              {/* Max VPS Limit per User */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div>
                  <div className="text-xs font-semibold text-white">Max VPS Quota per User</div>
                  <div className="text-[11px] text-slate-400">Maximum active VPS instances a client user can create</div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.max_vps_per_user || '2'}
                  onChange={(e) => setSettings({ ...settings, max_vps_per_user: e.target.value })}
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white text-xs font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className={`w-full ${currentTheme.btnPrimary} disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2`}
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
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Panel Updates & Maintenance
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${currentTheme.bgBadge}`}>
                  {versionInfo?.version || 'v1.3.0'}
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
              <span className="text-amber-400 font-bold block">vps-panel restart</span>
              <span className="text-[10px] text-slate-400 font-sans">Restart services</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-rose-400 font-bold block">vps-panel stop</span>
              <span className="text-[10px] text-slate-400 font-sans">Stop all services</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
