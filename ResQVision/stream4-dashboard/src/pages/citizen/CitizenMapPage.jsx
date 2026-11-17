import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  Info,
  Layers,
  MapPin,
  Navigation,
  Route,
  Search,
  ShieldAlert,
  Siren,
  Users
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  LoadingSkeleton
} from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters, useGeospatialResources } from '../../hooks/useDashboardData.js';
import { formatDateTime, formatNumber, formatRelativeTime, statusReadable } from '../../utils/format.js';
import { inferHazardCategory } from '../../utils/hazardEngine.js';

const CITIZEN_LAYER_CONTROLS = [
  { key: 'disasters', label: 'Disaster Locations', dot: 'bg-red-600' },
  { key: 'destroyedZones', label: 'Destroyed Zones', dot: 'bg-red-500' },
  { key: 'majorZones', label: 'Major Damage Zones', dot: 'bg-amber-500' },
  { key: 'hospital', label: 'Hospitals', dot: 'bg-sky-600' },
  { key: 'shelter', label: 'Shelters & Relief Camps', dot: 'bg-green-600' },
  { key: 'food', label: 'Food Distribution', dot: 'bg-orange-600' },
  { key: 'water', label: 'Drinking Water', dot: 'bg-teal-600' },
  { key: 'rescue_center', label: 'Rescue Centers', dot: 'bg-violet-600' },
  { key: 'road_closure', label: 'Road Closures', dot: 'bg-zinc-600' },
  { key: 'evacuationRoutes', label: 'Verified Evacuation Routes', dot: 'bg-emerald-500' }
];

const RESOURCE_CATEGORIES = [
  { id: 'all', label: 'All Available' },
  { id: 'shelter', label: 'Shelters' },
  { id: 'hospital', label: 'Hospitals' },
  { id: 'food', label: 'Food' },
  { id: 'water', label: 'Water' },
  { id: 'rescue_center', label: 'Rescue Centers' },
  { id: 'road_closure', label: 'Road Closures' }
];

