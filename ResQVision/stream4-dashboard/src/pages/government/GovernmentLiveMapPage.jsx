import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Layers, MapPin } from 'lucide-react';
import LocationSearch from '../../components/shared/LocationSearch.jsx';
import ResQMap from '../../components/shared/ResQMap.jsx';
import {
  DemoBadge,
  EmptyState,
  ErrorState,
  LoadingSkeleton
} from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useActiveDisasters, useGeospatialResources } from '../../hooks/useDashboardData.js';
import { formatDateTime, formatNumber, statusReadable } from '../../utils/format.js';

const GOV_LAYERS = [
  { key: 'disasters', label: 'Disaster Markers', dot: 'bg-red-600' },
  { key: 'destroyedZones', label: 'Destroyed Zones (Red)', dot: 'bg-red-500' },
  { key: 'majorZones', label: 'Major Damage Zones (Amber)', dot: 'bg-amber-500' },
  { key: 'rescueUnits', label: 'Authorized Rescue Units', dot: 'bg-orange-500' },
  { key: 'hospital', label: 'Hospitals', dot: 'bg-sky-500' },
  { key: 'shelter', label: 'Shelters', dot: 'bg-green-500' },
  { key: 'food', label: 'Food Hubs', dot: 'bg-amber-600' },
  { key: 'water', label: 'Drinking Water', dot: 'bg-teal-500' },
  { key: 'evacuationRoutes', label: 'Evacuation Tracing Routes', dot: 'bg-emerald-500' },
  { key: 'road_closure', label: 'Road Closures', dot: 'bg-zinc-500' }
];

export default function GovernmentLiveMapPage() {
  const { searchTarget } = useOutletContext() || {};
  const { useMockData, theme } = useAppState();
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
  const rescueUnits = geoRes?.rescueUnits || [];

  const [layers, setLayers] = useState({
    disasters: true,
    destroyedZones: true,
    majorZones: true,
    rescueUnits: true,
    hospital: true,
    shelter: true,
    food: true,
    water: true,
    rescue_center: true,
    road_closure: true,
    evacuationRoutes: true
  });

  const [focusTarget, setFocusTarget] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  const activeDetail = useMemo(() => {
    if (selectedDetail) return selectedDetail;
    if (disasters.length > 0) return { kind: 'disaster', event: disasters[0] };
    return null;
  }, [selectedDetail, disasters]);

  const toggleLayer = key => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={`mx-auto max-w-7xl space-y-4 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`font-display text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Live Map
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
          </div>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Damage zones use red for destroyed and amber for major_damage. Authorized rescue units
            appear only when authorized and available.
          </p>
        </div>

        <LocationSearch
          theme={isDark ? 'dark' : 'light'}
          disasters={disasters}
          onSelectLocation={item => {
            setFocusTarget({ lat: item.lat, lng: item.lng, zoom: item.zoom || 12, nonce: Date.now() });
            if (item.event) setSelectedDetail({ kind: 'disaster', event: item.event });
          }}
        />
      </div>

      {disasterError && (
        <ErrorState
          theme={isDark ? 'dark' : 'light'}
          title="Unable to connect to GET /api/active-disasters"
          message={disasterError.message}
          onRetry={() => retryDisasters()}
        />
      )}

      {isStale && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-2.5 text-xs text-amber-200"
        >
          Stale data warning: showing previously fetched records while refresh failed or timestamp is stale.
        </div>
      )}

      {/* Map Layer Controls */}
      <div className={`rounded-2xl p-3 ${isDark ? 'glass-dark' : 'bg-white border border-slate-200 shadow-sm'}`}>
        <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
          <Layers className="h-3.5 w-3.5 text-orange-500" />
          Map Layer Controls
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GOV_LAYERS.map(ctrl => {
            const active = layers[ctrl.key];
            return (
              <button
                key={ctrl.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleLayer(ctrl.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  active
                    ? isDark
                      ? 'border-orange-500/60 bg-orange-500/15 text-orange-200'
                      : 'border-orange-500 bg-orange-100 text-orange-900 font-semibold'
                    : isDark
                    ? 'border-charcoal-700 bg-charcoal-850 text-zinc-400 hover:bg-charcoal-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${ctrl.dot}`} />
                {ctrl.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Live Map */}
      {disasterLoading ? (
        <LoadingSkeleton theme={isDark ? 'dark' : 'light'} variant="map" />
      ) : (
        <ResQMap
          theme={theme}
          defaultStyle={isDark ? 'dark' : 'light'}
          disasters={disasters}
          resources={resources}
          verifiedRoutes={verifiedRoutes}
          rescueUnits={rescueUnits}
          showRescueUnits
          layers={layers}
          focusTarget={focusTarget}
          onSelectDetail={payload => setSelectedDetail(payload)}
          heightClass="h-[480px] sm:h-[560px] lg:h-[640px]"
          titleLabel="Government live damage and tactical map"
        />
      )}

      {/* Compact Location Details */}
      <section className={`rounded-2xl p-4 sm:p-5 ${isDark ? 'glass-dark' : 'bg-white border border-slate-200 shadow-sm'}`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${isDark ? 'border-charcoal-800' : 'border-slate-200'}`}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500">
              Compact Location Details
            </p>
            <h2 className={`mt-0.5 text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeDetail?.kind === 'unit'
                ? activeDetail.unit.name
                : activeDetail?.kind === 'resource'
                ? activeDetail.resource.name
                : activeDetail?.kind === 'zone'
                ? activeDetail.zone.locality
                : activeDetail?.event
                ? activeDetail.event.title
                : 'Select a map marker'}
            </h2>
          </div>
          {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} />}
        </div>

        {!activeDetail ? (
          <div className="mt-4">
            <EmptyState
              theme={isDark ? 'dark' : 'light'}
              icon={MapPin}
              title="No location selected"
              description="Click any disaster, damage zone, resource, or authorized unit marker on the map."
            />
          </div>
        ) : activeDetail.kind === 'unit' ? (
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Agency</p>
              <p className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeDetail.unit.agency}</p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Status</p>
              <p className="mt-0.5 font-semibold text-orange-600 dark:text-orange-300">{activeDetail.unit.status}</p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Authorized Coordinates</p>
              <p className={`mt-0.5 font-mono ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                {activeDetail.unit.lat}, {activeDetail.unit.lng}
              </p>
            </div>
          </div>
        ) : activeDetail.kind === 'resource' ? (
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Type</p>
              <p className={`mt-0.5 font-semibold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {statusReadable(activeDetail.resource.category)}
              </p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Address</p>
              <p className={`mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{activeDetail.resource.address}</p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Status</p>
              <p className={`mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{activeDetail.resource.status}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Location / Sector</p>
              <p className={`mt-0.5 font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {activeDetail.zone?.locality ||
                  [
                    activeDetail.event?.city,
                    activeDetail.event?.district,
                    activeDetail.event?.state
                  ]
                    .filter(Boolean)
                    .join(', ')}
              </p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Zone Classification</p>
              <p className="mt-0.5 font-semibold text-amber-600 dark:text-amber-300">
                {activeDetail.zone?.damage_classification || 'Event Overview'}
              </p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Affected Population (Estimate)</p>
              <p className={`mt-0.5 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatNumber(activeDetail.event?.affected_population_estimate)}
              </p>
            </div>
            <div>
              <p className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Source &amp; Updated</p>
              <p className={`mt-0.5 ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>{activeDetail.event?.source}</p>
              <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                {formatDateTime(activeDetail.event?.updated_at)}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
