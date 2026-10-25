import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { LicenseStatus, SystemSettings } from '../types';
import { 
  Key, Shield, ShieldAlert, ShieldCheck, CheckCircle2, 
  Sparkles, Save, Server, Globe, ExternalLink, RefreshCw, Copy, Check
} from 'lucide-react';

interface SettingsProps {
  onLicenseUpdated?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onLicenseUpdated }) => {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [activating, setActivating] = useState(false);
  const [licenseMsg, setLicenseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState<SystemSettings>({
    panel_name: 'Lunar VPS Panel',
    company_name: 'Lunar Cloud Infrastructure',
    support_url: 'https://vps.lunars.indevs.in',
    primary_color: '#06b6d4',
    default_driver: 'docker',
    welcome_message: 'Welcome to Lunar Multi-Node VPS Control Panel'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);

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
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCopyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const isLifetime = license?.planType === 'lifetime';
  const isActive = license?.valid;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Key className="w-7 h-7 text-cyan-400" />
          License & System Settings
        </h1>
        <p className="text-slate-400 mt-1">
          Manage your panel licensing, branding, customization, and default hypervisor configurations.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ==================================================================== */}
        {/* LICENSE MANAGEMENT CARD */}
        {/* ==================================================================== */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isLifetime ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : isActive ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
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
                <span className={`font-semibold ${license.daysRemaining > 7 ? 'text-cyan-400' : 'text-amber-400'}`}>
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
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => handleActivate()}
                disabled={activating || !keyInput.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-cyan-600/20"
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
                  <span className="text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">⚡ 30-Day Pro Tier</span>
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
        {/* BRANDING & CUSTOMIZATION CARD ("ez to edit") */}
        {/* ==================================================================== */}
        <form onSubmit={handleSaveSettings} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
                placeholder="e.g. Lunar Cloud Systems"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Support / Discord URL
              </label>
              <input
                type="text"
                value={settings.support_url || ''}
                onChange={(e) => setSettings({ ...settings, support_url: e.target.value })}
                placeholder="https://discord.gg/yourserver"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
                Default Hypervisor Driver
              </label>
              <select
                value={settings.default_driver || 'docker'}
                onChange={(e) => setSettings({ ...settings, default_driver: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              >
                <option value="docker">Docker Containers (High Performance & Density)</option>
                <option value="kvm">KVM / QEMU (Full Hardware Virtualization)</option>
                <option value="mock">Mock Driver (Testing & Simulation)</option>
              </select>
            </div>

            {/* Public Permissions & Self-Service Toggles */}
            <div className="pt-4 border-t border-slate-700/80 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-purple-300">
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
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
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
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
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
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
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
                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Panel Branding & Settings
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
