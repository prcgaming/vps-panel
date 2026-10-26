import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface ThemePreset {
  id: string;
  name: string;
  designStyle: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  previewGradient: string;
  cardStyle: string;
  cardRadius: string;
  bodyBg: string;
  headerStyle: string;
  sidebarStyle: string;
  textAccent: string;
  textAccentHover: string;
  borderAccent: string;
  borderAccentHover: string;
  bgBadge: string;
  btnPrimary: string;
  btnSecondary: string;
  navActive: string;
  ringFocus: string;
  spinnerBorder: string;
  dotColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    designStyle: 'Glassmorphic Cyber-HUD',
    description: 'Futuristic sci-fi cockpit with frosted glass panels, neon cyan glow & cybernetic grids.',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    previewGradient: 'from-cyan-500 to-blue-600',
    cardStyle: 'bg-slate-900/60 backdrop-blur-xl border border-cyan-500/30 shadow-xl shadow-cyan-950/20',
    cardRadius: 'rounded-2xl',
    bodyBg: 'bg-[#070a12] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(0,0,0,0))]',
    headerStyle: 'bg-[#090d18]/80 backdrop-blur-md border-b border-cyan-500/20',
    sidebarStyle: 'bg-[#090d18]/90 backdrop-blur-md border-r border-cyan-500/20',
    textAccent: 'text-cyan-400',
    textAccentHover: 'hover:text-cyan-300',
    borderAccent: 'border-cyan-500/30',
    borderAccentHover: 'hover:border-cyan-500/60',
    bgBadge: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30',
    btnPrimary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25',
    btnSecondary: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    navActive: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border-l-2 border-cyan-400',
    ringFocus: 'focus:ring-cyan-500',
    spinnerBorder: 'border-cyan-500',
    dotColor: '#06b6d4'
  },
  {
    id: 'modern-saas',
    name: 'Electric Indigo',
    designStyle: 'Modern Flat SaaS',
    description: 'Clean Linear/Stripe inspired minimalism with crisp slate surfaces and elegant indigo focus.',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    previewGradient: 'from-indigo-500 to-violet-600',
    cardStyle: 'bg-[#0f1422] border border-slate-800 shadow-lg shadow-black/40',
    cardRadius: 'rounded-xl',
    bodyBg: 'bg-[#0a0d16]',
    headerStyle: 'bg-[#0c0f1a] border-b border-slate-800',
    sidebarStyle: 'bg-[#0c0f1a] border-r border-slate-800',
    textAccent: 'text-indigo-400',
    textAccentHover: 'hover:text-indigo-300',
    borderAccent: 'border-indigo-500/30',
    borderAccentHover: 'hover:border-indigo-500/60',
    bgBadge: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700',
    navActive: 'bg-indigo-500/15 text-indigo-300 border-l-2 border-indigo-400',
    ringFocus: 'focus:ring-indigo-500',
    spinnerBorder: 'border-indigo-500',
    dotColor: '#6366f1'
  },
  {
    id: 'datacenter-pro',
    name: 'Midnight Stealth',
    designStyle: 'Enterprise Datacenter Pro',
    description: 'NOC / Server-rack industrial aesthetic with sharp squared corners, dense data telemetry and steel accents.',
    primaryColor: '#94a3b8',
    secondaryColor: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    previewGradient: 'from-slate-600 to-zinc-700',
    cardStyle: 'bg-[#0c1017] border border-slate-700/80 shadow-md',
    cardRadius: 'rounded-none',
    bodyBg: 'bg-[#080b10]',
    headerStyle: 'bg-[#0a0e14] border-b border-slate-700/80',
    sidebarStyle: 'bg-[#0a0e14] border-r border-slate-700/80',
    textAccent: 'text-slate-300',
    textAccentHover: 'hover:text-white',
    borderAccent: 'border-slate-600',
    borderAccentHover: 'hover:border-slate-400',
    bgBadge: 'bg-slate-800 text-slate-300 border border-slate-600',
    btnPrimary: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-500',
    btnSecondary: 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700',
    navActive: 'bg-slate-800/80 text-white border-l-2 border-slate-400',
    ringFocus: 'focus:ring-slate-400',
    spinnerBorder: 'border-slate-400',
    dotColor: '#94a3b8'
  },
  {
    id: 'retro-synthwave',
    name: 'Rose Sakura',
    designStyle: 'Retro Synthwave Arcade',
    description: 'Neon synthwave outrun aesthetic with vibrant hot pink glow, cyber magenta and arcade retro styling.',
    primaryColor: '#f43f5e',
    secondaryColor: '#d946ef',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    previewGradient: 'from-pink-500 to-fuchsia-600',
    cardStyle: 'bg-[#150a1d]/80 backdrop-blur-xl border border-pink-500/40 shadow-xl shadow-pink-950/30',
    cardRadius: 'rounded-2xl',
    bodyBg: 'bg-[#0d0513] bg-[radial-gradient(circle_at_top,rgba(217,70,239,0.12),transparent_60%)]',
    headerStyle: 'bg-[#120719]/85 backdrop-blur-md border-b border-pink-500/30',
    sidebarStyle: 'bg-[#120719]/90 backdrop-blur-md border-r border-pink-500/30',
    textAccent: 'text-pink-400',
    textAccentHover: 'hover:text-pink-300',
    borderAccent: 'border-pink-500/40',
    borderAccentHover: 'hover:border-pink-500/70',
    bgBadge: 'bg-pink-500/10 text-pink-300 border border-pink-500/30',
    btnPrimary: 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-lg shadow-pink-500/30',
    btnSecondary: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30',
    navActive: 'bg-gradient-to-r from-pink-500/20 to-fuchsia-500/10 text-pink-300 border-l-2 border-pink-400',
    ringFocus: 'focus:ring-pink-500',
    spinnerBorder: 'border-pink-500',
    dotColor: '#f43f5e'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    designStyle: 'Hacker Terminal Matrix',
    description: 'Cyber-security operations terminal with phosphor green glow, dark scanlines and hacker aesthetics.',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    previewGradient: 'from-emerald-500 to-teal-600',
    cardStyle: 'bg-[#091510]/80 backdrop-blur-md border border-emerald-500/35 shadow-xl shadow-emerald-950/20',
    cardRadius: 'rounded-xl',
    bodyBg: 'bg-[#040a07] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_60%)]',
    headerStyle: 'bg-[#06120c]/85 backdrop-blur-md border-b border-emerald-500/25',
    sidebarStyle: 'bg-[#06120c]/90 backdrop-blur-md border-r border-emerald-500/25',
    textAccent: 'text-emerald-400',
    textAccentHover: 'hover:text-emerald-300',
    borderAccent: 'border-emerald-500/30',
    borderAccentHover: 'hover:border-emerald-500/60',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/25',
    btnSecondary: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    navActive: 'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400 font-mono',
    ringFocus: 'focus:ring-emerald-500',
    spinnerBorder: 'border-emerald-500',
    dotColor: '#10b981'
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    designStyle: 'Nordic Frost Glass',
    description: 'Scandinavian calm luxury with ice blue tones, ultra-smooth rounded-3xl cards, and arctic glass backdrop.',
    primaryColor: '#38bdf8',
    secondaryColor: '#0ea5e9',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    previewGradient: 'from-sky-400 to-blue-500',
    cardStyle: 'bg-[#0a1424]/70 backdrop-blur-2xl border border-sky-500/25 shadow-2xl shadow-sky-950/20',
    cardRadius: 'rounded-3xl',
    bodyBg: 'bg-[#050c18] bg-[radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.1),transparent_60%)]',
    headerStyle: 'bg-[#07101e]/85 backdrop-blur-lg border-b border-sky-500/20',
    sidebarStyle: 'bg-[#07101e]/90 backdrop-blur-lg border-r border-sky-500/20',
    textAccent: 'text-sky-300',
    textAccentHover: 'hover:text-sky-200',
    borderAccent: 'border-sky-500/30',
    borderAccentHover: 'hover:border-sky-400/60',
    bgBadge: 'bg-sky-500/10 text-sky-200 border border-sky-500/30',
    btnPrimary: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25',
    btnSecondary: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 border border-sky-500/30',
    navActive: 'bg-sky-500/15 text-sky-200 border-l-2 border-sky-300',
    ringFocus: 'focus:ring-sky-400',
    spinnerBorder: 'border-sky-400',
    dotColor: '#38bdf8'
  },
  {
    id: 'midnight-oled',
    name: 'Midnight OLED',
    designStyle: 'True Black OLED Monolith',
    description: '100% pure pitch black background for zero glare, battery saving, and razor-sharp high-contrast borders.',
    primaryColor: '#e2e8f0',
    secondaryColor: '#94a3b8',
    glowColor: 'rgba(255, 255, 255, 0.2)',
    previewGradient: 'from-neutral-700 to-neutral-900',
    cardStyle: 'bg-[#020202] border border-neutral-800 shadow-none',
    cardRadius: 'rounded-xl',
    bodyBg: 'bg-[#000000]',
    headerStyle: 'bg-[#020202] border-b border-neutral-800',
    sidebarStyle: 'bg-[#000000] border-r border-neutral-800',
    textAccent: 'text-neutral-100',
    textAccentHover: 'hover:text-white',
    borderAccent: 'border-neutral-700',
    borderAccentHover: 'hover:border-neutral-500',
    bgBadge: 'bg-neutral-900 text-neutral-200 border border-neutral-700',
    btnPrimary: 'bg-white text-black hover:bg-neutral-200 font-semibold shadow-sm',
    btnSecondary: 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700',
    navActive: 'bg-neutral-900 text-white border-l-2 border-white',
    ringFocus: 'focus:ring-neutral-400',
    spinnerBorder: 'border-white',
    dotColor: '#ffffff'
  },
  {
    id: 'crimson-blood',
    name: 'Crimson Blood',
    designStyle: 'Combat Valkyrie Crimson',
    description: 'High-performance gaming cockpit aesthetic with deep ruby crimson glow, aggressive styling and fiery energy.',
    primaryColor: '#ef4444',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    previewGradient: 'from-rose-600 to-red-600',
    cardStyle: 'bg-[#150709]/80 backdrop-blur-xl border border-rose-500/35 shadow-xl shadow-rose-950/30',
    cardRadius: 'rounded-2xl',
    bodyBg: 'bg-[#0c0406] bg-[radial-gradient(ellipse_at_top,rgba(239,68,68,0.12),transparent_60%)]',
    headerStyle: 'bg-[#110507]/85 backdrop-blur-md border-b border-rose-500/25',
    sidebarStyle: 'bg-[#110507]/90 backdrop-blur-md border-r border-rose-500/25',
    textAccent: 'text-rose-400',
    textAccentHover: 'hover:text-rose-300',
    borderAccent: 'border-rose-500/35',
    borderAccentHover: 'hover:border-rose-500/65',
    bgBadge: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    btnPrimary: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/25',
    btnSecondary: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30',
    navActive: 'bg-rose-500/15 text-rose-300 border-l-2 border-rose-400',
    ringFocus: 'focus:ring-rose-500',
    spinnerBorder: 'border-rose-500',
    dotColor: '#ef4444'
  }
];

