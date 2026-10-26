import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTheme, THEME_PRESETS, ThemePreset } from '../context/ThemeContext';
import { SystemSettings, WebCustomPage, WebCustomSection, WebMenuItem } from '../types';
import { 
  Palette, Globe, Download, Terminal, ArrowUpCircle, CheckCircle, 
  CheckCircle2, Save, RefreshCw, Copy, Check, Server, Layers, Cpu, ShieldCheck,
  Image, Gem, Sliders, Sparkles, Plus, Trash2, ExternalLink, Code2, AlertTriangle,
  FileText, Layout, Eye, EyeOff, Edit3, X, CheckSquare, Square, Link2, BookOpen,
  Heading1, Heading2, Heading3, Type, Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Link, Table, Minus, Columns, ArrowUp, ArrowDown,
  Compass
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

const DEFAULT_PAGES: WebCustomPage[] = [
  {
    id: 'page-terms',
    title: 'Terms of Service',
    slug: 'terms',
    content: `## Terms of Service\n\nWelcome to our High-Performance Cloud VPS network.\n\n### 1. Acceptable Use Policy\nAll virtual machines must be used in compliance with international and local laws. Any illicit activities including malicious scanning, outgoing DDoS, brute-force attacks, or spamming will result in immediate service termination without refund.\n\n### 2. SLA & Hardware Reliability\nOur KVM compute clusters maintain a 99.99% hardware uptime guarantee. Automated monitoring systems continuously ensure CPU and network stability across all hypervisor nodes.\n\n### 3. Backups & Data Retention\nUsers are responsible for maintaining off-site backups of their critical data. While enterprise RAID-10 NVMe storage is used, we recommend scheduled remote snapshots.\n\n### 4. Support & Contacts\nFor inquiries or support tickets, join our official Discord community or contact our support team.`,
    showInNav: false,
    showInFooter: true,
    isPublished: true,
    updatedAt: '2026-10-26'
  },
  {
    id: 'page-privacy',
    title: 'Privacy Policy',
    slug: 'privacy',
    content: `## Privacy Policy\n\nYour privacy and operational security are our top priorities.\n\n### Data We Collect\nWe only collect basic authentication details (email, username) required to access your Client Console and manage deployed instances.\n\n### No Traffic Inspection\nWe do not monitor, log, or inspect traffic contents running inside your virtual machines. Full root access belongs solely to the instance owner.\n\n### Security Measures\nAll console connections and API endpoints use TLS 1.3 encryption with strict firewall filtering.`,
    showInNav: false,
    showInFooter: true,
    isPublished: true,
    updatedAt: '2026-10-26'
  },
  {
    id: 'page-about',
    title: 'About Us',
    slug: 'about',
    content: `## About Our Cloud Infrastructure\n\nWe provide next-generation, high-density KVM hardware virtualization engineered for developers, power users, and enterprise applications.\n\n### Our Architecture\n- **Dedicated KVM / QEMU hypervisors** with zero CPU oversubscription on high-tier plans.\n- **Direct NVMe Gen4 Storage** delivering over 5,000 MB/s IOPS.\n- **Automated Anycast Routing** and low-latency global peering.\n- **Real-Time Client Console** with emergency in-browser Web Serial terminal access.\n\nReady to get started? Access the Client Portal from the navigation bar above.`,
    showInNav: true,
    showInFooter: true,
    isPublished: true,
    updatedAt: '2026-10-26'
  }
];

const DEFAULT_NAV_MENU: WebMenuItem[] = [
  { id: 'nav-features', label: 'HVM Virtualization', url: '#features' },
  { id: 'nav-plans', label: 'Compute Plans', url: '#plans' },
  { id: 'nav-monitor', label: 'Cluster Health', url: '#monitor' },
  { id: 'nav-faq', label: 'FAQ', url: '#faq' }
];

const DEFAULT_FOOTER_MENU: WebMenuItem[] = [
  { id: 'foot-panel', label: 'Client Panel', url: 'https://vps.lunars.indevs.in' },
  { id: 'foot-support', label: 'Community & Support', url: 'https://vps.lunars.indevs.in' },
  { id: 'foot-plans', label: 'Compute Plans', url: '#plans' },
  { id: 'foot-features', label: 'Virtualization', url: '#features' }
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
    // Website Customizer & Section Visibility Defaults
    web_hero_badge: 'Enterprise Dedicated HVM Virtualization',
    web_hero_title: 'Next-Generation High-Performance Cloud VPS',
    web_hero_subtitle: 'Deploy dedicated KVM Hardware Virtual Machines & high-density LXC containers with raw NVMe storage and instant setup.',
    web_discord_url: 'https://discord.gg/',
    web_telegram_url: 'https://t.me/',
    web_show_hero: '1',
    web_show_plans: '1',
    web_show_features: '1',
    web_show_monitor: '1',
    web_show_faq: '1',
    web_plans_json: JSON.stringify(DEFAULT_PLANS),
    web_pages_json: JSON.stringify(DEFAULT_PAGES),
    web_custom_sections_json: '[]',
    web_nav_menu_json: JSON.stringify(DEFAULT_NAV_MENU),
    web_footer_menu_json: JSON.stringify(DEFAULT_FOOTER_MENU),
    web_custom_css: ''
  });

  const [plansList, setPlansList] = useState<WebPlanItem[]>(DEFAULT_PLANS);
  const [pagesList, setPagesList] = useState<WebCustomPage[]>(DEFAULT_PAGES);
  const [customSectionsList, setCustomSectionsList] = useState<WebCustomSection[]>([]);
  const [navMenuList, setNavMenuList] = useState<WebMenuItem[]>(DEFAULT_NAV_MENU);
  const [footerMenuList, setFooterMenuList] = useState<WebMenuItem[]>(DEFAULT_FOOTER_MENU);
  const [activeWebTab, setActiveWebTab] = useState<'visibility' | 'pages' | 'menus' | 'sections' | 'plans' | 'branding'>('visibility');
  const [editingPage, setEditingPage] = useState<WebCustomPage | null>(null);
  const [editingSection, setEditingSection] = useState<WebCustomSection | null>(null);
  const [editorTab, setEditorTab] = useState<'editor' | 'preview'>('editor');

  // New Menu Item Inputs
  const [newNavPageSlug, setNewNavPageSlug] = useState('');
  const [customNavLabel, setCustomNavLabel] = useState('');
  const [customNavUrl, setCustomNavUrl] = useState('');
  const [newFootPageSlug, setNewFootPageSlug] = useState('');
  const [customFootLabel, setCustomFootLabel] = useState('');
  const [customFootUrl, setCustomFootUrl] = useState('');

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
          if (res.settings.web_pages_json) {
            try {
              const parsed = JSON.parse(res.settings.web_pages_json);
              if (Array.isArray(parsed)) setPagesList(parsed);
            } catch {}
          }
          if (res.settings.web_custom_sections_json) {
            try {
              const parsed = JSON.parse(res.settings.web_custom_sections_json);
              if (Array.isArray(parsed)) setCustomSectionsList(parsed);
            } catch {}
          }
          if (res.settings.web_nav_menu_json) {
            try {
              const parsed = JSON.parse(res.settings.web_nav_menu_json);
              if (Array.isArray(parsed)) setNavMenuList(parsed);
            } catch {}
          }
          if (res.settings.web_footer_menu_json) {
            try {
              const parsed = JSON.parse(res.settings.web_footer_menu_json);
              if (Array.isArray(parsed)) setFooterMenuList(parsed);
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

  // Section Visibility Toggles (Completely remove plans or default sections)
  const handleToggleSection = (key: 'web_show_hero' | 'web_show_plans' | 'web_show_features' | 'web_show_monitor' | 'web_show_faq') => {
    const isCurrentlyVisible = settings[key] !== '0';
    const nextVal = isCurrentlyVisible ? '0' : '1';
    setSettings(prev => ({ ...prev, [key]: nextVal }));
  };

  // WordPress Editor Helpers
  const insertFormatting = (prefix: string, suffix = '', defaultText = '') => {
    if (!editingPage) return;
    const textarea = document.getElementById('page-content-editor-textarea') as HTMLTextAreaElement | null;
    let newContent = editingPage.content;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = newContent.substring(start, end) || defaultText;
      const replacement = prefix + selected + suffix;
      newContent = newContent.substring(0, start) + replacement + newContent.substring(end);
      setEditingPage({ ...editingPage, content: newContent });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 50);
    } else {
      newContent = newContent + '\n' + prefix + defaultText + suffix;
      setEditingPage({ ...editingPage, content: newContent });
    }
  };

  const insertLinkPrompt = () => {
    const url = prompt('Enter destination URL (e.g. https://example.com or #plans):', 'https://');
    if (!url) return;
    const label = prompt('Enter link anchor text:', 'Click Here') || url;
    insertFormatting(`[${label}](`, ')', url);
  };

  const insertImagePrompt = () => {
    const url = prompt('Enter image URL (e.g. https://images.unsplash.com/...):', 'https://');
    if (!url) return;
    const alt = prompt('Enter image description / alt text:', 'Image') || 'Image';
    insertFormatting(`![${alt}](`, ')', url);
  };

  const renderPreviewHtml = (content: string) => {
    if (!content) return '<p style="color:#94a3b8; font-style:italic;">No content written yet...</p>';
    if (content.trim().startsWith('<') && content.trim().endsWith('>')) {
      return content;
    }
    let html = content
      .replace(/^### (.*$)/gim, '<h3 style="font-size:1.3rem; font-weight:800; color:#fff; margin-top:20px; margin-bottom:8px;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:1.6rem; font-weight:800; color:#fff; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:6px; margin-top:24px; margin-bottom:12px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size:2rem; font-weight:800; color:#fff; margin-bottom:16px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff; font-weight:700;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em style="color:#e2e8f0;">$1</em>')
      .replace(/~~(.*?)~~/gim, '<del style="color:#94a3b8;">$1</del>')
      .replace(/<u>(.*?)<\/u>/gim, '<u style="text-underline-offset:3px;">$1</u>')
      .replace(/```([\s\S]*?)```/gim, '<pre style="background:#020617; border:1px solid rgba(255,255,255,0.1); padding:14px; border-radius:12px; overflow-x:auto; font-family:monospace; color:#38bdf8; margin:16px 0;"><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code style="background:rgba(255,255,255,0.08); padding:2px 6px; border-radius:4px; color:#67e8f9; font-family:monospace;">$1</code>')
      .replace(/^\> (.*$)/gim, '<blockquote style="border-left:3px solid #06b6d4; padding:8px 16px; background:rgba(6,182,212,0.06); border-radius:0 8px 8px 0; margin:14px 0; color:#94a3b8; font-style:italic;">$1</blockquote>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener" style="color:#38bdf8; text-decoration:underline;">$1</a>')
      .replace(/^\s*-\s+(.*$)/gim, '<li style="margin-left:20px; line-height:1.6;">$1</li>')
      .replace(/\n\s*\n/gim, '</p><p style="margin-bottom:14px; line-height:1.7;">');

    html = html.replace(/(<li[\s\S]*?<\/li>)/gim, '<ul style="margin:12px 0;">$1</ul>');
    return `<p style="margin-bottom:14px; line-height:1.7;">${html}</p>`;
  };

  // Navigation Menus Handlers (Appearance > Menus)
  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= navMenuList.length) return;
    const updated = [...navMenuList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setNavMenuList(updated);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(updated) }));
  };

  const handleDeleteNavItem = (index: number) => {
    const updated = navMenuList.filter((_, i) => i !== index);
    setNavMenuList(updated);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(updated) }));
  };

  const handleAddPageToNav = () => {
    if (!newNavPageSlug) return alert('Please select a page from the dropdown');
    const page = pagesList.find(p => p.slug === newNavPageSlug);
    if (!page) return;
    const newItem: WebMenuItem = {
      id: `nav-${page.slug}-${Date.now().toString(36).slice(-3)}`,
      label: page.title,
      url: `#${page.slug}`
    };
    const updated = [...navMenuList, newItem];
    setNavMenuList(updated);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(updated) }));
    setNewNavPageSlug('');
  };

  const handleAddCustomLinkToNav = () => {
    if (!customNavLabel.trim() || !customNavUrl.trim()) return alert('Please provide both link label and URL');
    const newItem: WebMenuItem = {
      id: `nav-custom-${Date.now().toString(36)}`,
      label: customNavLabel.trim(),
      url: customNavUrl.trim(),
      openInNewTab: customNavUrl.startsWith('http')
    };
    const updated = [...navMenuList, newItem];
    setNavMenuList(updated);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(updated) }));
    setCustomNavLabel('');
    setCustomNavUrl('');
  };

  const handleResetNavMenu = () => {
    if (!confirm('Reset Header Navigation back to default links?')) return;
    setNavMenuList(DEFAULT_NAV_MENU);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(DEFAULT_NAV_MENU) }));
  };

  const handleUpdateNavItem = (index: number, field: keyof WebMenuItem, value: any) => {
    const updated = [...navMenuList];
    updated[index] = { ...updated[index], [field]: value };
    setNavMenuList(updated);
    setSettings(prev => ({ ...prev, web_nav_menu_json: JSON.stringify(updated) }));
  };

  // Footer Menus Handlers
  const handleMoveFooterItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= footerMenuList.length) return;
    const updated = [...footerMenuList];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setFooterMenuList(updated);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(updated) }));
  };

  const handleDeleteFooterItem = (index: number) => {
    const updated = footerMenuList.filter((_, i) => i !== index);
    setFooterMenuList(updated);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(updated) }));
  };

  const handleAddPageToFooter = () => {
    if (!newFootPageSlug) return alert('Please select a page from the dropdown');
    const page = pagesList.find(p => p.slug === newFootPageSlug);
    if (!page) return;
    const newItem: WebMenuItem = {
      id: `foot-${page.slug}-${Date.now().toString(36).slice(-3)}`,
      label: page.title,
      url: `#${page.slug}`
    };
    const updated = [...footerMenuList, newItem];
    setFooterMenuList(updated);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(updated) }));
    setNewFootPageSlug('');
  };

  const handleAddCustomLinkToFooter = () => {
    if (!customFootLabel.trim() || !customFootUrl.trim()) return alert('Please provide both link label and URL');
    const newItem: WebMenuItem = {
      id: `foot-custom-${Date.now().toString(36)}`,
      label: customFootLabel.trim(),
      url: customFootUrl.trim(),
      openInNewTab: customFootUrl.startsWith('http')
    };
    const updated = [...footerMenuList, newItem];
    setFooterMenuList(updated);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(updated) }));
    setCustomFootLabel('');
    setCustomFootUrl('');
  };

  const handleResetFooterMenu = () => {
    if (!confirm('Reset Footer Links back to default?')) return;
    setFooterMenuList(DEFAULT_FOOTER_MENU);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(DEFAULT_FOOTER_MENU) }));
  };

  const handleUpdateFooterItem = (index: number, field: keyof WebMenuItem, value: any) => {
    const updated = [...footerMenuList];
    updated[index] = { ...updated[index], [field]: value };
    setFooterMenuList(updated);
    setSettings(prev => ({ ...prev, web_footer_menu_json: JSON.stringify(updated) }));
  };

  const insertTemplate = (templateKey: 'terms' | 'privacy' | 'about' | 'rules' | 'table' | 'cta' | 'callout') => {
    if (!editingPage) return;
    let snippet = '';
    if (templateKey === 'terms') {
      snippet = `\n## Terms of Service\n\n### 1. General Acceptable Use\nAll virtual machines, services, and network ports must be utilized in strict accordance with law.\n\n### 2. Forbidden Activities\n- Outgoing or incoming Denial-of-Service attacks\n- Network port scanning or penetration testing without permission\n- Mass unsolicited email (SPAM)\n\n### 3. Service Level Agreement\nWe guarantee 99.9% uptime for core virtualization nodes and network connectivity.`;
    } else if (templateKey === 'privacy') {
      snippet = `\n## Privacy Policy\n\n### 1. Information We Collect\nWe only collect your email address, account identifier, and server deployment parameters.\n\n### 2. Data Protection\nAll stored data is kept in encrypted databases with strict authentication.\n\n### 3. Third Parties\nWe do not sell, rent, or trade user private information to any third parties.`;
    } else if (templateKey === 'about') {
      snippet = `\n## About Our Cloud Infrastructure\n\nFounded by passionate systems engineers, our cloud platform delivers next-generation high-performance computing.\n\n- **100% NVMe Gen4 Storage**: Ultra-low latency read/write speeds\n- **Tier-3 Datacenter Facilities**: Redundant power generators and diverse fiber routes\n- **Automated Anti-DDoS**: Multi-terabit traffic scrubbing centers`;
    } else if (templateKey === 'rules') {
      snippet = `\n## Community & Cluster Rules\n\n1. **Be Respectful**: Treat fellow members and staff with respect.\n2. **No Abuse of Free Tier**: Free tier instances are limited to 1 per client.\n3. **Report Vulnerabilities**: Report security vulnerabilities responsibly to staff.\n4. **Keep Backups**: Store remote copies of all production data.`;
    } else if (templateKey === 'table') {
      snippet = `\n| Spec / Feature | Cloud Free Tier | Cloud Pro | Dedicated HVM |\n| --- | --- | --- | --- |\n| vCPU Cores | 1 Core | 4 Cores | 8 Dedicated |\n| RAM | 1 GB | 4 GB | 16 GB |\n| Storage | 20 GB NVMe | 80 GB NVMe | 250 GB NVMe |\n| Network Uplink | 1 Gbps | 10 Gbps | 10 Gbps Unmetered |\n`;
    } else if (templateKey === 'cta') {
      snippet = `\n<div style="background:linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.15)); border:1px solid rgba(6,182,212,0.3); border-radius:16px; padding:24px; text-align:center; margin:24px 0;">\n  <h3 style="font-size:1.3rem; font-weight:800; color:#fff; margin-bottom:8px;">Ready to Deploy Your High-Speed Cloud Instance?</h3>\n  <p style="color:#94a3b8; font-size:14px; margin-bottom:16px;">Instant setup in under 60 seconds with full root SSH and automated console access.</p>\n  <a href="/panel" style="display:inline-block; background:#06b6d4; color:#000; font-weight:700; padding:10px 24px; border-radius:12px; text-decoration:none; box-shadow:0 10px 25px -5px rgba(6,182,212,0.4);">Launch Client Panel</a>\n</div>\n`;
    } else if (templateKey === 'callout') {
      snippet = `\n<div style="background:rgba(245,158,11,0.1); border-left:4px solid #f59e0b; border-radius:0 12px 12px 0; padding:16px; margin:16px 0;">\n  <strong style="color:#fbbf24; display:block; margin-bottom:4px;">Notice & Alert</strong>\n  <span style="color:#e2e8f0; font-size:13px;">Important operational notice or announcement for users reading this page.</span>\n</div>\n`;
    }

    if (snippet) {
      setEditingPage(prev => prev ? { ...prev, content: (prev.content || '') + snippet } : null);
    }
  };

  // WordPress-Style Custom Pages Handlers
  const handleAddNewPage = () => {
    const id = `page-${Date.now().toString(36)}`;
    const newPage: WebCustomPage = {
      id,
      title: 'New Page',
      slug: `custom-page-${Date.now().toString(36).slice(-4)}`,
      content: '## New Page\n\nAdd your custom page content here using the formatting toolbar above or write HTML/Markdown.\n\n- Key Feature 1\n- Key Feature 2\n- Key Feature 3',
      showInNav: true,
      showInFooter: true,
      isPublished: true,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setEditingPage(newPage);
    setEditorTab('editor');
  };

  const handleSavePage = (pageToSave: WebCustomPage) => {
    if (!pageToSave.title.trim()) return alert('Page title is required');
    const cleanSlug = pageToSave.slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || `page-${Date.now()}`;
    const updatedPage: WebCustomPage = { 
      ...pageToSave, 
      slug: cleanSlug, 
      updatedAt: new Date().toISOString().split('T')[0] 
    };
    
    const existingIdx = pagesList.findIndex(p => p.id === updatedPage.id);
    let updatedPages: WebCustomPage[];
    if (existingIdx >= 0) {
      updatedPages = [...pagesList];
      updatedPages[existingIdx] = updatedPage;
    } else {
      updatedPages = [...pagesList, updatedPage];
    }
    setPagesList(updatedPages);

    // Sync with Navigation Menu if showInNav is checked
    let updatedNav = [...navMenuList];
    const navUrl = `#${cleanSlug}`;
    const navExists = updatedNav.some(item => item.url === navUrl);
    if (updatedPage.showInNav && !navExists) {
      updatedNav.push({
        id: `nav-${cleanSlug}-${Date.now().toString(36).slice(-3)}`,
        label: updatedPage.title,
        url: navUrl
      });
      setNavMenuList(updatedNav);
    } else if (!updatedPage.showInNav && navExists) {
      updatedNav = updatedNav.filter(item => item.url !== navUrl);
      setNavMenuList(updatedNav);
    }

    // Sync with Footer Menu if showInFooter is checked
    let updatedFoot = [...footerMenuList];
    const footExists = updatedFoot.some(item => item.url === navUrl);
    if (updatedPage.showInFooter && !footExists) {
      updatedFoot.push({
        id: `foot-${cleanSlug}-${Date.now().toString(36).slice(-3)}`,
        label: updatedPage.title,
        url: navUrl
      });
      setFooterMenuList(updatedFoot);
    } else if (!updatedPage.showInFooter && footExists) {
      updatedFoot = updatedFoot.filter(item => item.url !== navUrl);
      setFooterMenuList(updatedFoot);
    }

    setSettings(prev => ({ 
      ...prev, 
      web_pages_json: JSON.stringify(updatedPages),
      web_nav_menu_json: JSON.stringify(updatedNav),
      web_footer_menu_json: JSON.stringify(updatedFoot)
    }));
    setEditingPage(null);
  };

  const handleDeletePage = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom page?')) return;
    const pageToDelete = pagesList.find(p => p.id === id);
    const updated = pagesList.filter(p => p.id !== id);
    setPagesList(updated);

    let updatedNav = navMenuList;
    let updatedFoot = footerMenuList;
    if (pageToDelete) {
      const pageUrl = `#${pageToDelete.slug}`;
      updatedNav = navMenuList.filter(item => item.url !== pageUrl);
      updatedFoot = footerMenuList.filter(item => item.url !== pageUrl);
      setNavMenuList(updatedNav);
      setFooterMenuList(updatedFoot);
    }

    setSettings(prev => ({ 
      ...prev, 
      web_pages_json: JSON.stringify(updated),
      web_nav_menu_json: JSON.stringify(updatedNav),
      web_footer_menu_json: JSON.stringify(updatedFoot)
    }));
  };

  // Custom Homepage Sections Handlers
  const handleAddNewSection = () => {
    const newSec: WebCustomSection = {
      id: `sec-${Date.now().toString(36)}`,
      title: 'Global Datacenter Regions & Latency',
      subtitle: 'Low-latency NVMe compute instances across premier tier-3 facilities worldwide.',
      content: '### Enterprise Connectivity\n\nOur hypervisors peer with over 500 networks and major Tier-1 internet exchanges. Experience unthrottled 10Gbps uplinks with automated anti-DDoS protection.\n\n- **US East (Ashburn)**: < 10ms to NYC, Chicago\n- **EU Central (Frankfurt)**: < 15ms to London, Amsterdam, Paris\n- **Asia Pacific (Singapore)**: < 30ms to Tokyo, Sydney, Hong Kong',
      isPublished: true
    };
    setEditingSection(newSec);
  };

  const handleSaveSection = (secToSave: WebCustomSection) => {
    if (!secToSave.title.trim()) return alert('Section title is required');
    const existingIdx = customSectionsList.findIndex(s => s.id === secToSave.id);
    let updatedSections: WebCustomSection[];
    if (existingIdx >= 0) {
      updatedSections = [...customSectionsList];
      updatedSections[existingIdx] = secToSave;
    } else {
      updatedSections = [...customSectionsList, secToSave];
    }
    setCustomSectionsList(updatedSections);
    setSettings(prev => ({ ...prev, web_custom_sections_json: JSON.stringify(updatedSections) }));
    setEditingSection(null);
  };

  const handleDeleteSection = (id: string) => {
    if (!confirm('Are you sure you want to delete this homepage section?')) return;
    const updated = customSectionsList.filter(s => s.id !== id);
    setCustomSectionsList(updated);
    setSettings(prev => ({ ...prev, web_custom_sections_json: JSON.stringify(updated) }));
  };

  // Pricing Plans Handlers
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
        web_plans_json: JSON.stringify(plansList),
        web_pages_json: JSON.stringify(pagesList),
        web_custom_sections_json: JSON.stringify(customSectionsList),
        web_nav_menu_json: JSON.stringify(navMenuList),
        web_footer_menu_json: JSON.stringify(footerMenuList)
      };
      await api.updateSettings(payload);
      setSettingsMsg('All configurations, custom pages, navigation menus, and website settings saved successfully!');
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
      {/* 3. PUBLIC WEBSITE & WORDPRESS-STYLE CMS STUDIO */}
      {/* ==================================================================== */}
      <div className={`p-6 shadow-xl backdrop-blur space-y-6 ${currentTheme.cardStyle}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentTheme.bgBadge}`}>
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                Public Website Portal & CMS Studio
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  WordPress-Style Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage section visibility, remove default elements, create custom pages, insert homepage blocks, and customize pricing plans.
              </p>
            </div>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-white/[0.08] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveWebTab('visibility')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'visibility' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Section Visibility</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWebTab('pages')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'pages' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Custom Pages ({pagesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWebTab('menus')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'menus' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Menus & Navigation ({navMenuList.length + footerMenuList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWebTab('sections')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'sections' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom Blocks ({customSectionsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWebTab('plans')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'plans' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pricing Plans ({plansList.length})</span>
              {settings.web_show_plans === '0' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Plans section hidden on website" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveWebTab('branding')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeWebTab === 'branding' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hero & Branding</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: SECTION VISIBILITY (REMOVE DEFAULTS & REMOVE PLANS) */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'visibility' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Toggle any default premade section below. Turning a section OFF completely removes it from the public website layout and navigation menus.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pricing Plans Section Toggle */}
              <div className={`p-4 rounded-2xl border transition ${settings.web_show_plans !== '0' ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-950/80 border-rose-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${settings.web_show_plans !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Pricing & Compute Plans Section</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          settings.web_show_plans !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {settings.web_show_plans !== '0' ? 'Visible' : 'Hidden / Removed'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Shows the pricing cards grid and the "Compute Plans" link in header & footer.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection('web_show_plans')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      settings.web_show_plans !== '0'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {settings.web_show_plans !== '0' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.web_show_plans !== '0' ? 'Shown' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* Hero Banner Section Toggle */}
              <div className={`p-4 rounded-2xl border transition ${settings.web_show_hero !== '0' ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-950/80 border-rose-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${settings.web_show_hero !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Homepage Hero Banner</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          settings.web_show_hero !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {settings.web_show_hero !== '0' ? 'Visible' : 'Hidden / Removed'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Top banner with hero title, subtitle, badges, and primary action buttons.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection('web_show_hero')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      settings.web_show_hero !== '0'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {settings.web_show_hero !== '0' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.web_show_hero !== '0' ? 'Shown' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* Features & Architecture Grid Toggle */}
              <div className={`p-4 rounded-2xl border transition ${settings.web_show_features !== '0' ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-950/80 border-rose-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${settings.web_show_features !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Features & Architecture Grid</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          settings.web_show_features !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {settings.web_show_features !== '0' ? 'Visible' : 'Hidden / Removed'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        6 feature cards highlighting KVM isolation, VirtIO, DDoS mitigation, and serial console.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection('web_show_features')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      settings.web_show_features !== '0'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {settings.web_show_features !== '0' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.web_show_features !== '0' ? 'Shown' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* Cluster Health / Telemetry Toggle */}
              <div className={`p-4 rounded-2xl border transition ${settings.web_show_monitor !== '0' ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-950/80 border-rose-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${settings.web_show_monitor !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Live Cluster Health Card</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          settings.web_show_monitor !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {settings.web_show_monitor !== '0' ? 'Visible' : 'Hidden / Removed'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Live heartbeat card showing active driver engine, VirtIO storage, and cluster stats.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection('web_show_monitor')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      settings.web_show_monitor !== '0'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {settings.web_show_monitor !== '0' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.web_show_monitor !== '0' ? 'Shown' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              {/* FAQ Section Toggle */}
              <div className={`p-4 rounded-2xl border transition ${settings.web_show_faq !== '0' ? 'bg-slate-900/80 border-emerald-500/30' : 'bg-slate-950/80 border-rose-500/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${settings.web_show_faq !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Frequently Asked Questions (FAQ)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          settings.web_show_faq !== '0' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {settings.web_show_faq !== '0' ? 'Visible' : 'Hidden / Removed'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        FAQ grid addressing HVM virtualization, SSH login, and hardware upgrades.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSection('web_show_faq')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      settings.web_show_faq !== '0'
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {settings.web_show_faq !== '0' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{settings.web_show_faq !== '0' ? 'Shown' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: WORDPRESS-STYLE CUSTOM PAGES BUILDER */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'pages' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Custom Pages Manager</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {pagesList.length} Pages Created
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Create standalone pages (e.g. Terms of Service, Privacy Policy, Rules, About Us). They automatically get dedicated links and routing on your website.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddNewPage}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Page</span>
              </button>
            </div>

            {/* Page Editor Modal / Drawer */}
            {editingPage && (
              <div className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>{editingPage.id.includes('page-') ? 'Edit Page' : 'New Custom Page'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={editingPage.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        const slug = title.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                        setEditingPage(prev => prev ? { ...prev, title, slug: prev.slug === '' || prev.slug.startsWith('custom-page') ? slug : prev.slug } : null);
                      }}
                      placeholder="e.g. Server Rules & Guidelines"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      URL Slug & Path
                    </label>
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2">
                      <span className="text-xs text-slate-500 font-mono">/#</span>
                      <input
                        type="text"
                        value={editingPage.slug}
                        onChange={(e) => setEditingPage(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') } : null)}
                        placeholder="rules"
                        className="w-full bg-transparent text-cyan-300 font-mono text-xs focus:outline-none ml-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Display Toggles */}
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!editingPage.showInNav}
                      onChange={(e) => setEditingPage(prev => prev ? { ...prev, showInNav: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Show link in Top Navigation Bar</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!editingPage.showInFooter}
                      onChange={(e) => setEditingPage(prev => prev ? { ...prev, showInFooter: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>Show link in Footer</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-300">
                    <input
                      type="checkbox"
                      checked={editingPage.isPublished !== false}
                      onChange={(e) => setEditingPage(prev => prev ? { ...prev, isPublished: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Published (Live on Website)</span>
                  </label>
                </div>

                {/* Visual / Code WordPress Editor */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-2">
                    {/* View Switcher: Editor vs Live Preview */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
                      <button
                        type="button"
                        onClick={() => setEditorTab('editor')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                          editorTab === 'editor' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Visual & Code Editor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                          editorTab === 'preview' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Website Preview</span>
                      </button>
                    </div>

                    {/* Pre-made Template Injector */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1">Insert Template:</span>
                      <button
                        type="button"
                        onClick={() => insertTemplate('terms')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-white/5 transition"
                        title="Append Terms of Service template"
                      >
                        Terms
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('privacy')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-white/5 transition"
                        title="Append Privacy Policy template"
                      >
                        Privacy
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('rules')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-white/5 transition"
                        title="Append Server Rules template"
                      >
                        Rules
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('about')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-white/5 transition"
                        title="Append About Us template"
                      >
                        About Us
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('table')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-lg border border-white/5 transition"
                        title="Insert Comparison Table"
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTemplate('cta')}
                        className="px-2 py-1 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[11px] font-semibold rounded-lg border border-cyan-500/20 transition"
                        title="Insert Action Button CTA Banner"
                      >
                        CTA Card
                      </button>
                    </div>
                  </div>

                  {editorTab === 'editor' ? (
                    <div className="space-y-2">
                      {/* WordPress Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-950 border border-slate-700/80 rounded-xl">
                        {/* Heading Buttons */}
                        <div className="flex items-center border-r border-white/10 pr-1 mr-1 gap-0.5">
                          <button
                            type="button"
                            onClick={() => insertFormatting('# ', '', 'Main Title')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition font-bold text-xs"
                            title="Heading 1"
                          >
                            <Heading1 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('## ', '', 'Section Heading')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition font-bold text-xs"
                            title="Heading 2"
                          >
                            <Heading2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('### ', '', 'Subsection Title')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition font-bold text-xs"
                            title="Heading 3"
                          >
                            <Heading3 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Text Styling */}
                        <div className="flex items-center border-r border-white/10 pr-1 mr-1 gap-0.5">
                          <button
                            type="button"
                            onClick={() => insertFormatting('**', '**', 'bold text')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition font-bold text-xs"
                            title="Bold"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('*', '*', 'italic text')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition italic text-xs"
                            title="Italic"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<u>', '</u>', 'underlined text')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Underline"
                          >
                            <Underline className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('~~', '~~', 'strikethrough')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Strikethrough"
                          >
                            <Strikethrough className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Lists and Quotes */}
                        <div className="flex items-center border-r border-white/10 pr-1 mr-1 gap-0.5">
                          <button
                            type="button"
                            onClick={() => insertFormatting('- ', '', 'List item')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Bullet List"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('1. ', '', 'Numbered item')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Numbered List"
                          >
                            <ListOrdered className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('> ', '', 'Important note or quote')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Blockquote"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Code and Media */}
                        <div className="flex items-center border-r border-white/10 pr-1 mr-1 gap-0.5">
                          <button
                            type="button"
                            onClick={() => insertFormatting('`', '`', 'code')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs font-mono"
                            title="Inline Code"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('```bash\n', '\n```', 'echo "Hello World"')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs font-mono"
                            title="Code Block"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={insertLinkPrompt}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition text-xs"
                            title="Insert Link"
                          >
                            <Link className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={insertImagePrompt}
                            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition text-xs"
                            title="Insert Image"
                          >
                            <Image className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Elements & Helpers */}
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => insertFormatting('\n---\n', '', '')}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs"
                            title="Horizontal Divider"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertTemplate('callout')}
                            className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition text-xs"
                            title="Insert Callout Alert Box"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Main Textarea */}
                      <textarea
                        id="wp-page-content-editor"
                        rows={14}
                        value={editingPage.content}
                        onChange={(e) => setEditingPage(prev => prev ? { ...prev, content: e.target.value } : null)}
                        placeholder="## Welcome to our page&#10;&#10;Write content here with rich formatting, Markdown, or raw HTML..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
                      />
                    </div>
                  ) : (
                    /* Live Website Preview Mode */
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-300 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>Interactive Live Preview (matches how visitors see your page on the public site)</span>
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
                          /{editingPage.slug}
                        </span>
                      </div>

                      <div className="p-6 bg-slate-950 border border-white/10 rounded-2xl min-h-[300px] text-slate-200 text-sm leading-relaxed shadow-2xl">
                        <div className="mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                          <div>
                            <h1 className="text-2xl font-black text-white">{editingPage.title || 'Untitled Page'}</h1>
                            <p className="text-xs text-slate-500 mt-1">Last revised: {editingPage.updatedAt || 'Today'}</p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20">
                            Public Route: #{editingPage.slug}
                          </span>
                        </div>
                        <div 
                          className="prose prose-invert max-w-none text-slate-300 space-y-3"
                          dangerouslySetInnerHTML={{ __html: renderPreviewHtml(editingPage.content) }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setEditingPage(null)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePage(editingPage)}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow"
                  >
                    Save Page
                  </button>
                </div>
              </div>
            )}

            {/* Pages Cards Grid */}
            <div className="space-y-3">
              {pagesList.map((p) => (
                <div key={p.id} className="p-4 bg-slate-900/80 border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/20 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{p.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        /#{p.slug}
                      </span>
                      {p.isPublished === false && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      {p.showInNav && <span className="flex items-center gap-1 text-emerald-400"><Check className="w-3 h-3" /> Header Menu</span>}
                      {p.showInFooter && <span className="flex items-center gap-1 text-sky-400"><Check className="w-3 h-3" /> Footer Link</span>}
                      <span>Updated: {p.updatedAt || 'Recent'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPage(p)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-white/10"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePage(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                      title="Delete Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2.5: WORDPRESS NAVIGATION MENUS (APPEARANCE > MENUS) */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'menus' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Explanatory Banner */}
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-cyan-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-300">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Navigation & Menus Manager (WordPress Style)</h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Add custom pages and external URLs to your website. Re-order links with [↑] and [↓], or remove default items completely.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-cyan-300">
                  {navMenuList.length} Header / {footerMenuList.length} Footer
                </span>
              </div>
            </div>

            {/* Two Column Grid: Header Nav vs Footer Links */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* COLUMN 1: TOP HEADER NAVIGATION */}
              <div className="space-y-4 p-5 bg-slate-900/90 border border-white/[0.08] rounded-2xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Top Header Navigation</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {navMenuList.length} Links
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetNavMenu}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                    title="Reset to default header menu items"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Nav Items List */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {navMenuList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                      No header links configured. Use the form below to add pages or custom links.
                    </div>
                  ) : (
                    navMenuList.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="p-3 bg-slate-950/90 border border-white/10 rounded-xl flex items-center justify-between gap-2 hover:border-cyan-500/40 transition group shadow-sm"
                      >
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveNavItem(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded transition"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === navMenuList.length - 1}
                            onClick={() => handleMoveNavItem(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded transition"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title and URL Inline Editor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Label</span>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => handleUpdateNavItem(idx, 'label', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                              placeholder="Menu Title"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Destination URL / Anchor</span>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleUpdateNavItem(idx, 'url', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                              placeholder="#section or https://..."
                            />
                          </div>
                        </div>

                        {/* Remove / Delete Button */}
                        <div className="flex items-center gap-1 shrink-0 pl-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteNavItem(idx)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Remove link from Header Navigation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add to Header Controls */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Item to Header Navigation</span>
                  </div>

                  {/* Add from Custom Pages */}
                  <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Add from Custom Pages
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={newNavPageSlug}
                        onChange={(e) => setNewNavPageSlug(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Choose a Created Page --</option>
                        {pagesList.map((p) => (
                          <option key={p.id} value={p.slug}>
                            {p.title} (/#{p.slug})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddPageToNav}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow shrink-0"
                      >
                        Add Page
                      </button>
                    </div>
                  </div>

                  {/* Add Custom External Link */}
                  <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Add Custom URL / Link
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customNavLabel}
                        onChange={(e) => setCustomNavLabel(e.target.value)}
                        placeholder="Link Label (e.g. Status)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={customNavUrl}
                        onChange={(e) => setCustomNavUrl(e.target.value)}
                        placeholder="URL (e.g. #faq, https://...)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomLinkToNav}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-white/10"
                    >
                      Add Custom Link
                    </button>
                  </div>
                </div>
              </div>


              {/* COLUMN 2: WEBSITE FOOTER LINKS */}
              <div className="space-y-4 p-5 bg-slate-900/90 border border-white/[0.08] rounded-2xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Website Footer Links</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {footerMenuList.length} Links
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFooterMenu}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                    title="Reset to default footer links"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>
                </div>

                {/* Footer Items List */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {footerMenuList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-white/10 rounded-xl">
                      No footer links configured. Use the form below to add pages or custom links.
                    </div>
                  ) : (
                    footerMenuList.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="p-3 bg-slate-950/90 border border-white/10 rounded-xl flex items-center justify-between gap-2 hover:border-cyan-500/40 transition group shadow-sm"
                      >
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveFooterItem(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded transition"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === footerMenuList.length - 1}
                            onClick={() => handleMoveFooterItem(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 hover:bg-white/5 rounded transition"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title and URL Inline Editor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Label</span>
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => handleUpdateFooterItem(idx, 'label', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:outline-none focus:border-cyan-500"
                              placeholder="Link Title"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Destination URL / Anchor</span>
                            <input
                              type="text"
                              value={item.url}
                              onChange={(e) => handleUpdateFooterItem(idx, 'url', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                              placeholder="#terms or https://..."
                            />
                          </div>
                        </div>

                        {/* Remove / Delete Button */}
                        <div className="flex items-center gap-1 shrink-0 pl-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteFooterItem(idx)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Remove link from Footer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add to Footer Controls */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Item to Website Footer</span>
                  </div>

                  {/* Add from Custom Pages */}
                  <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Add from Custom Pages
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={newFootPageSlug}
                        onChange={(e) => setNewFootPageSlug(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- Choose a Created Page --</option>
                        {pagesList.map((p) => (
                          <option key={p.id} value={p.slug}>
                            {p.title} (/#{p.slug})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddPageToFooter}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow shrink-0"
                      >
                        Add Page
                      </button>
                    </div>
                  </div>

                  {/* Add Custom External Link */}
                  <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Add Custom URL / Link
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customFootLabel}
                        onChange={(e) => setCustomFootLabel(e.target.value)}
                        placeholder="Link Label (e.g. Terms)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                      <input
                        type="text"
                        value={customFootUrl}
                        onChange={(e) => setCustomFootUrl(e.target.value)}
                        placeholder="URL (e.g. #terms, https://...)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomLinkToFooter}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition border border-white/10"
                    >
                      Add Custom Link
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: CUSTOM HOMEPAGE BLOCKS & SECTIONS */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'sections' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Custom Homepage Blocks & Elements</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {customSectionsList.length} Custom Blocks Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Insert customized content sections anywhere on your public homepage. Add announcements, location maps, embeds, or special promotions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddNewSection}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Block</span>
              </button>
            </div>

            {/* Custom Section Editor */}
            {editingSection && (
              <div className="p-5 bg-slate-900 border border-cyan-500/40 rounded-2xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    <span>Edit Homepage Block</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      value={editingSection.title}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="e.g. Enterprise Global Datacenters"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Section Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={editingSection.subtitle || ''}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                      placeholder="e.g. Sub-millisecond routing across 4 continents"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Section Content (Markdown or Raw HTML)
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Supports HTML tags, widgets, or markdown</span>
                  </div>
                  <textarea
                    rows={6}
                    value={editingSection.content}
                    onChange={(e) => setEditingSection(prev => prev ? { ...prev, content: e.target.value } : null)}
                    placeholder="Enter section content or HTML..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-emerald-300">
                    <input
                      type="checkbox"
                      checked={editingSection.isPublished !== false}
                      onChange={(e) => setEditingSection(prev => prev ? { ...prev, isPublished: e.target.checked } : null)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Visible on Live Homepage</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSection(null)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveSection(editingSection)}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition shadow"
                    >
                      Save Block
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Sections List */}
            {customSectionsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 border border-dashed border-white/10 rounded-2xl space-y-2">
                <Sliders className="w-8 h-8 mx-auto text-slate-500" />
                <h4 className="text-sm font-semibold text-white">No Custom Homepage Blocks Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Add Custom Block" above to insert announcements, global location tables, or custom embeds directly into your homepage.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {customSectionsList.map((sec) => (
                  <div key={sec.id} className="p-4 bg-slate-900/80 border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-cyan-500/20 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{sec.title}</span>
                        {sec.isPublished === false && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Draft
                          </span>
                        )}
                      </div>
                      {sec.subtitle && <p className="text-xs text-slate-400">{sec.subtitle}</p>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSection(sec)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-white/10"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: PRICING PLANS EDITOR */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'plans' && (
          <div className="space-y-4 animate-in fade-in">
            {settings.web_show_plans === '0' && (
              <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Notice:</strong> The Pricing Plans section is currently <strong>HIDDEN</strong> on your website. Switch to the <strong>"Section Visibility"</strong> tab above to turn it back on.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSection('web_show_plans')}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 rounded-lg text-xs font-bold transition shrink-0"
                >
                  Make Visible
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Public Pricing Plans Editor</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${plansList.length > 0 ? 'bg-slate-800 text-cyan-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                    {plansList.length} Plans Active
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Manage pricing tiers shown on the public website. You can customize deploy button text and links, or clear all plans.
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
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: HERO HEADLINES & BRANDING */}
        {/* ------------------------------------------------------------------ */}
        {activeWebTab === 'branding' && (
          <div className="space-y-4 animate-in fade-in">
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
        )}

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
