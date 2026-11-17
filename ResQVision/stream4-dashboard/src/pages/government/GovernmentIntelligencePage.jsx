import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertOctagon,
  BarChart3,
  Radar
} from 'lucide-react';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters } from '../../hooks/useDashboardData.js';

const INTELLIGENCE_TABS = [
  { id: 'analytics', label: 'Operational Analytics', icon: BarChart3 },
  { id: 'radar', label: 'Doppler Radar / Weather', icon: Radar },
  { id: 'damage', label: 'Damage Assessment', icon: AlertOctagon }
];

export default function GovernmentIntelligencePage() {
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'analytics');
  const { theme, govSosReports, rescueOperations, casualtyRecord, useMockData } = useAppState();
  const isDark = theme === 'dark';
  const { data: disasterData } = useActiveDisasters();

  const activeEvents = disasterData?.active_disasters || [];

  // Verified metrics computed strictly from current state (no fake trends)
  const stats = useMemo(() => {
    const totalReports = govSosReports.length;
    const verified = govSosReports.filter(r => r.status === 'verified').length;
    const authorized = govSosReports.filter(r => r.status === 'authorized').length;
    const rejected = govSosReports.filter(r => r.status === 'rejected').length;
    const pending = govSosReports.filter(r => r.status === 'pending_review').length;

    const totalOps = rescueOperations.length;
    const completedOps = rescueOperations.filter(o => o.status === 'completed').length;
    const inProgressOps = rescueOperations.filter(o => o.status === 'in_progress').length;

    return {
      totalReports,
      verified,
      authorized,
      rejected,
      pending,
      totalOps,
      completedOps,
      inProgressOps
    };
  }, [govSosReports, rescueOperations]);

  const cardClass = isDark
    ? 'border-white/10 bg-white/5 text-zinc-200'
    : 'border-slate-200 bg-white text-slate-800 shadow-sm';

  return (
    <div className={`flex flex-col min-h-[calc(100vh-4rem)] transition-colors ${isDark ? 'bg-[#0B0D10] text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Header */}
      <div className={`border-b px-4 sm:px-6 py-4 shrink-0 ${isDark ? 'glass-dark border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Disaster Intelligence &amp; Sensing Modules
              </h1>
              {useMockData && <DemoBadge label="Intelligence Subsystem" theme={isDark ? 'dark' : 'light'} />}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Operational intelligence analytics, Doppler weather radar telemetry, and official damage assessment.
            </p>
          </div>

          <div className={`flex flex-wrap items-center gap-1.5 rounded-xl p-1 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
            {INTELLIGENCE_TABS.map(t => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md'
                      : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* 1. OPERATIONAL ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className={`rounded-2xl border p-4 ${cardClass}`}>
                <span className={`text-[11px] font-medium uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  SOS Queue Total
                </span>
                <span className={`text-2xl font-bold mt-1 block font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.totalReports}
                </span>
                <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  {stats.pending} pending officer triage
                </span>
              </div>

              <div className={`rounded-2xl border p-4 ${cardClass}`}>
                <span className="text-[11px] font-medium text-emerald-500 uppercase tracking-wider block">
                  Authorized Deployments
                </span>
                <span className="text-2xl font-bold text-emerald-500 mt-1 block font-mono">
                  {stats.authorized}
                </span>
                <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Escalated to rescue teams
                </span>
              </div>

              <div className={`rounded-2xl border p-4 ${cardClass}`}>
                <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider block">
                  Active Field Ops
                </span>
                <span className="text-2xl font-bold text-amber-500 mt-1 block font-mono">
                  {stats.inProgressOps}
                </span>
                <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Ongoing search and relief
                </span>
              </div>

              <div className={`rounded-2xl border p-4 ${cardClass}`}>
                <span className="text-[11px] font-medium text-blue-500 uppercase tracking-wider block">
                  Completed Missions
                </span>
                <span className="text-2xl font-bold text-blue-500 mt-1 block font-mono">
                  {stats.completedOps}
                </span>
                <span className={`text-[10px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Verified mission closure
                </span>
              </div>
            </div>

            {/* Anti-Hallucination Analytics Notice */}
            <div className={`rounded-xl border p-4 text-xs ${cardClass}`}>
              <strong className={isDark ? 'text-zinc-200' : 'text-slate-900'}>Data Integrity Principle:</strong> Analytics reflect exact verified records currently stored in the operational database. ResQVision does not manufacture speculative trend graphs or simulated historical curves when historical archives are not connected.
            </div>
          </div>
        )}

        {/* 2. DOPPLER RADAR / WEATHER */}
        {activeTab === 'radar' && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-6 space-y-4 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-orange-500" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Precipitation Doppler Radar Overlay
                  </h3>
                </div>
                <span className="rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Simulation
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Weather radar reflectivity frames indicating millimeter/hour precipitation polygons. In development mode, frames are marked as <strong>Simulation</strong>.
              </p>

              <div className={`rounded-xl border p-6 text-center space-y-2 ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'}`}>
                <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Interactive radar frame sequence available directly on the{' '}
                  <span className="text-orange-500 font-semibold">Government Live Map</span> and{' '}
                  <span className="text-orange-500 font-semibold">Citizen Disaster Map</span> with multi-hazard timeline scrubber.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. DAMAGE ASSESSMENT */}
        {activeTab === 'damage' && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-6 space-y-4 ${cardClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-500" />
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Damage Classification Zones
                  </h3>
                </div>
                <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                  Stream 2 ML Ingestion
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Damage scores, critical zones, and destroyed footprints visualized directly from official ML assessment payloads.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-xl border p-4 ${isDark ? 'border-red-500/30 bg-red-950/20' : 'border-red-200 bg-red-50'}`}>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Destroyed Areas (Red Marker Layer)
                  </span>
                  <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Structures and sectors with complete collapse or total inundation. High priority triage zone.
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${isDark ? 'border-amber-500/30 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Major Damage Areas (Amber Marker Layer)
                  </span>
                  <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Compromised civil infrastructure, passable with specialized rescue apparatus only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
