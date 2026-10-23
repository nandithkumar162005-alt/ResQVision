import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  BarChart3,
  Send,
  Newspaper,
  X,
  Cpu,
  User,
  Shield,
  PhoneCall,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { ResQVisionLogo, ResQVisionWordmark } from './ResQVisionLogo';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { LoginPage } from '../auth/LoginPage';

const NAV_ITEMS = [
  {
    to: '/overview',
    label: 'Citizen Portal',
    icon: User,
    description: 'Safety Advisories & SOS',
  },
  {
    to: '/dispatch',
    label: 'Rescue Team',
    icon: Shield,
    description: 'Tactical Deployment & Waves',
    isRescueTeam: true,
  },
  {
    to: '/incidents',
    label: 'All Disasters',
    icon: AlertTriangle,
    description: 'Earthquake, Flood, Cyclone...',
  },
  {
    to: '/analytics',
    label: 'Impact Analytics',
    icon: BarChart3,
    description: 'Comparative Damage Metrics',
  },
  {
    to: '/news',
    label: 'Warning News',
    icon: Newspaper,
    description: 'IMD & ISRO Field Bulletins',
  },
];

export function Sidebar({ mobileOpen = false, onCloseMobile = null }) {
  const { user, role, switchRole } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [showRescueLoginModal, setShowRescueLoginModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const handleNavClick = (item, e) => {
    if (onCloseMobile) onCloseMobile();

    if (item.isRescueTeam && role !== 'rescue') {
      e.preventDefault();
      setShowRescueLoginModal(true);
    }
  };

  const handleRescueLoginSuccess = () => {
    setShowRescueLoginModal(false);
    navigate('/dispatch');
  };

  const handleSendSos = () => {
    setSosSent(true);
    setTimeout(() => {
      setShowSosModal(false);
      setSosSent(false);
    }, 3000);
  };

  const content = (
    <div
      className={`flex flex-col h-full border-r w-64 select-none transition-colors duration-200 ${
        isDark
          ? 'bg-[#0E1015] border-[#272A36] text-white'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-[#272A36]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <ResQVisionLogo size={34} />
          <ResQVisionWordmark />
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className={`md:hidden p-1.5 rounded-lg transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#1A1D24]'
                : 'text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
            aria-label="Close navigation sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div
          className={`px-3 pb-2 text-[10px] font-mono uppercase tracking-wider font-semibold ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {role === 'rescue' ? 'Rescue Command Grid' : 'Citizen Safety Grid'}
        </div>

        {NAV_ITEMS.filter((item) => !(item.isRescueTeam && role !== 'rescue')).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => handleNavClick(item, e)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition group relative ${
                  isActive
                    ? isDark
                      ? 'bg-white/10 text-white border border-white/20 shadow-sm'
                      : 'bg-slate-100 text-slate-900 border border-slate-300 font-bold shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-[#161820] border border-transparent'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive
                        ? isDark ? 'text-white' : 'text-blue-600'
                        : isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="leading-snug truncate flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.isRescueTeam && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 uppercase font-mono">
                          Active
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDark ? 'bg-white shadow-white' : 'bg-blue-600 shadow-blue-500'
                      }`}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Theme Switcher in Sidebar */}
      <div className={`p-3 mx-3 mb-2 rounded-xl border flex items-center justify-between ${
        isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Appearance
        </span>
        <ThemeToggle showLabel={true} />
      </div>

      {/* Emergency SOS Column / Card (Copied from Overview Page) */}
      <div
        className={`p-3 mx-3 mb-2 rounded-xl border flex flex-col justify-between shadow-lg transition-colors ${
          isDark
            ? 'bg-[#150F12] border-red-900/40 text-white'
            : 'bg-red-50/60 border-red-200 text-slate-900'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <PhoneCall className="w-3.5 h-3.5 text-red-500" />
              Emergency SOS
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
              24/7 TOLL-FREE
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px] mb-2.5">
            <div
              className={`flex items-center justify-between px-2 py-1 rounded-lg border ${
                isDark ? 'bg-[#1D1217] border-red-900/30' : 'bg-white border-red-200'
              }`}
            >
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>NDRF:</span>
              <a href="tel:1078" className="text-red-500 font-bold hover:underline">1078</a>
            </div>
            <div
              className={`flex items-center justify-between px-2 py-1 rounded-lg border ${
                isDark ? 'bg-[#1D1217] border-red-900/30' : 'bg-white border-red-200'
              }`}
            >
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>SDMA:</span>
              <a href="tel:1070" className="text-red-500 font-bold hover:underline">1070</a>
            </div>
            <div
              className={`flex items-center justify-between px-2 py-1 rounded-lg border ${
                isDark ? 'bg-[#1D1217] border-red-900/30' : 'bg-white border-red-200'
              }`}
            >
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Ambulance:</span>
              <a href="tel:108" className="text-red-500 font-bold hover:underline">108</a>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSosModal(true)}
          className="w-full py-2 px-2.5 rounded-lg bg-[#EF4444] hover:bg-red-600 active:bg-red-700 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition"
        >
          <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
          <span>Trigger SOS Rescue</span>
        </button>
      </div>

      {/* System Status info box */}
      <div
        className={`p-3 m-3 rounded-xl border text-[11px] font-mono ${
          isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className={`flex items-center gap-1.5 font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Cpu className="w-3.5 h-3.5" />
          <span>ResQVision Engine</span>
        </div>
        <p className={`text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          National emergency response telemetry & citizen safety grid.
        </p>
      </div>

      {/* Bottom metadata */}
      <div
        className={`p-3 px-4 border-t text-[10px] font-mono flex items-center justify-between ${
          isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <span>ResQVision v2.0</span>
        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>IST +05:30</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block sticky top-0 h-screen z-20 flex-shrink-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex-shrink-0 max-w-xs w-full shadow-2xl">
            {content}
          </div>
        </div>
      )}

      {/* RESCUE TEAM RE-LOGIN MODAL */}
      {showRescueLoginModal && (
        <LoginPage
          initialRole="rescue"
          isModal={true}
          onClose={() => setShowRescueLoginModal(false)}
          onRoleLoginSuccess={handleRescueLoginSuccess}
        />
      )}

      {/* EMERGENCY SOS RESCUE TRIGGER MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl relative ${
            isDark ? 'bg-[#12141A] border-[#272A36] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-500 animate-bounce" />
              Confirm Emergency SOS Dispatch
            </h3>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Transmitting high-priority distress telemetry to the nearest State Disaster Management Authority and NDRF Command post for <span className="font-bold">{user?.location || 'your current district'}</span>.
            </p>

            {sosSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold">EMERGENCY DISTRESS BEACON ACTIVE</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    GPS coordinates and distress packet transmitted to NDRF Command Center & State Disaster Response Squad.
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-xl border mb-5 space-y-2 text-xs font-mono ${
                isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Distress Payload:</span>
                  <span className="font-bold text-red-500">CRITICAL_LIFE_SAFETY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Target Dispatch:</span>
                  <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>NDRF Battalions & SDRF Regional</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Estimated Response:</span>
                  <span className="text-emerald-500 font-bold">Priority Tier 1 (Immediate)</span>
                </div>
              </div>
            )}

            {!sosSent && (
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className={`py-2.5 px-4 rounded-xl border text-xs font-mono font-semibold transition ${
                    isDark ? 'bg-[#08090C] hover:bg-[#1A1D24] text-slate-300 border-[#272A36]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSos}
                  className="py-2.5 px-4 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/40"
                >
                  <span>Transmit Beacon</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
