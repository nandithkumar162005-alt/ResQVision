import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  BarChart3,
  BellRing,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Package,
  Plane,
  Radar,
  Settings,
  ShieldCheck,
  Truck,
  Waves,
  X
} from 'lucide-react';
import BrandMark from '../shared/BrandMark.jsx';
import LocationSearch from '../shared/LocationSearch.jsx';
import NotificationDropdown from '../shared/NotificationDropdown.jsx';
import TopNavBar from '../shared/TopNavBar.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters } from '../../hooks/useDashboardData.js';

const GOVERNMENT_NAV_GROUPS = [
  {
    group: 'OPERATIONS',
    items: [
      { to: '/government/overview', label: 'Overview', icon: LayoutDashboard },
      { to: '/government/map', label: 'Live Map', icon: MapIcon },
      { to: '/government/sos', label: 'SOS Alerts / Queue', icon: BellRing, badge: true }
    ]
  },
  {
    group: 'RESPONSE',
    items: [
      { to: '/government/rescue', label: 'Rescue Operations', icon: Truck },
      { to: '/government/rescue/history', label: 'Rescue History', icon: ClipboardCheck },
      { to: '/government/resources', label: 'Resources / Equipment', icon: Package }
    ]
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { to: '/government/intelligence/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/government/intelligence/radar', label: 'Radar / Weather', icon: Radar },
      { to: '/government/intelligence/damage', label: 'Damage Assessment', icon: AlertOctagon }
    ]
  },
  {
    group: 'SYSTEM / ACCOUNT',
    items: [
      { to: '/government/audit', label: 'Dispatch / Audit Logs', icon: History },
      { to: '/government/settings', label: 'Settings & Profile', icon: Settings }
    ]
  }
];

export default function GovernmentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    theme,
    governmentUser,
    logoutGovernment,
    govSosReports,
    governmentNotifications,
    markAllNotificationsRead,
    useMockData
  } = useAppState();
  const isDark = theme === 'dark';
  const { data: disasterData, error: disasterError } = useActiveDisasters();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTarget, setSearchTarget] = useState(null);

  // Group expansion state
  const [openGroups, setOpenGroups] = useState({
    OPERATIONS: true,
    RESPONSE: true,
    INTELLIGENCE: false,
    'SYSTEM / ACCOUNT': false
  });

  // Auto-expand group if current path is in that group
  useEffect(() => {
    GOVERNMENT_NAV_GROUPS.forEach(g => {
      const hasActive = g.items.some(it => location.pathname.startsWith(it.to));
      if (hasActive) {
        setOpenGroups(prev => ({ ...prev, [g.group]: true }));
      }
    });
  }, [location.pathname]);

  const toggleGroup = grp => {
    setOpenGroups(prev => ({ ...prev, [grp]: !prev[grp] }));
  };

  const pendingSosCount = govSosReports.filter(
    r => r.status === 'pending_review' || r.status === 'info_requested'
  ).length;

  const handleSignOut = () => {
    logoutGovernment();
    navigate('/login?role=government', { replace: true });
  };

  const handleSearchSelect = item => {
    setSearchTarget({ ...item, nonce: Date.now() });
    navigate('/government/live-map');
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#0B0D10] text-zinc-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Top Incident Command Navigation Bar (Images 1 & 4) */}
      <TopNavBar />

      <div className="flex flex-1 min-w-0">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/70 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Government Sidebar: Grouped collapsible navigation */}
        <aside
          aria-label="Government command navigation"
          className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200 lg:static ${
            isDark ? 'glass-dark border-white/10 text-zinc-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
          } ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${collapsed ? 'w-[74px]' : 'w-64'}`}
        >
          <div className={`flex h-14 items-center justify-between border-b px-3.5 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <BrandMark theme={isDark ? 'dark' : 'light'} compact={collapsed} />
            <button
              type="button"
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className={`hidden rounded-lg p-1.5 transition lg:inline-flex ${
                isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu"
              className={`rounded-lg p-1.5 lg:hidden ${
                isDark ? 'text-zinc-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        {/* Grouped Nav List */}
        <nav className="flex-1 overflow-y-auto space-y-3 p-3">
          {GOVERNMENT_NAV_GROUPS.map(sec => {
            const isOpen = openGroups[sec.group];
            return (
              <div key={sec.group} className="space-y-1">
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(sec.group)}
                    className={`w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold tracking-wider uppercase transition ${
                      isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-500 hover:text-black hover:font-bold'
                    }`}
                  >
                    <span>{sec.group}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`}
                    />
                  </button>
                )}
                {(isOpen || collapsed) && (
                  <div className="space-y-0.5">
                    {sec.items.map(item => {
                      const Icon = item.icon;
                      const showBadge = item.badge && pendingSosCount > 0;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                              isActive
                                ? isDark
                                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/45 font-semibold'
                                  : 'bg-orange-500/15 text-orange-700 ring-1 ring-orange-400 font-bold'
                                : isDark
                                ? 'text-zinc-300 hover:bg-white/10 hover:text-white'
                                : 'text-slate-600 hover:text-black hover:bg-slate-100 hover:font-bold'
                            }`
                          }
                          title={collapsed ? item.label : undefined}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Icon className="h-4 w-4 shrink-0" />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                          </span>
                          {showBadge && !collapsed && (
                            <span className="rounded-full bg-orange-500 px-1.5 py-0.2 font-mono text-[10px] font-bold text-white shadow-sm">
                              {pendingSosCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className={`border-t p-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {!collapsed && (
            <div className={`mb-2 rounded-xl p-2.5 text-[11px] ${
              isDark ? 'glass-dark-subtle text-zinc-400' : 'bg-slate-50 border border-slate-200 text-slate-600'
            }`}>
              <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                Command Session
              </div>
              <p className={`mt-1 truncate ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{governmentUser?.agency || 'NDMA / NDRF'}</p>
              <p className="mt-0.5 text-[10px] text-emerald-500 font-semibold">
                Level 3 Triage Authorized
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
              isDark ? 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100' : 'text-slate-600 hover:text-black hover:bg-slate-100 hover:font-bold'
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Command Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className={`sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b px-4 sm:px-6 ${
          isDark ? 'glass-dark border-white/10 text-zinc-100' : 'glass-light border-slate-200 text-slate-800'
        }`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className={`rounded-lg border p-1.5 lg:hidden ${
                isDark ? 'border-white/10 text-zinc-200 hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="lg:hidden">
              <BrandMark theme={isDark ? 'dark' : 'light'} compact />
            </div>
            <div className="hidden max-w-md flex-1 sm:block">
              <LocationSearch
                onSelect={handleSearchSelect}
                placeholder="Search disaster zone, incident, or district..."
                theme={isDark ? 'dark' : 'light'}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationDropdown
              notifications={governmentNotifications}
              onMarkAllRead={markAllNotificationsRead}
              theme={isDark ? 'dark' : 'light'}
            />

            <div className={`flex items-center gap-2 border-l pl-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/40 font-semibold text-xs">
                {governmentUser?.name?.charAt(0) || 'O'}
              </div>
              <div className="hidden text-left sm:block">
                <div className={`text-xs font-semibold leading-tight ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                  {governmentUser?.name || 'NDRF Duty Commander'}
                </div>
                <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  {governmentUser?.agency || 'Level 3 Triage'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-2 sm:p-4">
          <Outlet context={{ searchTarget }} />
        </main>
      </div>
    </div>
  </div>
  );
}
