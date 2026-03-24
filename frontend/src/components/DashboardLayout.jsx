import { useState, useRef, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, themes } from '../context/ThemeContext';
import { DashboardProvider } from '../context/DashboardContext';
import api from '../api';
import {
  LayoutDashboard, Server, Upload, CalendarCheck,
  History, HelpCircle, LogOut, Menu, X, Zap,
  Sun, Moon, Monitor, ChevronUp, Palette
} from 'lucide-react';

const navItems = [
  { to: '/app',            label: 'Dashboard',           icon: LayoutDashboard, end: true },
  { to: '/app/resources',  label: 'Configure Resources',  icon: Server },
  { to: '/app/upload',     label: 'Upload Workloads',     icon: Upload },
  { to: '/app/scheduled',  label: 'Scheduled Workloads',  icon: CalendarCheck },
  { to: '/app/history',    label: 'History',              icon: History },
  { to: '/app/help',       label: 'Help',                 icon: HelpCircle },
];

const themeIcons = { default: Monitor, light: Sun, dark: Moon };

// ── Sidebar is a stable named component (not defined inside render) ───────────
// This prevents React from unmounting/remounting it on every parent re-render.
function Sidebar({ user, theme, tokens, themeKey, setTheme, themePopupOpen, setThemePopupOpen, popupRef, onLogout, onNavClick }) {
  const isDefault  = themeKey === 'default';
  const ThemeIcon  = themeIcons[themeKey] || Monitor;

  const s = {
    sidebar:   { backgroundColor: '#000', borderRight: '1px solid rgba(255,255,255,0.07)' },
    divider:   { borderColor: 'rgba(255,255,255,0.07)' },
    logo:      { backgroundColor: '#22d3ee' },
    navActive: { backgroundColor: 'rgba(34,211,238,0.12)', color: '#22d3ee', borderRadius: '12px' },
    avatar:    { backgroundColor: 'rgba(34,211,238,0.15)', color: '#22d3ee' },
    footer:    { borderTop: '1px solid rgba(255,255,255,0.07)' },
    popup:     { backgroundColor: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' },
  };

  const popupStyle = isDefault
    ? s.popup
    : themeKey === 'light'
      ? { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
      : { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' };

  return (
    <aside
      className={`flex flex-col h-full w-64 ${!isDefault ? theme.sidebar : ''}`}
      style={isDefault ? s.sidebar : {}}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b" style={isDefault ? s.divider : {}}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={isDefault ? s.logo : { backgroundColor: themeKey === 'light' ? '#0ea5e9' : '#4f46e5' }}>
          <Zap size={16} className={isDefault ? 'text-black' : 'text-white'} />
        </div>
        <span className={`font-bold text-lg ${theme.sidebarText}`}>CloudOpt</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavClick}
            className={({ isActive }) =>
              isDefault
                ? `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? '' : 'hover:text-white'}`
                : `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive ? theme.sidebarNavActive : theme.sidebarNavInactive}`
            }
            style={isDefault ? ({ isActive }) => isActive ? s.navActive : { color: '#94a3b8', borderRadius: '12px' } : undefined}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 relative" style={isDefault ? s.footer : {}} ref={popupRef}>
        {/* Theme popup */}
        {themePopupOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 z-50 shadow-2xl" style={popupStyle}>
            <div className="px-4 py-3 flex items-center gap-2 border-b"
              style={isDefault ? s.divider : { borderColor: tokens.divider }}>
              <Palette size={14} className={theme.subtext} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${theme.subtext}`}>Theme</span>
            </div>
            {Object.values(themes).map(({ key, name }) => {
              const Icon = themeIcons[key];
              const active = themeKey === key;
              return (
                <button key={key} onClick={() => { setTheme(key); setThemePopupOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all hover:bg-white/5"
                  style={{ color: active ? '#22d3ee' : '#94a3b8', backgroundColor: active ? 'rgba(34,211,238,0.08)' : 'transparent' }}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                    key === 'default' ? 'bg-cyan-500/20 text-cyan-400' :
                    key === 'light'   ? 'bg-amber-100 text-amber-600' : 'bg-slate-700 text-slate-300'
                  }`}><Icon size={14} /></div>
                  <span>{name}</span>
                  {active && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Admin row */}
        <button onClick={() => setThemePopupOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
            style={isDefault ? s.avatar : {}}>
            {user?.name?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-sm font-medium truncate ${theme.sidebarUserName}`}>{user?.name || 'Admin'}</p>
            <p className={`text-xs truncate ${theme.sidebarUserSub}`}>{user?.role || user?.email || ''}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <ThemeIcon size={12} />
            </div>
            <ChevronUp size={14} className={`transition-transform ${themePopupOpen ? 'rotate-180' : ''} text-slate-400`} />
          </div>
        </button>

        {/* Logout */}
        <button onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const { user, logout }              = useAuth();
  const { theme, tokens, themeKey, setTheme } = useTheme();
  const navigate                      = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themePopupOpen, setThemePopupOpen] = useState(false);
  const popupRef = useRef(null);
  const isDefault = themeKey === 'default';

  // Close theme popup on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setThemePopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/');
  }, [logout, navigate]);

  const closeMobileSidebar = useCallback(() => setSidebarOpen(false), []);

  const mainStyle = isDefault
    ? {
        backgroundColor: '#000',
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }
    : { backgroundColor: tokens.bg };

  const sidebarProps = {
    user, theme, tokens, themeKey, setTheme,
    themePopupOpen, setThemePopupOpen,
    popupRef,
    onLogout: handleLogout,
    onNavClick: closeMobileSidebar,
  };

  return (
    <DashboardProvider>
    <div className={`flex h-screen overflow-hidden ${!isDefault ? theme.main : ''}`} style={mainStyle}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full z-50">
            <Sidebar {...sidebarProps} />
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-400">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white">CloudOpt</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg text-slate-400 hover:text-white">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ theme }} />
        </main>
      </div>
    </div>
    </DashboardProvider>
  );
}
