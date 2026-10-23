import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  LayoutDashboard,
  LogOut,
  User,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { ConnectionStatus } from './ConnectionStatus';

export function TopNav({
  connectionState,
  lastSuccessfulSync,
  isValidating,
  onRefresh,
  isMock,
}) {
  const { user, isDemoAuth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0E1015]/95 backdrop-blur-md border-b border-[#272A36]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="ResQVision Home"
          >
            <div className="p-1.5 rounded-xl bg-white/10 border border-white/20 text-white group-hover:bg-white/20 transition shadow-sm">
              <Radio className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold tracking-tight text-white">
                ResQVision
              </span>
              <span className="ml-2 text-[10px] font-mono font-medium tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 uppercase">
                Stream 4
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1 ml-4" aria-label="Primary navigation">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                location.pathname === '/'
                  ? 'bg-white/15 text-white border border-white/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#161820] border border-transparent'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Command Dashboard</span>
            </Link>
          </nav>
        </div>

        {/* Center: Connection status */}
        <div className="hidden sm:flex flex-1 justify-center min-w-0">
          <ConnectionStatus
            connectionState={connectionState}
            lastSuccessfulSync={lastSuccessfulSync}
            isValidating={isValidating}
            onRefresh={onRefresh}
            isMock={isMock}
          />
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDemoAuth && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              DEMO AUTH
            </span>
          )}

          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#08090C] border border-[#272A36] text-xs">
                <User className="w-3 h-3 text-slate-400" />
                <span className="text-white font-mono truncate max-w-[140px]">
                  {user.displayName || user.username}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-[#272A36] hover:border-red-500/30 transition cursor-pointer"
                aria-label="Sign out"
                title="End current session and return to Welcome Page"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile connection status bar */}
      <div className="sm:hidden px-4 pb-2">
        <ConnectionStatus
          connectionState={connectionState}
          lastSuccessfulSync={lastSuccessfulSync}
          isValidating={isValidating}
          onRefresh={onRefresh}
          isMock={isMock}
        />
      </div>
    </header>
  );
}
