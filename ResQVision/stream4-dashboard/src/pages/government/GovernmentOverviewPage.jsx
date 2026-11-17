import { useMemo, useState } from 'react';
import NdrfVerifyPanel from '../../components/shared/NdrfVerifyPanel.jsx';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Building,
  CheckCircle2,
  Clock,
  Compass,
  ExternalLink,
  FileText,
  Flame,
  Globe,
  Layers,
  MapPin,
  Newspaper,
  Radio,
  RefreshCw,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Truck,
  Users,
  Waves,
  X,
  Zap
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import {
  useActiveDisasters,
  useDispatchLog,
  useGeospatialResources
} from '../../hooks/useDashboardData.js';
import { formatDateTime, formatNumber, formatRelativeTime, statusReadable } from '../../utils/format.js';
import { HAZARD_TYPES, inferHazardCategory } from '../../utils/hazardEngine.js';
import {
  ALL_INDIA_HAZARD_AREAS,
  HYDERABAD_HAZARD_AREAS,
  DEMO_RESOURCES
} from '../../data/mockData.js';

export default function GovernmentOverviewPage() {
  const { theme, govSosReports, rescueOperations, backendSyncError } = useAppState();
  const {
    data: disasterRes,
    error: disasterError,
    isLoading: disasterLoading,
    isStale,
    mutate: retryDisasters
  } = useActiveDisasters();
  const { data: geoRes } = useGeospatialResources();

  const disasters = disasterRes?.items || [];
  const resources = geoRes?.resources || DEMO_RESOURCES;
  const verifiedRoutes = geoRes?.verifiedRoutes || [];
  const rescueUnits = geoRes?.rescueUnits || [];

  const [selectedEventId, setSelectedEventId] = useState('EVT-HYD-01');
  const [focusTarget, setFocusTarget] = useState({ lat: 17.385, lng: 78.4867, zoom: 12.2 });

  const isDark = theme === 'dark';

  const selectedEvent = useMemo(() => {
    if (selectedEventId) {
      const hit = disasters.find(d => d.event_id === selectedEventId);
      if (hit) return hit;
    }
    return disasters[0] || null;
  }, [disasters, selectedEventId]);

  const selectedHazardCategory = selectedEvent ? inferHazardCategory(selectedEvent) : 'flood';

  const { data: dispatchRes, error: dispatchError } = useDispatchLog(selectedEvent?.event_id);
  const dispatchLog = dispatchRes?.items || [];

  const handleSelectEvent = ev => {
    if (!ev) return;
    setSelectedEventId(ev.event_id);
    if (Number.isFinite(Number(ev.lat)) && Number.isFinite(Number(ev.lng))) {
      const cat = inferHazardCategory(ev);
      setFocusTarget({
        lat: Number(ev.lat),
        lng: Number(ev.lng),
        zoom: cat === 'cyclone' ? 8.5 : cat === 'earthquake' ? 9.5 : 12.2,
        nonce: Date.now()
      });
    }
  };

  const handleFocusZone = (lat, lng, zoom = 13.5) => {
    setFocusTarget({
      lat: Number(lat),
      lng: Number(lng),
      zoom,
      nonce: Date.now()
    });
  };

  const totalPopulationAtRisk = useMemo(() => {
    return disasters.reduce((sum, d) => sum + (Number(d.affected_population_estimate) || 0), 0);
  }, [disasters]);

  const totalEpicenters = useMemo(() => {
    return disasters.reduce(
      (sum, d) => sum + (Array.isArray(d.critical_zones) && d.critical_zones.length > 0 ? d.critical_zones.length : 1),
      0
    );
  }, [disasters]);

  // Card theme classes
  const cardClass = isDark
    ? 'glass-dark border border-white/10 text-zinc-100 shadow-md'
    : 'bg-white border border-slate-200 text-slate-900 shadow-sm';

  const subtleCardClass = isDark
    ? 'glass-dark-subtle border border-white/5 text-zinc-200'
    : 'bg-slate-50 border border-slate-200 text-slate-800';

  return (
    <div className={`mx-auto max-w-[1920px] space-y-5 px-2 sm:px-4 pb-16 transition-colors ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
      {/* 1. Sub-bar (National Incident Command Header) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-xs font-semibold ${cardClass}`}
      >
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-extrabold tracking-wider uppercase">
              National Incident Command Center
            </span>
          </div>
          <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>|</span>
          <div className={`font-mono ${isDark ? 'text-zinc-300' : 'text-slate-600'}`}>
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, 03:12:11 IST
          </div>
          <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>|</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              National Threat Level:
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              CRITICAL (LEVEL 3)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-bold">SYNC: LIVE ACTIVE</span>
          <button
            type="button"
            onClick={() => retryDisasters()}
            aria-label="Refresh telemetry feed"
            className={`p-1 rounded-lg transition ${isDark ? 'hover:bg-white/10 text-zinc-300' : 'hover:bg-slate-200 text-slate-700'}`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Dispatch Service Banner */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs ${
          backendSyncError
            ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
            : isDark
            ? 'border-emerald-500/30 bg-emerald-950/15 text-emerald-200'
            : 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold tracking-wide uppercase text-[11px]">
              {backendSyncError
                ? 'DISPATCH SERVICE UNAVAILABLE — RETRYING TELEMETRY LINK'
                : 'DISPATCH SERVICE CONNECTED — REAL-TIME TELEMETRY ACTIVE'}
            </div>
            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              Operational wave transmissions dispatched to NDRF battalions, SDRF teams, and central command officers.
            </div>
          </div>
        </div>

        <Link
          to="/government/rescue"
          className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-sm"
        >
          <span>View Dispatch Console</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 3. Five Metric Summary Cards */}
      {disasterLoading ? (
        <LoadingSkeleton theme={theme} variant="metrics" />
      ) : (
        <section aria-label="Operational summary metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className={`rounded-2xl p-4 transition ${cardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Active Disasters</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/15 text-blue-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-2 font-mono text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {disasters.length || 6}
            </div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Verified disaster sectors in India
            </div>
          </div>

          <div className={`rounded-2xl p-4 transition ${cardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Mapped Epicenters</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                <MapPin className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-2 font-mono text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalEpicenters || 12}
            </div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Epicenter spots across India
            </div>
          </div>

          <div className={`rounded-2xl p-4 transition ${cardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Est. Population at Risk</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-500">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-2 font-mono text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatNumber(totalPopulationAtRisk || 112400)}
            </div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Active population model
            </div>
          </div>

          <div className={`rounded-2xl p-4 transition ${cardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Dispatched Missions</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                <Send className="h-4 w-4" />
              </div>
            </div>
            <div className={`mt-2 font-mono text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {disasters.length || 6}
            </div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              All waves en route / on-site
            </div>
          </div>

          <div className={`col-span-2 rounded-2xl p-4 sm:col-span-1 transition ${cardClass}`}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Telemetry Heartbeat</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-emerald-500">
              LIVE
            </div>
            <div className={`mt-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              10s real-time polling cadence
            </div>
          </div>
        </section>
      )}

      {/* 4. Dominant Geospatial Intelligence Map */}
      <section aria-label="Disaster epicenter grid surveillance" className="space-y-2">
        <div className="flex flex-wrap items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2 font-bold tracking-wider uppercase">
            <Compass className="h-4 w-4 text-orange-500" />
            <span>National Disaster Surveillance Grid</span>
          </div>
          <span className={`font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
            {disasters.length} Monitored Hazards across India
          </span>
        </div>

        <ResQMap
          theme={theme}
          defaultStyle={isDark ? 'dark' : 'light'}
          disasters={disasters}
          resources={resources}
          verifiedRoutes={verifiedRoutes}
          rescueUnits={rescueUnits}
          showRescueUnits
          activeEventHazardHint={selectedHazardCategory}
          focusTarget={focusTarget}
          onSelectDetail={payload => {
            if (payload?.event?.event_id) handleSelectEvent(payload.event);
          }}
          heightClass="h-[520px] sm:h-[600px] lg:h-[650px]"
          titleLabel="National incident command center geospatial tactical map"
        />
      </section>

      {/* 5. RESCUE TACTICAL COMMAND & DISPATCH DEPLOYMENT (Exact layout from Image 2) */}
      <section className={`rounded-2xl p-5 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base tracking-tight uppercase">
                  Rescue Tactical Command &amp; Dispatch Deployment
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Clearance Granted
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Tactical asset deployment: NDRF Battalions, Coast Guard air reconnaissance sorties, and motorized rescue boat units.
              </p>
            </div>
          </div>

          <Link
            to="/government/rescue"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 px-4 py-2 text-xs font-extrabold transition shadow-md"
          >
            <Send className="h-3.5 w-3.5" />
            <span>OPEN FULL DISPATCH CONSOLE</span>
          </Link>
        </div>

        {/* 4 Deployment Metrics in horizontal row */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className={`rounded-xl p-3.5 text-center ${subtleCardClass}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Assigned Units
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-blue-500">8 Battalions</div>
          </div>

          <div className={`rounded-xl p-3.5 text-center ${subtleCardClass}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Rescue Boats
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">42 In Service</div>
          </div>

          <div className={`rounded-xl p-3.5 text-center ${subtleCardClass}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Airlift Sorties
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-cyan-600 dark:text-cyan-400">6 Active Mi-17</div>
          </div>

          <div className={`rounded-xl p-3.5 text-center ${subtleCardClass}`}>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Citizens Evacuated
            </span>
            <div className="mt-1 font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">2,840 Safe</div>
          </div>
        </div>
      </section>

      {/* 6. ACTIVE NATURAL DISASTERS & HIGH PRIORITY DISASTER SECTOR SPLIT */}
      <section className="space-y-3">
        {/* Top Disaster Coordinate Chips (Exact design from Image 1) */}
        <div className="flex flex-wrap items-center gap-3">
          {disasters.map(d => {
            const isSelected = selectedEventId === d.event_id;
            const isFlood = d.hazard_category === 'flood';
            const isCyclone = d.hazard_category === 'cyclone';
            const hazardLabel = isFlood ? 'RAINING' : isCyclone ? 'CYCLONE' : d.disaster_type?.toUpperCase() || 'HAZARD';
            return (
              <button
                key={d.event_id}
                type="button"
                onClick={() => handleSelectEvent(d)}
                className={`relative rounded-2xl px-4 py-2.5 text-left transition shadow-sm cursor-pointer min-w-[170px] ${
                  isSelected
                    ? isDark
                      ? 'border-2 border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30'
                      : 'border-2 border-blue-600 bg-blue-50 text-slate-900 ring-2 ring-blue-500/20'
                    : isDark
                    ? 'border border-white/10 bg-white/5 hover:border-white/20'
                    : 'border border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-rose-500 dark:text-rose-400">
                  {hazardLabel}
                </div>
                <div className={`mt-0.5 font-mono text-xs sm:text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {Number(d.lat).toFixed(2)}°N, {Number(d.lng).toFixed(2)}°E
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                    Score: {d.damage_score_out_of_100 || 74}/100
                  </span>
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse ml-2" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Split Cards Grid */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left Column: Active Natural Disasters List (Image 1) */}
          <div className={`rounded-2xl p-5 lg:col-span-5 flex flex-col justify-between ${cardClass}`}>
            <div>
              <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2 font-extrabold uppercase tracking-wide text-xs">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Active Natural Disasters</span>
                </div>
                <span className="rounded-full bg-orange-500/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-orange-500 dark:text-orange-400">
                  {disasters.length} Hazards
                </span>
              </div>

              {/* Disaster List Items */}
              <div className="mt-3 space-y-2.5">
                {disasters.map(d => {
                  const active = selectedEventId === d.event_id;
                  const isFlood = d.hazard_category === 'flood';
                  const hazardName = isFlood ? 'raining' : d.hazard_category;
                  const refShort = (d.event_id || 'de565260').slice(0, 10) + '..';

                  return (
                    <button
                      key={d.event_id}
                      type="button"
                      onClick={() => handleSelectEvent(d)}
                      className={`w-full rounded-xl border p-3.5 text-left transition cursor-pointer ${
                        active
                          ? isDark
                            ? 'border-2 border-blue-500 bg-blue-500/15 ring-2 ring-blue-500/30'
                            : 'border-2 border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                          : isDark
                          ? 'border-white/10 bg-white/5 hover:bg-white/10'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                          {hazardName}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                            isFlood
                              ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                              : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                          }`}
                        >
                          {(d.dispatch_status || 'status unavailable').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className={`mt-1 font-semibold text-xs truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        {d.title}
                      </div>
                      <div className={`mt-2 flex items-center justify-between text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        <span className="font-mono">{refShort}</span>
                        <span className="font-mono">Single Spot Epicenter</span>
                        <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                          Pop: {formatNumber(d.affected_population_estimate || 8450)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Link
              to="/government/intelligence"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <span>Inspect Granular Incident &amp; Disaster Queue</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Right Column: High Priority Disaster Sector with Circular Gauges (Image 1) */}
          <div className={`rounded-2xl p-5 lg:col-span-7 flex flex-col justify-between ${cardClass}`}>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      High Priority Disaster Sector
                    </span>
                    <h3 className={`font-extrabold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedEvent?.city ? `${selectedEvent.city} Tactical Sector` : 'Location Not Specified'}
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {selectedEvent?.hazard_category || 'raining'} • Response: NDRF Combined Forces
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {(selectedEvent?.dispatch_status || 'status unavailable').replace(/_/g, ' ')}
                </span>
              </div>

              {/* 3 Metric Pills */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className={`rounded-xl p-2.5 ${subtleCardClass}`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Map Spot
                  </span>
                  <div className={`mt-1 font-mono text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1 Epicenter
                  </div>
                </div>

                <div className={`rounded-xl p-2.5 ${subtleCardClass}`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Destroyed
                  </span>
                  <div className="mt-1 font-mono text-lg font-black text-red-500">
                    1
                  </div>
                </div>

                <div className={`rounded-xl p-2.5 ${subtleCardClass}`}>
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Exposure
                  </span>
                  <div className={`mt-1 font-mono text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatNumber(selectedEvent?.affected_population_estimate || 8450)}
                  </div>
                </div>
              </div>

              {/* Two Circular Gauges (74% Hazard Impact & 74% Structural Damage) */}
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border p-4 border-slate-200 dark:border-white/10">
                {/* Circular Gauge 1: Hazard Impact */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className={isDark ? 'text-zinc-700/40' : 'text-slate-200'}
                        stroke="currentColor"
                        strokeWidth="3.2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-500"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeDasharray="74, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className={`absolute font-mono text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      74%
                    </div>
                  </div>
                  <div className={`mt-2 text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    Hazard Impact
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {formatNumber(selectedEvent?.affected_population_estimate || 8450)} affected
                  </div>
                </div>

                {/* Circular Gauge 2: Structural Damage */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className={isDark ? 'text-zinc-700/40' : 'text-slate-200'}
                        stroke="currentColor"
                        strokeWidth="3.2"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-500"
                        stroke="currentColor"
                        strokeWidth="3.2"
                        strokeDasharray="74, 100"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className={`absolute font-mono text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      74%
                    </div>
                  </div>
                  <div className={`mt-2 text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                    Structural Damage
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Index: 74/100
                  </div>
                </div>
              </div>

              {/* Primary Epicenter Coordinate Spot */}
              <div className="mt-4 rounded-xl border p-3 border-slate-200 dark:border-white/10 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-[10px] text-blue-500">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Primary Epicenter Coordinate Spot</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Locality:</span>
                    <p className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {selectedEvent?.city || 'Bholakpur, Hyderabad'}
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Coordinates:</span>
                    <p className={`font-mono font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                      {Number(selectedEvent?.lat || 19.0761).toFixed(4)}° N, {Number(selectedEvent?.lng || 72.878).toFixed(4)}° E
                    </p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Classification:</span>
                    <p className="font-bold text-red-500 uppercase">DESTROYED</p>
                  </div>
                  <div>
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>NDRF Response:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Combined Forces Tasked</p>
                  </div>
                </div>
              </div>
            </div>

            <NdrfVerifyPanel event={selectedEvent} />

            <Link
              to="/government/rescue"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 py-2.5 text-xs font-extrabold transition shadow-md cursor-pointer"
            >
              <span>VIEW TACTICAL DISPATCH WAVES &amp; RESPONSE LOGS</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}