import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  previewGradient: string;
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
    description: 'Futuristic lunar electric cyan with deep cosmic blue.',
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.35)',
    previewGradient: 'from-cyan-500 to-blue-600',
    textAccent: 'text-cyan-400',
    textAccentHover: 'hover:text-cyan-300',
    borderAccent: 'border-cyan-500/30',
    borderAccentHover: 'hover:border-cyan-500/60',
    bgBadge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    btnPrimary: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20',
    btnSecondary: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    navActive: 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border-cyan-500/30',
    ringFocus: 'focus:ring-cyan-500',
    spinnerBorder: 'border-cyan-500',
    dotColor: '#06b6d4'
  },
  {
    id: 'purple-nebula',
    name: 'Purple Nebula',
    description: 'Deep space cosmic violet with vibrant cyberpunk magenta.',
    primaryColor: '#a855f7',
    secondaryColor: '#ec4899',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    previewGradient: 'from-purple-500 to-pink-600',
    textAccent: 'text-purple-400',
    textAccentHover: 'hover:text-purple-300',
    borderAccent: 'border-purple-500/30',
    borderAccentHover: 'hover:border-purple-500/60',
    bgBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    btnPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20',
    btnSecondary: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30',
    navActive: 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-purple-300 border-purple-500/30',
    ringFocus: 'focus:ring-purple-500',
    spinnerBorder: 'border-purple-500',
    dotColor: '#a855f7'
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    description: 'Cyber security terminal style with crisp neon green and emerald.',
    primaryColor: '#10b981',
    secondaryColor: '#14b8a6',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    previewGradient: 'from-emerald-500 to-teal-600',
    textAccent: 'text-emerald-400',
    textAccentHover: 'hover:text-emerald-300',
    borderAccent: 'border-emerald-500/30',
    borderAccentHover: 'hover:border-emerald-500/60',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20',
    btnSecondary: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    navActive: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border-emerald-500/30',
    ringFocus: 'focus:ring-emerald-500',
    spinnerBorder: 'border-emerald-500',
    dotColor: '#10b981'
  },
  {
    id: 'crimson-blood',
    name: 'Crimson Blood',
    description: 'High-contrast ruby crimson with fiery red glow and dark accents.',
    primaryColor: '#ef4444',
    secondaryColor: '#f43f5e',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    previewGradient: 'from-rose-600 to-red-600',
    textAccent: 'text-rose-400',
    textAccentHover: 'hover:text-rose-300',
    borderAccent: 'border-rose-500/30',
    borderAccentHover: 'hover:border-rose-500/60',
    bgBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    btnPrimary: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/20',
    btnSecondary: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30',
    navActive: 'bg-gradient-to-r from-rose-500/15 to-red-500/15 text-rose-300 border-rose-500/30',
    ringFocus: 'focus:ring-rose-500',
    spinnerBorder: 'border-rose-500',
    dotColor: '#ef4444'
  },
  {
    id: 'golden-amber',
    name: 'Golden Amber',
    description: 'Warm solar flare with rich gold, amber, and radiant sunset orange.',
    primaryColor: '#f59e0b',
    secondaryColor: '#ea580c',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    previewGradient: 'from-amber-500 to-orange-600',
    textAccent: 'text-amber-400',
    textAccentHover: 'hover:text-amber-300',
    borderAccent: 'border-amber-500/30',
    borderAccentHover: 'hover:border-amber-500/60',
    bgBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    btnPrimary: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20',
    btnSecondary: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30',
    navActive: 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 border-amber-500/30',
    ringFocus: 'focus:ring-amber-500',
    spinnerBorder: 'border-amber-500',
    dotColor: '#f59e0b'
  },
  {
    id: 'rose-sakura',
    name: 'Rose Sakura',
    description: 'Anime cyberpunk synthwave with electric neon pink and fuchsia.',
    primaryColor: '#f43f5e',
    secondaryColor: '#d946ef',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    previewGradient: 'from-pink-500 to-fuchsia-600',
    textAccent: 'text-pink-400',
    textAccentHover: 'hover:text-pink-300',
    borderAccent: 'border-pink-500/30',
    borderAccentHover: 'hover:border-pink-500/60',
    bgBadge: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    btnPrimary: 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white shadow-lg shadow-pink-500/20',
    btnSecondary: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30',
    navActive: 'bg-gradient-to-r from-pink-500/15 to-fuchsia-500/15 text-pink-300 border-pink-500/30',
    ringFocus: 'focus:ring-pink-500',
    spinnerBorder: 'border-pink-500',
    dotColor: '#f43f5e'
  },
  {
    id: 'electric-indigo',
    name: 'Electric Indigo',
    description: 'Deep electric indigo and cosmic violet with a sleek enterprise feel.',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    previewGradient: 'from-indigo-500 to-violet-600',
    textAccent: 'text-indigo-400',
    textAccentHover: 'hover:text-indigo-300',
    borderAccent: 'border-indigo-500/30',
    borderAccentHover: 'hover:border-indigo-500/60',
    bgBadge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    btnPrimary: 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20',
    btnSecondary: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    navActive: 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-300 border-indigo-500/30',
    ringFocus: 'focus:ring-indigo-500',
    spinnerBorder: 'border-indigo-500',
    dotColor: '#6366f1'
  },
  {
    id: 'midnight-stealth',
    name: 'Midnight Stealth',
    description: 'Minimalist industrial carbon steel with clean monochrome accents.',
    primaryColor: '#94a3b8',
    secondaryColor: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    previewGradient: 'from-slate-500 to-zinc-600',
    textAccent: 'text-slate-300',
    textAccentHover: 'hover:text-white',
    borderAccent: 'border-slate-500/30',
    borderAccentHover: 'hover:border-slate-400/60',
    bgBadge: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    btnPrimary: 'bg-gradient-to-r from-slate-700 to-zinc-700 hover:from-slate-600 hover:to-zinc-600 text-white shadow-lg shadow-slate-500/20',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700',
    navActive: 'bg-gradient-to-r from-slate-500/15 to-zinc-500/15 text-slate-200 border-slate-500/30',
    ringFocus: 'focus:ring-slate-400',
    spinnerBorder: 'border-slate-400',
    dotColor: '#94a3b8'
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
  };

  useEffect(() => {
    applyThemeCssVars(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    // Attempt to load default theme from backend settings
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
