import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

// ─── Inline style tokens per theme ───────────────────────────────────────────
// Used by pages that rely on inline styles (Dashboard, ConfigureResources, etc.)
export const themeTokens = {
  default: {
    bg:           '#000000',
    bgGrid:       true,
    card:         { backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '1.25rem' },
    cardSm:       { backgroundColor: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem' },
    input:        { border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff' },
    textPrimary:  '#ffffff',
    textSecondary:'#94a3b8',
    textMuted:    '#475569',
    accent:       '#22d3ee',
    accentBg:     'rgba(34,211,238,0.08)',
    accentBorder: 'rgba(34,211,238,0.2)',
    divider:      'rgba(255,255,255,0.07)',
    tooltipBg:    '#0a0f1a',
    tooltipBorder:'rgba(255,255,255,0.12)',
    chartGrid:    'rgba(255,255,255,0.04)',
    chartTick:    '#475569',
    pillActive:   { backgroundColor: '#22d3ee', color: '#000' },
    pillInactive: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' },
    dropZoneBorder: 'rgba(255,255,255,0.12)',
    dropZoneBg:   'rgba(255,255,255,0.02)',
    summaryCard:  { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' },
  },
  light: {
    bg:           '#F1F5F9',
    bgGrid:       false,
    card:         { backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    cardSm:       { backgroundColor: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
    input:        { border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A' },
    textPrimary:  '#0F172A',
    textSecondary:'#475569',
    textMuted:    '#94a3b8',
    accent:       '#0ea5e9',
    accentBg:     'rgba(14,165,233,0.08)',
    accentBorder: 'rgba(14,165,233,0.25)',
    divider:      '#E2E8F0',
    tooltipBg:    '#ffffff',
    tooltipBorder:'#E2E8F0',
    chartGrid:    'rgba(0,0,0,0.06)',
    chartTick:    '#94a3b8',
    pillActive:   { backgroundColor: '#0ea5e9', color: '#fff' },
    pillInactive: { backgroundColor: '#F1F5F9', color: '#64748b', border: '1px solid #E2E8F0' },
    dropZoneBorder: '#CBD5E1',
    dropZoneBg:   '#F8FAFC',
    summaryCard:  { backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' },
  },
  dark: {
    bg:           '#0f172a',
    bgGrid:       false,
    card:         { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '14px', padding: '1.25rem' },
    cardSm:       { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '1.5rem' },
    input:        { border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f1f5f9' },
    textPrimary:  '#f1f5f9',
    textSecondary:'#94a3b8',
    textMuted:    '#64748b',
    accent:       '#818cf8',
    accentBg:     'rgba(129,140,248,0.1)',
    accentBorder: 'rgba(129,140,248,0.3)',
    divider:      '#334155',
    tooltipBg:    '#1e293b',
    tooltipBorder:'#334155',
    chartGrid:    'rgba(255,255,255,0.05)',
    chartTick:    '#64748b',
    pillActive:   { backgroundColor: '#818cf8', color: '#fff' },
    pillInactive: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#94a3b8' },
    dropZoneBorder: '#334155',
    dropZoneBg:   'rgba(255,255,255,0.02)',
    summaryCard:  { backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid #334155' },
  },
};

export const themes = {
  default: {
    name: 'Default', key: 'default',
    sidebar: 'border-r',
    sidebarText: 'text-white',
    sidebarNavActive: 'text-cyan-400',
    sidebarNavInactive: 'text-slate-400 hover:text-white',
    sidebarFooter: 'border-t',
    sidebarUserName: 'text-white',
    sidebarUserSub: 'text-slate-500',
    main: '',
    card: 'rounded-2xl p-6',
    cardHover: '',
    heading: 'text-white',
    subtext: 'text-slate-400',
    label: 'text-slate-300',
    input: 'rounded-xl border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500',
    tableHead: 'text-slate-400',
    tableRow: '',
    tableCell: 'text-slate-300',
    btnPrimary: 'rounded-xl font-semibold text-black',
    btnSecondary: 'rounded-xl text-slate-300 border',
    divider: 'border-white/10',
    badge: 'text-slate-400',
    mobileHeader: '',
  },
  light: {
    name: 'Light', key: 'light',
    sidebar: 'bg-white border-r border-slate-200',
    sidebarText: 'text-slate-900',
    sidebarNavActive: 'bg-sky-50 text-sky-600',
    sidebarNavInactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    sidebarFooter: 'border-t border-slate-200',
    sidebarUserName: 'text-slate-900',
    sidebarUserSub: 'text-slate-500',
    main: 'bg-slate-100',
    card: 'bg-white border border-slate-200 shadow-sm rounded-2xl p-6',
    cardHover: 'hover:shadow-md',
    heading: 'text-slate-900',
    subtext: 'text-slate-500',
    label: 'text-slate-700',
    input: 'bg-slate-50 border-slate-300 text-slate-900 rounded-xl focus:ring-sky-400 focus:outline-none focus:ring-2',
    tableHead: 'text-slate-500',
    tableRow: 'border-slate-100 hover:bg-slate-50',
    tableCell: 'text-slate-700',
    btnPrimary: 'bg-sky-500 hover:bg-sky-600 text-white rounded-xl',
    btnSecondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl',
    divider: 'border-slate-200',
    badge: 'bg-slate-100 text-slate-600',
    mobileHeader: 'bg-white border-b border-slate-200',
  },
  dark: {
    name: 'Dark', key: 'dark',
    sidebar: 'bg-slate-900 border-r border-slate-800',
    sidebarText: 'text-white',
    sidebarNavActive: 'bg-indigo-600/20 text-indigo-400',
    sidebarNavInactive: 'text-slate-400 hover:bg-slate-800 hover:text-white',
    sidebarFooter: 'border-t border-slate-800',
    sidebarUserName: 'text-white',
    sidebarUserSub: 'text-slate-500',
    main: 'bg-slate-950',
    card: 'bg-slate-900 border border-slate-800 shadow-sm rounded-2xl p-6',
    cardHover: 'hover:border-slate-700',
    heading: 'text-white',
    subtext: 'text-slate-400',
    label: 'text-slate-300',
    input: 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl focus:ring-indigo-500 focus:outline-none focus:ring-2',
    tableHead: 'text-slate-400',
    tableRow: 'border-slate-800 hover:bg-slate-800/50',
    tableCell: 'text-slate-300',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl',
    divider: 'border-slate-800',
    badge: 'bg-slate-800 text-slate-400',
    mobileHeader: 'bg-slate-900 border-b border-slate-800',
  },
};

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => {
    const saved = localStorage.getItem('cloudopt-theme');
    if (!saved || saved === 'dark') {
      localStorage.setItem('cloudopt-theme', 'default');
      return 'default';
    }
    return saved;
  });

  const theme  = themes[themeKey]      || themes.default;
  const tokens = themeTokens[themeKey] || themeTokens.default;

  const setTheme = (key) => {
    setThemeKey(key);
    localStorage.setItem('cloudopt-theme', key);
  };

  return (
    <ThemeContext.Provider value={{ theme, tokens, themeKey, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
