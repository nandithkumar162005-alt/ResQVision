import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, LogOut, User, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { ConnectionStatus } from './ConnectionStatus';
import { ResQVisionLogo } from './ResQVisionLogo';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { LoginPage } from '../auth/LoginPage';

export function TopBar({
  title = 'Operations Overview',
  subtitle = 'National Emergency Response Coordination',
  connectionState,
  lastSuccessfulSync,
  isValidating,
  onRefresh,
  isMock,
  onOpenMobileMenu,
}) {
  const { user, role, switchRole, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [showRescueLoginModal, setShowRescueLoginModal] = useState(false);

  const handleRescueTeamClick = () => {
    if (role === 'rescue') {
      navigate('/dispatch');
    } else {
      setShowRescueLoginModal(true);
    }
  };

  const handleRescueLoginSuccess = () => {
    setShowRescueLoginModal(false);
    navigate('/dispatch');
  };

  const handleCitizenClick = () => {
    switchRole('citizen');
    navigate('/overview');
  };

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isCitizenPage = location.pathname === '/overview';
  const isRescuePage = location.pathname === '/dispatch' || location.pathname === '/rescue';
  const isObservatoryPage = location.pathname === '/';

  return (
    <>
      <header
        className={`sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors duration-200 ${
          isDark ? 'bg-[#0E1015]/95 border-[#272A36]' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + Page Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className={`md:hidden p-2 rounded-xl border transition ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1A1D24] border-[#272A36]'
                  : 'text-slate-600 hover:text-black hover:bg-slate-100 border-slate-300'
              }`}
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="md:hidden flex items-center gap-2 mr-1">
              <ResQVisionLogo size={24} />
            </div>

            <div className="min-w-0">
              <h1 className={`text-base sm:text-lg font-bold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {title}
              </h1>
              <p className={`hidden sm:block text-xs font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* TWO MAIN PAGES NAVIGATOR PILLS (Citizen vs Rescue Team) */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-xl border font-mono text-xs shadow-inner">
            <button
              type="button"
              onClick={handleCitizenClick}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition ${
                isCitizenPage && role === 'citizen'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-[#1A1D24]'
                  : 'text-slate-600 hover:text-black hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen Portal</span>
            </button>

            {role === 'rescue' ? (
              <button
                type="button"
                onClick={() => navigate('/dispatch')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition ${
                  isRescuePage
                    ? 'bg-red-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#1A1D24]'
                    : 'text-slate-600 hover:text-black hover:bg-slate-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Rescue Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRescueTeamClick}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#1A1D24]'
                    : 'text-slate-600 hover:text-black hover:bg-slate-200'
                }`}
                title="Sign in to access Rescue Team Command"
              >
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <span>Rescue Team</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-red-500/15 text-red-500 border border-red-500/30 font-bold uppercase">
                  Login
                </span>
              </button>
            )}
          </div>

          {/* Center/Right: Theme Toggle, Connection Status & Auth */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* Interactive Theme Toggle Switch with Hover Effect */}
            <ThemeToggle showLabel={false} />

            <div className="hidden lg:block">
              <ConnectionStatus
                connectionState={connectionState}
                lastSuccessfulSync={lastSuccessfulSync}
                isValidating={isValidating}
                onRefresh={onRefresh}
                isMock={isMock}
              />
            </div>

            {/* User & Sign-out */}
            {user && (
              <div className={`flex items-center gap-2 pl-2 border-l ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
                <div
                  className={`hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono font-medium ${
                    isDark ? 'bg-[#08090C] border-[#272A36] text-white' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <span className="truncate max-w-[120px]">
                    {user.displayName || user.username}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer ${
                    isDark
                      ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/10 border-[#272A36] hover:border-red-500/30'
                      : 'text-slate-700 hover:text-red-600 hover:bg-red-50 border-slate-300 hover:border-red-300'
                  }`}
                  aria-label="Sign out"
                  title="Sign out and return to Welcome Page"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* RESCUE TEAM RE-LOGIN MODAL */}
      {showRescueLoginModal && (
        <LoginPage
          initialRole="rescue"
          isModal={true}
          onClose={() => setShowRescueLoginModal(false)}
          onRoleLoginSuccess={handleRescueLoginSuccess}
        />
      )}
    </>
  );
}
