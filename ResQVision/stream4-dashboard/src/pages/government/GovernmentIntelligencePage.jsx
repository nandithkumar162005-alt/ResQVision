import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Camera,
  Layers,
  Plane,
  Radar,
  Radio,
  ShieldAlert,
  Waves,
  Wrench
} from 'lucide-react';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters } from '../../hooks/useDashboardData.js';

const INTELLIGENCE_TABS = [
  { id: 'analytics', label: 'Operational Analytics', icon: BarChart3 },
  { id: 'multiwave', label: 'Multiwave / Aftershocks', icon: Waves },
  { id: 'drone', label: 'Aerial Drone Feeds', icon: Plane },
  { id: 'radar', label: 'Doppler Radar / Weather', icon: Radar },
  { id: 'damage', label: 'Damage Assessment', icon: AlertOctagon }
];

export default function GovernmentIntelligencePage() {
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(tab || 'analytics');
  const { govSosReports, rescueOperations, casualtyRecord, useMockData } = useAppState();
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#0B0D10] text-zinc-100">
      {/* Top Header */}
      <div className="glass-dark border-b border-white/10 px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Disaster Intelligence & Sensing Modules
              </h1>
              {useMockData && <DemoBadge label="Intelligence Subsystem" />}
            </div>
            <p className="text-xs text-zinc-400">
              Aggregated sensory data, radar telemetry, spatial multiwave analysis, and damage metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
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
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
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
        {/* 1. OPERATIONAL ANALYTICS (§31) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
                  SOS Queue Total
                </span>
                <span className="text-2xl font-bold text-white mt-1 block font-mono">
                  {stats.totalReports}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  {stats.pending} pending officer triage
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider block">
                  Authorized Deployments
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block font-mono">
                  {stats.authorized}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Escalated to rescue teams
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider block">
                  Active Field Ops
                </span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block font-mono">
                  {stats.inProgressOps}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Ongoing search and relief
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] font-medium text-blue-400 uppercase tracking-wider block">
                  Completed Missions
                </span>
                <span className="text-2xl font-bold text-blue-400 mt-1 block font-mono">
                  {stats.completedOps}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">
                  Verified mission closure
                </span>
              </div>
            </div>

            {/* Anti-Hallucination Analytics Notice */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
              <strong className="text-zinc-200">Data Integrity Principle (§31):</strong> Analytics reflect exact verified records currently stored in the operational database. ResQVision does not manufacture speculative trend graphs or simulated historical curves when historical archives are not connected.
            </div>
          </div>
        )}

        {/* 2. MULTIWAVE & AFTERSHOCK INTELLIGENCE (§31) */}
        {activeTab === 'multiwave' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="h-5 w-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">Event Progression & Seismic Waves</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-6">
                Underlying seismic aftershock clusters and cyclone eye tracks recorded from seismological telemetry.
              </p>

              {activeEvents.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No active multiwave disaster events currently recorded in telemetry.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeEvents.map(evt => (
                    <div key={evt.event_id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-orange-400 font-mono">{evt.event_id}</span>
                        <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-zinc-300">
                          {evt.hazard_type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{evt.location_name}</h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Affected Population Exposure: <span className="text-white font-mono">{evt.affected_population != null ? evt.affected_population.toLocaleString() : '—'}</span>
                      </p>
                      <div className="mt-3 text-[11px] text-zinc-500 border-t border-white/5 pt-2">
                        {evt.hazard_type === 'earthquake'
                          ? 'Secondary aftershocks are monitored via USGS / NCS seismic networks. No fabricated secondary waves.'
                          : evt.hazard_type === 'cyclone'
                          ? 'Observed eye track progression tracked from IMD radar bulletins.'
                          : 'Corridor river surge modeled from Central Water Commission hydrologic gauges.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. AERIAL DRONE TELEMETRY (§31) */}
        {activeTab === 'drone' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                <Plane className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">Drone Feed Not Connected</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                As strictly required by the ResQVision anti-hallucination specification (§31), unauthorized or simulated “LIVE” drone video streams are prohibited. Real aerial feeds require encrypted RTSP hardware integration.
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-300 font-mono">
                Status: Drone feed not connected
              </div>
            </div>
          </div>
        )}

        {/* 4. DOPPLER RADAR / WEATHER (§31) */}
        {activeTab === 'radar' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radar className="h-5 w-5 text-orange-400" />
                  <h3 className="text-sm font-bold text-white">Precipitation Doppler Radar Overlay</h3>
                </div>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                  Simulation
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Weather radar reflectivity frames indicating millimeter/hour precipitation polygons. In development mode, frames are marked as <strong>Simulation</strong> as required by §31.
              </p>

              <div className="rounded-xl border border-white/10 bg-black/40 p-6 text-center space-y-2">
                <div className="text-xs text-zinc-400">
                  Interactive radar frame sequence available directly on the{' '}
                  <span className="text-orange-400 font-semibold">Government Live Map</span> and{' '}
                  <span className="text-orange-400 font-semibold">Citizen Disaster Map</span> with multi-hazard timeline scrubber.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. DAMAGE ASSESSMENT (§32) */}
        {activeTab === 'damage' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-red-400" />
                  <h3 className="text-sm font-bold text-white">Stream 2/3 Damage Classification Zones</h3>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  Backend Contract: Stream 2 ML Ingestion
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Damage scores, critical zones, and destroyed footprints visualized directly from official ML assessment payloads.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Destroyed Areas (Red Marker Layer)
                  </span>
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                    Structures and sectors with complete collapse or total inundation. High priority triage zone.
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Major Damage Areas (Amber Marker Layer)
                  </span>
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
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
