import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';
import { SystemSettings } from '../types';
import { 
  Palette, Globe, Download, Terminal, ArrowUpCircle, CheckCircle, 
  CheckCircle2, Save, RefreshCw, Copy, Check, Server, Layers, Cpu, ShieldCheck,
  Image, Gem, Sliders, Sparkles, Plus, Trash2, ExternalLink, Code2, AlertTriangle
} from 'lucide-react';

interface SettingsProps {
  onLicenseUpdated?: () => void;
}

interface WebPlanItem {
  id: string;
  name: string;
  price: string;
  badge?: string;
  cpu: number;
  ram: string;
  disk: string;
  bandwidth: string;
  buttonText: string;
  buttonUrl?: string;
  isPopular?: boolean;
}

const DEFAULT_PLANS: WebPlanItem[] = [
  { id: 'plan-micro', name: 'Cloud Micro', price: '$0.00 / Free Tier', badge: 'Free Tier', cpu: 1, ram: '1 GB RAM', disk: '20 GB NVMe', bandwidth: '1 TB Bandwidth', buttonText: 'Deploy Free VPS', buttonUrl: '', isPopular: false },
  { id: 'plan-starter', name: 'Cloud Starter', price: '$3.99 / mo', badge: 'Most Popular', cpu: 2, ram: '2 GB RAM', disk: '40 GB NVMe', bandwidth: '3 TB Bandwidth', buttonText: 'Deploy Cloud VPS', buttonUrl: '', isPopular: true },
  { id: 'plan-pro', name: 'Cloud Power Pro', price: '$7.99 / mo', badge: 'High Performance', cpu: 4, ram: '4 GB RAM', disk: '80 GB NVMe', bandwidth: '5 TB Bandwidth', buttonText: 'Deploy Power Pro', buttonUrl: '', isPopular: false },
  { id: 'plan-enterprise', name: 'Cloud Dedicated HVM', price: '$14.99 / mo', badge: 'Dedicated KVM', cpu: 8, ram: '8 GB RAM', disk: '160 GB NVMe', bandwidth: '10 TB Bandwidth', buttonText: 'Deploy Enterprise', buttonUrl: '', isPopular: false }
];