export default function CitizenMapPage() {
  const { searchTarget } = useOutletContext() || {};
  const { theme, useMockData } = useAppState();
  const isDark = theme === 'dark';
  const {
    data: disasterRes,
    error: disasterError,
    isLoading: disasterLoading,
    isStale,
    mutate: retryDisasters
  } = useActiveDisasters();
  const { data: geoRes } = useGeospatialResources();

  const disasters = disasterRes?.items || [];
  const resources = geoRes?.resources || [];
  const verifiedRoutes = geoRes?.verifiedRoutes || [];

  const [layers, setLayers] = useState({
    disasters: true,
    destroyedZones: true,
    majorZones: true,
    hospital: true,
    shelter: true,
    food: true,
    water: true,
    rescue_center: true,
    road_closure: true,
    evacuationRoutes: true
  });

  const [selectedDetail, setSelectedDetail] = useState(null);
  const [focusTarget, setFocusTarget] = useState(null);
  const [resCategory, setResCategory] = useState('all');
  const [resQuery, setResQuery] = useState('');

  useEffect(() => {
    if (searchTarget) {
      setFocusTarget({
        lat: searchTarget.lat,
        lng: searchTarget.lng,
        zoom: searchTarget.zoom || 11.5,
        nonce: searchTarget.nonce
      });
      if (searchTarget.event) {
        setSelectedDetail({ kind: 'disaster', event: searchTarget.event });
      }
    }
  }, [searchTarget]);

  const activeSelection = useMemo(() => {
    if (selectedDetail) return selectedDetail;
    if (disasters.length > 0) return { kind: 'disaster', event: disasters[0] };
    return null;
  }, [selectedDetail, disasters]);

  const activeHazardHint = activeSelection?.event
    ? inferHazardCategory(activeSelection.event)
    : null;

  const filteredResources = useMemo(() => {
    if (!Array.isArray(resources)) return [];
    const q = resQuery.trim().toLowerCase();
    return resources.filter(res => {
      if (resCategory !== 'all' && res.category !== resCategory) return false;
      if (!q) return true;
      return [res.name, res.city, res.state, res.address, res.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [resources, resCategory, resQuery]);

  const toggleLayer = key => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const focusResource = res => {
    setSelectedDetail({ kind: 'resource', resource: res });
    if (Number.isFinite(Number(res.lat)) && Number.isFinite(Number(res.lng))) {
      setFocusTarget({
        lat: Number(res.lat),
        lng: Number(res.lng),
        zoom: 13.5,
        nonce: Date.now()
      });
    }
  };

  const cardClass = isDark
    ? 'glass-dark border border-white/10 text-zinc-100 shadow-md'
    : 'glass-light border border-zinc-200 text-zinc-900 shadow-sm';

  const subtleCardClass = isDark
    ? 'glass-dark-subtle border border-white/5 text-zinc-200'
    : 'glass-light-subtle border border-zinc-200/60 text-zinc-800';

  const headingClass = isDark ? 'text-white' : 'text-zinc-900';
  const subtextClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const borderClass = isDark ? 'border-white/10' : 'border-zinc-200/70';

  return (
    <div className={`mx-auto max-w-7xl space-y-4 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-xl font-bold sm:text-2xl ${headingClass}`}>
              Home / Disaster Map
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>
          <p className={`mt-0.5 text-xs ${subtextClass}`}>
            Click any marker or resource below to inspect details. Search above by state, district,
            city, or PIN code.
          </p>
        </div>

        <Link
          to="/citizen/sos"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 sm:text-sm"
        >
          <Siren className="h-4 w-4" />
          Emergency SOS Alert
        </Link>
      </div>

      {disasterError && (
        <ErrorState
          theme={isDark ? 'dark' : 'light'}
          title="Unable to connect to active disasters service"
          message={disasterError.message}
          onRetry={() => retryDisasters()}
        />
      )}

      {isStale && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-2.5 text-xs ${
            isDark
              ? 'border-amber-500/30 bg-amber-950/20 text-amber-300'
              : 'border-amber-300 bg-amber-50/90 text-amber-900'
          }`}
        >
          Showing older cached disaster records: latest refresh failed or source timestamp is stale.
        </div>
      )}

      {/* Main Map Area — Strictly theme-responsive */}
      {disasterLoading ? (
        <LoadingSkeleton theme={isDark ? 'dark' : 'light'} variant="map" />
      ) : (
        <ResQMap
          theme={isDark ? 'dark' : 'light'}
          defaultStyle={isDark ? 'dark' : 'light'}
          disasters={disasters}
          resources={resources}
          verifiedRoutes={verifiedRoutes}
          showRescueUnits={false}
          layers={layers}
          activeEventHazardHint={activeHazardHint}
          focusTarget={focusTarget}
          onSelectDetail={payload => setSelectedDetail(payload)}
          heightClass="h-[460px] sm:h-[540px] lg:h-[580px]"
          titleLabel="Citizen disaster and help location map"
        />
      )}

      {/* Below-Map Grid: Situation Details + Integrated Resource Finder */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Compact Situation Details */}
        <section
          aria-label="Situation details"
          className={`rounded-2xl p-4 sm:p-5 lg:col-span-7 border ${cardClass}`}
        >
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${borderClass}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                Situation &amp; Selection Details
              </p>
              <h2 className={`text-base font-bold ${headingClass}`}>
                {activeSelection?.kind === 'resource'
                  ? activeSelection.resource.name
                  : activeSelection?.kind === 'zone'
                  ? `${activeSelection.zone.locality || activeSelection.event.title}`
                  : activeSelection?.event
                  ? activeSelection.event.title
                  : 'No active disaster selected'}
              </h2>
            </div>

            {activeSelection?.event && (
              <div className={`flex flex-wrap items-center gap-2 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-zinc-900/5'}`}>
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatRelativeTime(activeSelection.event.updated_at)}
                </span>
                {activeSelection.event.is_demo && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
              </div>
            )}
          </div>

          {!activeSelection ? (
            <div className="mt-4">
              <EmptyState
                theme={isDark ? 'dark' : 'light'}
                icon={MapPin}
                title="No disaster events available"
                description={
                  disasterError
                    ? 'Active disaster API is unreachable. No unverified or fabricated events are substituted.'
                    : 'No active disaster records returned.'
                }
              />
            </div>
          ) : activeSelection.kind === 'resource' ? (
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold capitalize ${
                  isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-orange-100 text-orange-800'
                }`}>
                  {statusReadable(activeSelection.resource.category)}
                </span>
                {activeSelection.resource.is_demo && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Location / Address</p>
                  <p className={`mt-0.5 font-semibold ${headingClass}`}>
                    {activeSelection.resource.address || 'Not supplied'}
                  </p>
                </div>
                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Availability &amp; Capacity</p>
                  <p className={`mt-0.5 font-semibold ${headingClass}`}>
                    {activeSelection.resource.availability || 'Not supplied'} · Capacity:{' '}
                    {activeSelection.resource.capacity || 'Not supplied'}
                  </p>
                </div>
                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Relevant Facilities</p>
                  <p className={`mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    {Array.isArray(activeSelection.resource.facilities) &&
                    activeSelection.resource.facilities.length
                      ? activeSelection.resource.facilities.join(', ')
                      : 'Not supplied'}
                  </p>
                </div>
                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Verified Contact &amp; Directions</p>
                  <p className={`mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>
                    Contact: {activeSelection.resource.verified_contact || 'Not supplied'}
                  </p>
                  <p className={`mt-0.5 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Directions available only when a verified routing service is connected.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Disaster Type &amp; Location
                  </div>
                  <p className={`mt-1 text-sm font-semibold ${headingClass}`}>
                    {activeSelection.event.disaster_type}
                  </p>
                  <p className={`text-xs ${subtextClass}`}>
                    {[
                      activeSelection.event.city,
                      activeSelection.event.district,
                      activeSelection.event.state
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Location not supplied'}
                  </p>
                </div>

                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold">
                    <Users className="h-3.5 w-3.5" />
                    Affected Population (Estimate)
                  </div>
                  <p className={`mt-1 font-mono text-base font-bold ${headingClass}`}>
                    {activeSelection.event.affected_population_estimate != null
                      ? formatNumber(activeSelection.event.affected_population_estimate)
                      : 'Not supplied'}
                  </p>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {activeSelection.event.affected_population_estimate != null
                      ? 'Estimate only: not a live headcount'
                      : 'Not supplied by API'}
                  </p>
                </div>

                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Reported Damage Zones</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold">
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-400 border border-red-500/30">
                      {
                        (activeSelection.event.critical_zones || []).filter(
                          z => z.damage_classification === 'destroyed'
                        ).length
                      }{' '}
                      destroyed
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-400 border border-amber-500/30">
                      {
                        (activeSelection.event.critical_zones || []).filter(
                          z => z.damage_classification === 'major_damage'
                        ).length
                      }{' '}
                      major_damage
                    </span>
                  </div>
                </div>

                <div className={`rounded-xl p-3 border ${subtleCardClass}`}>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Source &amp; Observation Time</p>
                  <p className={`mt-1 text-xs font-semibold ${headingClass}`}>
                    {activeSelection.event.source || 'Source unavailable'}
                  </p>
                  <p className={`mt-0.5 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {formatDateTime(activeSelection.event.updated_at)}
                  </p>
                </div>
              </div>

              {activeSelection.event.summary && (
                <p className={`text-xs leading-relaxed ${subtextClass}`}>
                  {activeSelection.event.summary}
                </p>
              )}

              <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-zinc-200/80 bg-white/70 text-zinc-600'
              }`}>
                <span className="inline-flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-orange-500" />
                  Need urgent assistance? Submit an SOS report or dial <strong>112</strong>.
                </span>
                <Link
                  to="/citizen/sos"
                  className="inline-flex items-center gap-1.5 font-bold text-red-500 hover:text-red-400"
                >
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Open Emergency SOS Alert →
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Integrated Citizen Resource Finder */}
        <section
          aria-label="Resource finder"
          className={`flex flex-col rounded-2xl p-4 sm:p-5 lg:col-span-5 border ${cardClass}`}
        >
          <div className={`flex items-center justify-between gap-2 border-b pb-3 ${borderClass}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
                Help Locations
              </p>
              <h2 className={`text-base font-bold ${headingClass}`}>Nearby Resource Finder</h2>
            </div>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>

          <div className="mt-3 space-y-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={resQuery}
                onChange={e => setResQuery(e.target.value)}
                placeholder="Filter by facility name, city, or address..."
                aria-label="Filter help locations"
                className={`w-full rounded-xl border py-2 pl-8 pr-3 text-xs focus:border-orange-500 ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-white placeholder:text-zinc-500'
                    : 'border-zinc-200 bg-white/80 text-zinc-900 placeholder:text-zinc-400'
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {RESOURCE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setResCategory(cat.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                    resCategory === cat.id
                      ? isDark
                        ? 'border-orange-500 bg-orange-600 text-white font-bold shadow-sm'
                        : 'border-zinc-900 bg-zinc-900 text-white'
                      : isDark
                      ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                      : 'border-zinc-200 bg-white/70 text-zinc-600 hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 max-h-[290px] flex-1 space-y-2 overflow-y-auto pr-1">
            {!Array.isArray(resources) || resources.length === 0 ? (
              <EmptyState
                theme={isDark ? 'dark' : 'light'}
                icon={MapPin}
                title="No verified resource directory connected"
                description="Shelters, hospitals, food, water, and evacuation routes appear only when supplied by an authoritative geospatial source."
              />
            ) : filteredResources.length === 0 ? (
              <EmptyState
                theme={isDark ? 'dark' : 'light'}
                icon={Search}
                title="No matching resources"
                description="Try clearing the resource filter or search term."
              />
            ) : (
              filteredResources.map(res => (
                <div
                  key={res.id}
                  className={`flex items-center justify-between gap-3 rounded-xl p-3 border transition ${subtleCardClass}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`truncate text-xs font-bold ${headingClass}`}>{res.name}</span>
                    </div>
                    <p className={`mt-0.5 truncate text-[11px] ${subtextClass}`}>{res.address}</p>
                    <p className={`mt-0.5 text-[10px] capitalize ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {statusReadable(res.category)} · {res.availability || 'Availability not supplied'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => focusResource(res)}
                    className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                      isDark
                        ? 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:border-orange-500 hover:text-orange-400'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:border-orange-400 hover:text-orange-700'
                    }`}
                  >
                    <Navigation className="h-3 w-3 text-orange-500" />
                    Locate
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
