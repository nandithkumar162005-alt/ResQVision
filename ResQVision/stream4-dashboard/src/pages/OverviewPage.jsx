import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { IncidentTrackingHeader } from '../components/IncidentTrackingHeader';
import { AlertBanner } from '../components/AlertBanner';
import { ErrorBanner } from '../components/ErrorBanner';
import { MetricCards } from '../components/MetricCards';
import { DisasterMap } from '../components/DisasterMap';
import { SectorOverviewCard } from '../components/SectorOverviewCard';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useIncidents } from '../context/IncidentContext';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import {
  Flame,
  MapPin,
  ArrowRight,
  ShieldAlert,
  PhoneCall,
  Home,
  CheckCircle2,
  AlertTriangle,
  Send,
  BarChart3,
  Newspaper,
  Layers,
  Radio,
  Compass,
} from 'lucide-react';
import { formatNumber, shortenId } from '../utils/formatters';
import { getDispatchStatusInfo } from '../utils/severityColors';
import { incidentTypeLabel, incidentLocationLabel } from '../utils/formatters';

export function OverviewPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { isDark } = useTheme();
  const {
    incidents,
    sortedIncidents,
    kpis,
    isLoading,
    isValidating,
    error,
    lastSuccessfulSync,
    connectionState,
    isMock,
    refetch,
    selectedIncidentId,
    setSelectedIncidentId,
    selectedIncident,
    selectedZoneId,
    setSelectedZoneId,
  } = useIncidents();

  // SOS Modal state for citizens
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const handleSelectIncident = (id) => {
    setSelectedIncidentId(id);
    setSelectedZoneId(null);
  };

  const handleSelectZone = (zoneId) => {
    setSelectedZoneId(zoneId);
  };

  const handleViewIncidentDetails = (id) => {
    setSelectedIncidentId(id);
    navigate('/incidents');
  };

  const handleSendSos = () => {
    setSosSent(true);
    setTimeout(() => {
      setShowSosModal(false);
      setSosSent(false);
    }, 3000);
  };

  const activeIncident = selectedIncident || sortedIncidents[0] || null;

  return (
    <AppShell
      title="National Incident Command Center"
      subtitle="Operational Geospatial Command & Disaster Telemetry (Stream 4)"
    >
      {/* Top Incident Command Center Header */}
      <IncidentTrackingHeader
        incidents={incidents}
        lastSuccessfulSync={lastSuccessfulSync}
        isValidating={isValidating}
        onRefresh={refetch}
        isMock={isMock}
      />

      {/* Non-blocking error banner */}
      <ErrorBanner error={error} onRetry={refetch} isRetrying={isValidating} />

      {/* Conditional alert banner */}
      <AlertBanner incidents={incidents} error={error} />

      {/* Initial load skeleton */}
      {isLoading ? (
        <LoadingState message="Synchronizing telemetry with Stream 3 dispatch service..." />
      ) : incidents.length === 0 && !error ? (
        <EmptyState isCalmHealthy />
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <MetricCards
            kpis={kpis}
            lastSuccessfulSync={lastSuccessfulSync}
            isLoading={false}
          />

          {/* MAIN HERO MAP: FULL HORIZONTAL WIDTH WITH ZERO FLANKING CARDS */}
          <div className="mb-6">
            <div className="flex items-center justify-between pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <Compass className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-600'}`} />
                <h2 className={`text-sm font-bold tracking-wide uppercase font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Disaster Epicenter Grid • Single Spot Surveillance
                </h2>
              </div>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {sortedIncidents.length} Natural Disasters Tracked (1 Spot Per Hazard)
              </span>
            </div>

            <DisasterMap
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              selectedZoneId={selectedZoneId}
              onSelectIncident={handleSelectIncident}
              onSelectZone={handleSelectZone}
              onViewDetails={handleViewIncidentDetails}
              height="560px"
            />
          </div>

          {/* NATURAL DISASTER TYPES QUICK ROSTER (Earthquake, Flood, Cyclone, Tsunami, Drought, Landslide) */}
          <div className="mb-6">
            <div className="flex items-center justify-between pb-2 border-b mb-3">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Major Natural Disasters Monitored
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Click any disaster to zoom to its single epicenter spot
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {sortedIncidents.map((inc) => {
                const isSelected = inc.event_id === selectedIncidentId;
                return (
                  <button
                    key={inc.event_id}
                    type="button"
                    onClick={() => handleSelectIncident(inc.event_id)}
                    className={`p-3 rounded-xl border text-left transition duration-200 flex flex-col justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1C1F28] border-white ring-2 ring-white/40 shadow-lg'
                          : 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                        : isDark
                        ? 'bg-[#12141A] border-[#272A36] hover:border-slate-500 hover:bg-[#181A22]'
                        : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold uppercase text-red-500 mb-0.5">
                        {incidentTypeLabel(inc)}
                      </div>
                      <div className={`text-xs font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {incidentLocationLabel(inc)}
                      </div>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-500/20 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Score: {inc.damage_score_out_of_100}/100</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BELOW THE MAP: Active Disasters Queue & Selected Incident Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
            {/* Left: Active Incidents Queue (5 cols) */}
            <div className="lg:col-span-5 flex flex-col">
              <div
                className={`border rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-xl transition-colors duration-200 ${
                  isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2">
                    <Flame className={`w-4 h-4 ${isDark ? 'text-white' : 'text-red-500'}`} />
                    <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Active Natural Disasters
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-white bg-white/10 border-white/20'
                        : 'text-slate-900 bg-slate-100 border-slate-300'
                    }`}
                  >
                    {sortedIncidents.length} Hazards
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {sortedIncidents.map((incident) => {
                    const isSelected = incident.event_id === selectedIncidentId;
                    const dispatchInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);

                    return (
                      <div
                        key={incident.event_id}
                        onClick={() => handleSelectIncident(incident.event_id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-3 ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1C1F28] border-white ring-1 ring-white/50 shadow-lg'
                              : 'bg-blue-50 border-blue-600 ring-1 ring-blue-500/40 shadow-md'
                            : isDark
                            ? 'bg-[#08090C] border-[#272A36] hover:border-slate-500 hover:bg-[#14161E]'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {incident.image_url && (
                          <div className={`w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0 ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
                            <img
                              src={incident.image_url}
                              alt={incidentLocationLabel(incident)}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {incident.location_name}
                              </span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${dispatchInfo.bgClass} ${dispatchInfo.textClass} ${dispatchInfo.borderClass} flex-shrink-0`}
                              >
                                {dispatchInfo.label}
                              </span>
                            </div>

                            <p className={`text-[11px] truncate leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {incident.disaster_type}
                            </p>
                          </div>

                          <div className={`flex items-center justify-between text-[10px] font-mono pt-1.5 border-t mt-1 ${
                            isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'
                          }`}>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-blue-600'}`}>
                              {shortenId(incident.event_id, 8, 2)}
                            </span>
                            <span>Single Spot Epicenter</span>
                            <span>Pop: {incident.affected_population_estimate ? formatNumber(incident.affected_population_estimate) : '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`pt-3 border-t mt-3 ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => navigate('/incidents')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition shadow-sm ${
                      isDark
                        ? 'bg-white hover:bg-slate-200 text-black'
                        : 'bg-slate-900 hover:bg-black text-white'
                    }`}
                  >
                    <span>Inspect Granular Incident & Disaster Queue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Selected Incident Operational Dossier (7 cols) */}
            <div className="lg:col-span-7 flex flex-col">
              {activeIncident ? (
                <SectorOverviewCard
                  incident={activeIncident}
                  onViewDetails={handleViewIncidentDetails}
                />
              ) : (
                <div className={`border rounded-2xl p-8 text-center ${
                  isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                }`}>
                  Select an incident to view operational satellite analysis and sector telemetry.
                </div>
              )}
            </div>
          </div>

          {/* ROLE-BASED DASHBOARD SECTION (Citizen vs Rescue Team) */}
          {role === 'citizen' ? (
            /* Citizen Safety & Emergency Hub */
            <div
              className={`border rounded-2xl p-5 mb-6 shadow-xl transition-colors duration-200 ${
                isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b mb-4 ${
                isDark ? 'border-[#272A36]' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold tracking-wide uppercase font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Citizen Local Safety & Relief Portal
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-mono border border-blue-500/40 font-semibold">
                        {user?.location || 'Assam Region'}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Personalized disaster updates, verified emergency shelters, and direct SOS rescue triggers for your district.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSosModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#EF4444] hover:bg-red-600 active:bg-red-700 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition flex-shrink-0"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  <span>Request Emergency SOS Rescue</span>
                </button>
              </div>

              {/* 3 Citizen Quick Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-amber-500 font-bold uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Active Local Advisory
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Live</span>
                    </div>
                    <h4 className={`text-xs font-bold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Natural Disaster Alert
                    </h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Emergency telemetry active. Lowland and landslide-prone wards advised to move to designated relief shelters immediately.
                    </p>
                  </div>
                  <div className={`pt-3 border-t mt-3 flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'border-[#272A36]' : 'border-slate-200'
                  }`}>
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Safe Route:</span>
                    <span className="text-emerald-500 font-semibold">Elevated National Highway</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5" />
                        Nearest Relief Shelters
                      </span>
                      <span className="text-[10px] font-mono text-emerald-500 font-bold">2 Active</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'}`}>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>District High School Camp</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Capacity: 650 • Rations & Water Available</div>
                      </div>
                      <div className={`p-2 rounded-lg border ${isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'}`}>
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>District Stadium Shelter</div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Medical Triage Active • Power Backup</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                  isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                        National Emergency Contacts
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">24/7 Toll-Free</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className={`flex items-center justify-between p-2 rounded-lg border ${isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'}`}>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>NDRF Control Room:</span>
                        <span className="text-blue-500 font-bold text-sm">1078</span>
                      </div>
                      <div className={`flex items-center justify-between p-2 rounded-lg border ${isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'}`}>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>State Disaster (SDMA):</span>
                        <span className="text-blue-500 font-bold text-sm">1070</span>
                      </div>
                      <div className={`flex items-center justify-between p-2 rounded-lg border ${isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'}`}>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Ambulance Emergency:</span>
                        <span className="text-blue-500 font-bold text-sm">108</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Rescue Team Console Summary */
            <div
              className={`border rounded-2xl p-5 mb-6 shadow-xl transition-colors duration-200 ${
                isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
              }`}
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b mb-4 ${
                isDark ? 'border-[#272A36]' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold tracking-wide uppercase font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Rescue Tactical Command & Dispatch Deployment
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono border border-emerald-500/40 font-semibold">
                        Clearance Granted
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Tactical asset deployment: NDRF Battalions, Coast Guard air reconnaissance sorties, and motorized rescue boat units.
                    </p>
                  </div>
                </div>

                <Link
                  to="/dispatch"
                  className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition flex-shrink-0 ${
                    isDark ? 'bg-white hover:bg-slate-200 text-black' : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Open Full Dispatch Console</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned Units</div>
                  <div className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>8 Battalions</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rescue Boats</div>
                  <div className="text-lg font-bold text-emerald-500 mt-0.5">42 In Service</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Airlift Sorties</div>
                  <div className={`text-lg font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>6 Active Mi-17</div>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Citizens Evacuated</div>
                  <div className="text-lg font-bold text-emerald-500 mt-0.5">2,840 Safe</div>
                </div>
              </div>
            </div>
          )}

          {/* OPERATIONS FAST NAVIGATOR STRIP */}
          <div className="mb-6">
            <div className={`pb-2.5 mb-2.5 border-b flex items-center justify-between ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Detailed Operations Workspaces
              </span>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Select a tab for deep analytical and operational inspection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                to="/incidents"
                className={`p-4 rounded-2xl border transition group flex flex-col justify-between shadow-lg ${
                  isDark
                    ? 'bg-[#12141A] border-[#272A36] hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      <Layers className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Incidents & Zones
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Granular table of all natural hazard coordinates, structural damage classifications, and satellite previews.
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t text-[11px] font-mono ${isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  {sortedIncidents.length} Active Records
                </div>
              </Link>

              <Link
                to="/analytics"
                className={`p-4 rounded-2xl border transition group flex flex-col justify-between shadow-lg ${
                  isDark
                    ? 'bg-[#12141A] border-[#272A36] hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Damage Analytics
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Statistical charts comparing damage scores, affected population distributions, and classification percentages.
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t text-[11px] font-mono ${isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  3 Interactive Visualizations
                </div>
              </Link>

              <Link
                to="/dispatch"
                className={`p-4 rounded-2xl border transition group flex flex-col justify-between shadow-lg ${
                  isDark
                    ? 'bg-[#12141A] border-[#272A36] hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      <Send className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Dispatch Wave Logs
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Audit trail of all emergency wave transmissions dispatched to NDRF battalions, SDRF teams, and emergency officers.
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t text-[11px] font-mono ${isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  Chronological Telemetry Feed
                </div>
              </Link>

              <Link
                to="/news"
                className={`p-4 rounded-2xl border transition group flex flex-col justify-between shadow-lg ${
                  isDark
                    ? 'bg-[#12141A] border-[#272A36] hover:border-slate-400'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`p-2 rounded-xl border ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                      <Newspaper className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
                  </div>
                  <h4 className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Early Warning News
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Official bulletins from IMD Cyclone Cell, ISRO Bhuvan satellite delineation, and Central Water Commission.
                  </p>
                </div>
                <div className={`mt-3 pt-2 border-t text-[11px] font-mono ${isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  Field Photo Bulletins
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* CITIZEN EMERGENCY SOS MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl relative ${
            isDark ? 'bg-[#12141A] border-[#272A36] text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-red-500" />
              Confirm Emergency SOS Dispatch
            </h3>
            <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Transmitting high-priority distress telemetry to the nearest State Disaster Management Authority and NDRF Command post for <span className="font-bold">{user?.location || 'your current district'}</span>.
            </p>

            {sosSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs font-mono flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-bold">Distress Beacon Broadcasted!</div>
                  <div className="text-[11px] mt-0.5 opacity-90">Assam SDRF Riverine Patrol notified. Hold your location on elevated ground.</div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                  isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Citizen:</span>
                    <span className="font-bold">{user?.displayName || 'Citizen'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Coordinates:</span>
                    <span className="font-bold">26.4012°N, 94.0321°E</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sector:</span>
                    <span className="text-red-500 font-bold">Dhansiri River Lowland Breach</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
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
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