interface ThemeContextType {
  currentTheme: ThemePreset;
  setTheme: (themeId: string, persistToBackend?: boolean) => Promise<void>;
  presets: ThemePreset[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem('vps_panel_theme') || 'cyber-cyan';
  });

  const currentTheme = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];

  const applyThemeCssVars = (theme: ThemePreset) => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.primaryColor);
    root.style.setProperty('--theme-secondary', theme.secondaryColor);
    root.style.setProperty('--theme-glow', theme.glowColor);
    document.body.className = `${theme.bodyBg} text-slate-100 min-h-screen transition-colors duration-200`;
  };

  useEffect(() => {
    applyThemeCssVars(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    api.getSettings()
      .then((res: any) => {
        if (res?.settings?.theme_preset) {
          const match = THEME_PRESETS.find(t => t.id === res.settings.theme_preset);
          if (match) {
            setThemeId(match.id);
            localStorage.setItem('vps_panel_theme', match.id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = async (newThemeId: string, persistToBackend = false) => {
    const match = THEME_PRESETS.find(t => t.id === newThemeId);
    if (!match) return;

    setThemeId(match.id);
    localStorage.setItem('vps_panel_theme', match.id);
    applyThemeCssVars(match);

    if (persistToBackend) {
      try {
        await api.updateSettings({
          theme_preset: match.id,
          primary_color: match.primaryColor
        });
      } catch (e) {
        console.warn('Failed to persist theme to backend', e);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, presets: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
