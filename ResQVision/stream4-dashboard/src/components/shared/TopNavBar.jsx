import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  LogOut,
  Moon,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  Shield,
  ShieldAlert,
  Sun,
  User,
  Zap
} from 'lucide-react';
import BrandMark from './BrandMark.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, logoutGovernment, logoutCitizen, citizenUser, governmentUser } =
    useAppState();

  const isCitizen = location.pathname.startsWith('/citizen');
  const isGovernment = location.pathname.startsWith('/government');

  const [timeStr, setTimeStr] = useState(() => new Date().toLocaleTimeString('en-IN', { hour12: false }));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSignOut = () => {
    if (isGovernment) {
      logoutGovernment();
      navigate('/login?role=government');
    } else {
      logoutCitizen();
      navigate('/login?role=citizen');
    }
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        isDark
          ? 'bg-[#101318]/95 border-white/10 text-zinc-100 shadow-md backdrop-blur-md'
          : 'bg-white/95 border-zinc-200/90 text-zinc-900 shadow-sm backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-3 sm:px-6 gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group hover:opacity-90 transition-opacity">
            <BrandMark theme={isDark ? 'dark' : 'light'} />
          </Link>
        </div>

        {/* Center: Portal Switcher Pill (Citizen Portal vs Rescue Dashboard) */}
        <div className={`flex rounded-2xl p-1 border shrink-0 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
          <Link
            to="/citizen/map"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isCitizen
                ? 'bg-[#DC2626] text-white shadow-md'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Citizen Portal</span>
          </Link>

          <Link
            to="/government/overview"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isGovernment
                ? 'bg-[#DC2626] text-white shadow-md'
                : isDark
                ? 'text-zinc-400 hover:text-white'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Rescue Dashboard</span>
          </Link>

          <Link
            to="/verify"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <ScanSearch className="h-3.5 w-3.5" />
            <span>Verify Image</span>
          </Link>
        </div>

        {/* Right Controls: Theme Toggle, Telemetry Status, Clock, User, Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Pill (Sun / Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition cursor-pointer ${
              isDark
                ? 'bg-white/10 border-white/20 text-amber-300 hover:bg-white/15'
                : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
                <span className="h-2 w-2 rounded-full bg-amber-400 ml-0.5" />
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-zinc-700 mr-0.5" />
                <Moon className="h-3.5 w-3.5 text-zinc-700" />
              </>
            )}
          </button>

          {/* Telemetry Status Pill */}
          <div
            className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-bold tracking-wider ${
              isDark
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>TELEMETRY ACTIVE</span>
          </div>

          {/* Time & Refresh */}
          <div className={`hidden lg:flex items-center gap-2 text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            <span>Updated: {timeStr}</span>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Refresh telemetry stream"
              className={`rounded-lg p-1 transition ${
                isDark ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              <RotateCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* User Role Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium ${
              isDark
                ? 'bg-white/5 border-white/10 text-zinc-200'
                : 'bg-zinc-100 border-zinc-200 text-zinc-800'
            }`}
          >
            <span className="font-semibold truncate max-w-[150px]">
              {isGovernment ? governmentUser?.agency || 'NDRF Duty Commander' : citizenUser?.name || 'Citizen User'}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={handleSignOut}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold transition ${
              isDark
                ? 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
                : 'border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700'
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