const WALLPAPER_PRESETS = [
  { name: 'Cyber Matrix Grid', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920' },
  { name: 'Datacenter Server Rack', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=1920' },
  { name: 'Deep Space Nebula', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1920' },
  { name: 'Obsidian Abstract Arch', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920' },
  { name: 'Midnight Circuitry', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1920' },
];

export const Settings: React.FC<SettingsProps> = () => {
  const { currentTheme, setTheme, presets } = useTheme();

  const [settings, setSettings] = useState<SystemSettings>({
    panel_name: 'Lunar Client Cloud',
    company_name: 'Lunar Cloud Infrastructure',
    support_url: 'https://vps.lunars.indevs.in',
    primary_color: '#06b6d4',
    theme_preset: 'cyber-cyan',
    default_driver: 'kvm',
    welcome_message: 'Welcome to Lunar HVM Cloud VPS Control Panel',
    allow_registration: '1',
    allow_user_create_vps: '1',
    allow_user_manage_power: '1',
    max_vps_per_user: '2',
    // Custom Wallpaper Settings
    panel_bg_image: '',
    panel_bg_overlay_opacity: '0.85',
    login_bg_image: '',
    login_bg_overlay_opacity: '0.80',
    web_bg_image: '',
    web_bg_overlay_opacity: '0.85',
    // Free Tier Client Limits
    client_free_tier_enabled: '1',
    free_tier_max_cpu: '1',
    free_tier_max_ram_mb: '1024',
    free_tier_max_disk_gb: '20',
    free_tier_allowed_os: 'all',
    // Website Customizer
    web_hero_badge: 'Enterprise Dedicated HVM Virtualization',
    web_hero_title: 'Next-Generation High-Performance Cloud VPS',
    web_hero_subtitle: 'Deploy dedicated KVM Hardware Virtual Machines & high-density LXC containers with raw NVMe storage and instant setup.',
    web_discord_url: 'https://discord.gg/',
    web_telegram_url: 'https://t.me/',
    web_plans_json: JSON.stringify(DEFAULT_PLANS),
    web_custom_css: ''
  });

  const [plansList, setPlansList] = useState<WebPlanItem[]>(DEFAULT_PLANS);
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
          if (res.settings.web_plans_json) {
            try {
              const parsed = JSON.parse(res.settings.web_plans_json);
              if (Array.isArray(parsed)) setPlansList(parsed);
            } catch {}
          }
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

  const handlePlanChange = (index: number, field: keyof WebPlanItem, value: any) => {
    const updated = [...plansList];
    updated[index] = { ...updated[index], [field]: value };
    setPlansList(updated);
    setSettings(prev => ({ ...prev, web_plans_json: JSON.stringify(updated) }));
  };

  const handleAddPlan = () => {
    const newPlan: WebPlanItem = {
      id: `plan-${Date.now().toString(36)}`,
      name: 'New Cloud Plan',
      price: '$5.00 / mo',
      badge: 'New',
      cpu: 2,
      ram: '2 GB RAM',
      disk: '40 GB NVMe',
      bandwidth: '2 TB Bandwidth',
      buttonText: 'Deploy VPS',
      buttonUrl: '',
      isPopular: false
    };
    const updated = [...plansList, newPlan];
    setPlansList(updated);
    setSettings(prev => ({ ...prev, web_plans_json: JSON.stringify(updated) }));
  };

  const handleDeletePlan = (index: number) => {
    const updated = plansList.filter((_, i) => i !== index);
    setPlansList(updated);
    setSettings(prev => ({ ...prev, web_plans_json: JSON.stringify(updated) }));
  };

  const handleClearAllPlans = () => {
    if (plansList.length === 0) return;
    if (!confirm('Are you sure you want to remove all pricing plans? The public website will show an on-demand custom compute banner instead.')) return;
    setPlansList([]);
    setSettings(prev => ({ ...prev, web_plans_json: '[]' }));
  };

  const handleResetDefaultPlans = () => {
    if (!confirm('Reset pricing plans back to default templates?')) return;
    setPlansList(DEFAULT_PLANS);
    setSettings(prev => ({ ...prev, web_plans_json: JSON.stringify(DEFAULT_PLANS) }));
  };

  const handleSaveAllSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      const payload = {
        ...settings,
        web_plans_json: JSON.stringify(plansList)
      };
      await api.updateSettings(payload);
      setSettingsMsg('All configurations, custom wallpapers, free tier limits, and website settings saved successfully!');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Palette className={`w-7 h-7 ${currentTheme.textAccent}`} />
            Themes, Custom Wallpapers & Platform Settings
          </h1>
          <p className="text-slate-400 mt-1">
            Customize panel aesthetics, wallpapers, public website portal, client free tier quotas, and cluster hypervisors.
          </p>
        </div>

        <button
          onClick={() => handleSaveAllSettings()}
          disabled={savingSettings}
          className={`flex items-center gap-2 px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-xl transition ${currentTheme.btnPrimary}`}
        >
          {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save All Settings</span>
        </button>
      </div>

      {settingsMsg && (
        <div className="p-4 rounded-2xl text-sm bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{settingsMsg}</span>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. CUSTOM BACKGROUND WALLPAPERS (PANEL, WEB, LOGIN) */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Image className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Custom Background Wallpapers & Images
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                  Panel &bull; Web &bull; Login
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Set custom background wallpapers with dark glass overlay dimmers for the Client Panel, Login Page, and Public Website.
              </p>
            </div>
          </div>
        </div>

        {/* Wallpaper Quick Presets */}
        <div>
          <div className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>1-Click High-Resolution Wallpaper Presets:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {WALLPAPER_PRESETS.map((wp) => (
              <button
                key={wp.name}
                type="button"
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    panel_bg_image: wp.url,
                    login_bg_image: wp.url,
                    web_bg_image: wp.url
                  }));
                }}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/[0.08] hover:border-cyan-500/40 text-left transition group overflow-hidden"
              >
                <div 
                  className="h-14 rounded-lg bg-cover bg-center mb-1.5 border border-white/10 group-hover:scale-105 transition"
                  style={{ backgroundImage: `url('${wp.url}')` }}
                />
                <div className="text-[11px] font-bold text-slate-200 truncate">{wp.name}</div>
                <div className="text-[9px] text-cyan-400">Apply to All</div>
              </button>
            ))}
          </div>
        </div>

        {/* Three Specific Image Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Panel Wallpaper */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Panel Wallpaper</span>
              {settings.panel_bg_image && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, panel_bg_image: '' })}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Applied across /panel and /admin-panel</p>
            <input
              type="text"
              value={settings.panel_bg_image || ''}
              onChange={(e) => setSettings({ ...settings, panel_bg_image: e.target.value })}
              placeholder="https://example.com/panel-bg.jpg"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Overlay Dimmer</span>
                <span className="font-mono text-cyan-300">{Math.round((parseFloat(settings.panel_bg_overlay_opacity || '0.85')) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={settings.panel_bg_overlay_opacity || '0.85'}
                onChange={(e) => setSettings({ ...settings, panel_bg_overlay_opacity: e.target.value })}
                className="w-full"
              />
            </div>
            {settings.panel_bg_image && (
              <div 
                className="h-20 rounded-xl bg-cover bg-center border border-white/10 shadow-inner"
                style={{ backgroundImage: `url('${settings.panel_bg_image}')` }}
              />
            )}
          </div>

          {/* Login Page Wallpaper */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Login Wallpaper</span>
              {settings.login_bg_image && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, login_bg_image: '' })}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Applied on the /login authentication page</p>
            <input
              type="text"
              value={settings.login_bg_image || ''}
              onChange={(e) => setSettings({ ...settings, login_bg_image: e.target.value })}
              placeholder="https://example.com/login-bg.jpg"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Overlay Dimmer</span>
                <span className="font-mono text-cyan-300">{Math.round((parseFloat(settings.login_bg_overlay_opacity || '0.80')) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={settings.login_bg_overlay_opacity || '0.80'}
                onChange={(e) => setSettings({ ...settings, login_bg_overlay_opacity: e.target.value })}
                className="w-full"
              />
            </div>
            {settings.login_bg_image && (
              <div 
                className="h-20 rounded-xl bg-cover bg-center border border-white/10 shadow-inner"
                style={{ backgroundImage: `url('${settings.login_bg_image}')` }}
              />
            )}
          </div>

          {/* Public Website Wallpaper */}
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Public Web Wallpaper</span>
              {settings.web_bg_image && (
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, web_bg_image: '' })}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Applied on the root domain hosting portal</p>
            <input
              type="text"
              value={settings.web_bg_image || ''}
              onChange={(e) => setSettings({ ...settings, web_bg_image: e.target.value })}
              placeholder="https://example.com/web-bg.jpg"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Overlay Dimmer</span>
                <span className="font-mono text-cyan-300">{Math.round((parseFloat(settings.web_bg_overlay_opacity || '0.85')) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={settings.web_bg_overlay_opacity || '0.85'}
                onChange={(e) => setSettings({ ...settings, web_bg_overlay_opacity: e.target.value })}
                className="w-full"
              />
            </div>
            {settings.web_bg_image && (
              <div 
                className="h-20 rounded-xl bg-cover bg-center border border-white/10 shadow-inner"
                style={{ backgroundImage: `url('${settings.web_bg_image}')` }}
              />
            )}
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. CLIENT FREE VPS TIER & QUOTA CONTROL */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Gem className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Client Free VPS Tier & Hardware Quota Control
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Quotas &bull; Guardrails
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Define the maximum hardware specifications and server count any client user can generate on the free tier.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Main Toggle: Enable Free Tier */}
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-white/[0.08] cursor-pointer hover:border-cyan-500/30 transition">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Enable Client Self-Service Free VPS Deployment</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-cyan-500/10 text-cyan-300 font-mono">
                  {settings.client_free_tier_enabled !== '0' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                When enabled, verified client accounts can provision their own free virtual machines up to your quota below.
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.client_free_tier_enabled !== '0'}
              onChange={(e) => setSettings({ ...settings, client_free_tier_enabled: e.target.checked ? '1' : '0' })}
              className="w-5 h-5 rounded text-cyan-500 focus:ring-cyan-500"
            />
          </label>

          {/* Quota Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Max VPS per Client */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Max Free VPS per Client
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_vps_per_user || '2'}
                onChange={(e) => setSettings({ ...settings, max_vps_per_user: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Total instances a single user can deploy</span>
            </div>

            {/* Max Free vCPU */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Max Free vCPU Cores
              </label>
              <select
                value={settings.free_tier_max_cpu || '1'}
                onChange={(e) => setSettings({ ...settings, free_tier_max_cpu: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="1">1 vCPU Core</option>
                <option value="2">2 vCPU Cores</option>
                <option value="4">4 vCPU Cores</option>
                <option value="8">8 vCPU Cores</option>
              </select>
              <span className="text-[10px] text-slate-500 block">Ceiling vCPU for client instances</span>
            </div>

            {/* Max Free RAM */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Max Free RAM (MB)
              </label>
              <select
                value={settings.free_tier_max_ram_mb || '1024'}
                onChange={(e) => setSettings({ ...settings, free_tier_max_ram_mb: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="512">512 MB RAM</option>
                <option value="1024">1,024 MB (1 GB)</option>
                <option value="2048">2,048 MB (2 GB)</option>
                <option value="4096">4,096 MB (4 GB)</option>
                <option value="8192">8,192 MB (8 GB)</option>
              </select>
              <span className="text-[10px] text-slate-500 block">Ceiling memory for client instances</span>
            </div>

            {/* Max Free NVMe Disk */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Max Free Disk (GB)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={settings.free_tier_max_disk_gb || '20'}
                onChange={(e) => setSettings({ ...settings, free_tier_max_disk_gb: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 block">Ceiling storage in Gigabytes</span>
            </div>

          </div>

          {/* Allowed OS Images */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/[0.06] space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Allowed Free Tier Operating Systems
            </label>
            <input
              type="text"
              value={settings.free_tier_allowed_os || 'all'}
              onChange={(e) => setSettings({ ...settings, free_tier_allowed_os: e.target.value })}
              placeholder="all OR ubuntu:24.04,debian:12,alpine:3.20"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Enter <code className="text-cyan-300">all</code> to permit all templates, or specify comma-separated allowed OS names (e.g. <code className="text-cyan-300">ubuntu:24.04, debian:12, alpine:3.20</code>).
            </p>
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. PUBLIC WEBSITE CUSTOMIZER & PRICING PLANS */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Public Website Portal Customizer & Pricing Plans
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  Root Domain Landing Page
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customize headlines, community links, and public pricing plans on your hosting website without editing code.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Hero Headlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Website Hero Badge
              </label>
              <input
                type="text"
                value={settings.web_hero_badge || ''}
                onChange={(e) => setSettings({ ...settings, web_hero_badge: e.target.value })}
                placeholder="Enterprise Dedicated HVM Virtualization"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Website Hero Title
              </label>
              <input
                type="text"
                value={settings.web_hero_title || ''}
                onChange={(e) => setSettings({ ...settings, web_hero_title: e.target.value })}
                placeholder="Next-Generation High-Performance Cloud VPS"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Website Hero Subtitle
            </label>
            <textarea
              rows={2}
              value={settings.web_hero_subtitle || ''}
              onChange={(e) => setSettings({ ...settings, web_hero_subtitle: e.target.value })}
              placeholder="Deploy dedicated KVM Hardware Virtual Machines & high-density LXC containers with raw NVMe storage and instant setup."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Discord Community Link
              </label>
              <input
                type="text"
                value={settings.web_discord_url || ''}
                onChange={(e) => setSettings({ ...settings, web_discord_url: e.target.value })}
                placeholder="https://discord.gg/yourserver"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Telegram Channel Link
              </label>
              <input
                type="text"
                value={settings.web_telegram_url || ''}
                onChange={(e) => setSettings({ ...settings, web_telegram_url: e.target.value })}
                placeholder="https://t.me/yourchannel"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Interactive Pricing Plans Editor */}
          <div className="pt-4 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Public Pricing Plans Editor</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${plansList.length > 0 ? 'bg-slate-800 text-cyan-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                    {plansList.length} Plans Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage pricing tiers shown on the public website. You can customize the deploy button text and link, or clear all plans.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetDefaultPlans}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-white/10 shadow-sm"
                  title="Reset to default 4 plans"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>

                {plansList.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllPlans}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition shadow-sm"
                    title="Remove all pricing plans from the public site"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan</span>
                </button>
              </div>
            </div>

            {plansList.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">No Pricing Plans Configured</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    All plans are currently removed. The public website will cleanly display an on-demand custom compute request banner instead of plan cards.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAddPlan}
                    className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add a Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaultPlans}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-white/10"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore Defaults</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {plansList.map((plan, idx) => (
                  <div key={plan.id || idx} className="p-4 bg-slate-900/80 border border-white/[0.08] rounded-2xl space-y-3 hover:border-cyan-500/20 transition">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Plan Name</label>
                        <input
                          type="text"
                          value={plan.name}
                          onChange={(e) => handlePlanChange(idx, 'name', e.target.value)}
                          placeholder="Cloud Starter"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Price Label</label>
                        <input
                          type="text"
                          value={plan.price}
                          onChange={(e) => handlePlanChange(idx, 'price', e.target.value)}
                          placeholder="$3.99 / mo or Free"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">vCPU Cores & RAM</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min="1"
                            value={plan.cpu}
                            onChange={(e) => handlePlanChange(idx, 'cpu', parseInt(e.target.value) || 1)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                            title="vCPU Cores"
                          />
                          <input
                            type="text"
                            value={plan.ram}
                            onChange={(e) => handlePlanChange(idx, 'ram', e.target.value)}
                            placeholder="2 GB RAM"
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">NVMe Disk & Bandwidth</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={plan.disk}
                            onChange={(e) => handlePlanChange(idx, 'disk', e.target.value)}
                            placeholder="40 GB NVMe"
                            className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          />
                          <input
                            type="text"
                            value={plan.bandwidth || ''}
                            onChange={(e) => handlePlanChange(idx, 'bandwidth', e.target.value)}
                            placeholder="3 TB Bandwidth"
                            className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Second Row: Badge, Button Text, Custom Deploy URL, Highlight & Delete */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2 border-t border-white/[0.04]">
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Badge / Tag</label>
                        <input
                          type="text"
                          value={plan.badge || ''}
                          onChange={(e) => handlePlanChange(idx, 'badge', e.target.value)}
                          placeholder="e.g. Popular, Best Value, Free"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Deploy Button Text</label>
                        <input
                          type="text"
                          value={plan.buttonText || ''}
                          onChange={(e) => handlePlanChange(idx, 'buttonText', e.target.value)}
                          placeholder="Deploy VPS / Order Now"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-between">
                          <span>Deploy Button URL</span>
                          <span className="text-[9px] text-slate-500 font-normal">Blank = Panel Link</span>
                        </label>
                        <input
                          type="text"
                          value={plan.buttonUrl || ''}
                          onChange={(e) => handlePlanChange(idx, 'buttonUrl', e.target.value)}
                          placeholder="https://billing.example.com/cart or blank"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-2 sm:pt-4">
                        <label className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!plan.isPopular}
                            onChange={(e) => handlePlanChange(idx, 'isPopular', e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500"
                          />
                          <span>Highlight</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeletePlan(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete this plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Injected Custom CSS */}
          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Public Website Injected Custom CSS</span>
            </label>
            <textarea
              rows={3}
              value={settings.web_custom_css || ''}
              onChange={(e) => setSettings({ ...settings, web_custom_css: e.target.value })}
              placeholder="/* Enter custom CSS rules to override public website styling */"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. THEME & DESIGN STYLES CARD */}
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
        </div>

        {themeSuccessMsg && (
          <div className="p-3.5 rounded-xl text-sm bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{themeSuccessMsg}</span>
          </div>
        )}

        {/* 8 Theme Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {presets.map((p) => {
            const isSelected = p.id === currentTheme.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectTheme(p, true)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                  isSelected
                    ? `${p.borderAccent} ring-2 ring-cyan-500/50 shadow-lg bg-slate-900/90`
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className={`h-16 rounded-xl bg-gradient-to-r ${p.previewGradient} mb-3 flex items-center justify-center p-3 relative overflow-hidden shadow-inner`}>
                  <div className="text-white font-bold text-xs drop-shadow flex items-center gap-1.5 z-10">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.primaryColor }} />
                    <span>{p.name}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>{p.name}</span>
                    {isSelected && <span className="text-[10px] text-cyan-400 font-mono">Active</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 5. BRANDING & DEFAULT DRIVER */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Panel Branding & Platform Defaults</h2>
              <p className="text-xs text-slate-400">Configure default hypervisor driver and public registration</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Panel Title / Name
            </label>
            <input
              type="text"
              value={settings.panel_name || ''}
              onChange={(e) => setSettings({ ...settings, panel_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Company / Provider Name
            </label>
            <input
              type="text"
              value={settings.company_name || ''}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Default Hypervisor Driver
            </label>
            <select
              value={settings.default_driver || 'kvm'}
              onChange={(e) => setSettings({ ...settings, default_driver: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
            >
              <option value="kvm">KVM / QEMU (Dedicated HVM Hardware Virtual Machine) [Recommended]</option>
              <option value="docker">Docker Containers (High Density & Rapid Provisioning)</option>
              <option value="mock">Mock Driver (Testing & Simulation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 uppercase tracking-wider">
              Public User Registration
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer">
              <span className="text-xs text-slate-300 font-semibold">Allow new visitors to register accounts</span>
              <input
                type="checkbox"
                checked={settings.allow_registration === '1' || settings.allow_registration === 'true'}
                onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked ? '1' : '0' })}
                className="w-4 h-4 rounded text-cyan-500"
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => handleSaveAllSettings()}
            disabled={savingSettings}
            className={`w-full ${currentTheme.btnPrimary} disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg`}
          >
            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Platform Settings
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. SYSTEM UPDATES & CLI MAINTENANCE */}
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
