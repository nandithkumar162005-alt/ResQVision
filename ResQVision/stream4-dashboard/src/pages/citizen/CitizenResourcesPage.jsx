import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Clock,
  Compass,
  Droplets,
  ExternalLink,
  Eye,
  HeartPulse,
  Info,
  MapPin,
  Navigation,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  UtensilsCrossed,
  X
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import { DemoBadge, EmptyState, LoadingState, ModalDialog } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { DEMO_RESOURCES } from '../../data/mockData.js';
import { apiFetchResources } from '../../services/api.js';

const CATEGORY_MAP = {
  shelters: { key: 'shelter', label: 'Shelters & Relief Camps', icon: Building, color: 'text-amber-600 bg-amber-50' },
  food: { key: 'food', label: 'Food Distribution Points', icon: UtensilsCrossed, color: 'text-emerald-600 bg-emerald-50' },
  medical: { key: 'hospital', label: 'Hospitals & Medical Centres', icon: HeartPulse, color: 'text-red-600 bg-red-50' },
  rescue: { key: 'rescue', label: 'Rescue & Staging Centres', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  water: { key: 'water', label: 'Drinking-Water & Supplies', icon: Droplets, color: 'text-cyan-600 bg-cyan-50' },
  all: { key: 'all', label: 'All Relief Resources', icon: MapPin, color: 'text-orange-600 bg-orange-50' }
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function CitizenResourcesPage() {
  const navigate = useNavigate();
  const { category: routeCategory } = useParams();
  const [searchParams] = useSearchParams();
  const { theme, useMockData } = useAppState();
  const isDark = theme === 'dark';

  const [activeCategory, setActiveCategory] = useState(routeCategory || 'all');
  const [viewMode, setViewMode] = useState('all'); // 'near_you' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locError, setLocError] = useState('');

  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [detailsModalResource, setDetailsModalResource] = useState(null);
  const [directionsModalResource, setDirectionsModalResource] = useState(null);

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Keep active category in sync with URL route parameter
  useEffect(() => {
    if (routeCategory && CATEGORY_MAP[routeCategory]) {
      setActiveCategory(routeCategory);
    } else {
      setActiveCategory('all');
    }
  }, [routeCategory]);

  const handleCategoryChange = catKey => {
    setActiveCategory(catKey);
    if (catKey === 'all') {
      navigate('/citizen/resources');
    } else {
      navigate(`/citizen/resources/${catKey}`);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadResources() {
      setLoading(true);
      setFetchError('');
      try {
        if (useMockData) {
          setResources(DEMO_RESOURCES);
        } else {
          const res = await apiFetchResources();
          if (!cancelled) setResources(res || []);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err?.message || 'External resource API feed not connected.');
          setResources([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadResources();
    return () => {
      cancelled = true;
    };
  }, [useMockData]);

  // Request device location for "Near You" mode
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setViewMode('near_you');
        setLocatingUser(false);
      },
      err => {
        setLocError('Location permission denied or unavailable. Please use manual city/state search.');
        setLocatingUser(false);
      },
      { timeout: 8000 }
    );
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources
      .filter(item => {
        const catKey = CATEGORY_MAP[activeCategory]?.key || 'all';
        if (catKey !== 'all' && item.category !== catKey) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchCity = item.city?.toLowerCase().includes(q);
          const matchState = item.state?.toLowerCase().includes(q);
          const matchAddress = item.address?.toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchState && !matchAddress) return false;
        }

        return true;
      })
      .map(item => {
        const dist = userCoords ? calculateDistanceKm(userCoords.lat, userCoords.lng, item.lat, item.lng) : null;
        return { ...item, distanceKm: dist };
      })
      .sort((a, b) => {
        if (viewMode === 'near_you' && userCoords) {
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        }
        return a.name.localeCompare(b.name);
      });
  }, [resources, activeCategory, searchQuery, userCoords, viewMode]);

  // Selected item details
  const selectedResource = useMemo(() => {
    if (!selectedResourceId) return filteredResources[0] || null;
    return resources.find(r => r.id === selectedResourceId) || filteredResources[0] || null;
  }, [resources, selectedResourceId, filteredResources]);

  // Map markers
  const mapMarkers = useMemo(() => {
    return filteredResources.map(r => ({
      id: r.id,
      title: r.name,
      subtitle: `${r.category?.toUpperCase()} • ${r.city || 'Location'}${r.is_demo ? ' (DEMO)' : ''}`,
      lat: r.lat,
      lng: r.lng,
      category: r.category,
      badgeColor: r.category === 'hospital' ? '#ef4444' : r.category === 'shelter' ? '#f59e0b' : '#3b82f6',
      details: {
        Address: r.address || 'Address unlisted',
        Capacity: r.capacity || 'Capacity unavailable',
        Availability: r.availability || 'Availability pending report',
        Source: r.source || 'Official Registry',
        Freshness: r.is_demo ? 'Civil Defense Directory' : 'Official Relief Feed'
      }
    }));
  }, [filteredResources]);

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] overflow-hidden ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Top Controls Bar */}
      <div className={`border-b px-4 py-3 shrink-0 ${isDark ? 'glass-dark border-white/10 text-white' : 'glass-light border-zinc-200/80 text-zinc-900'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                {CATEGORY_MAP[activeCategory]?.label || 'Relief Resources Hub'}
              </h1>
              {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} label="Demo Resources" />}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Verified relief facilities, shelters, medical aid, and distribution points.
            </p>
          </div>

          {/* Mode Switcher: Near You vs All */}
          <div className="flex items-center gap-2">
            <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-zinc-200/70'}`}>
              <button
                type="button"
                onClick={() => {
                  if (!userCoords) handleRequestLocation();
                  else setViewMode('near_you');
                }}
                disabled={locatingUser}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'near_you'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                {locatingUser ? 'Locating...' : 'Resources Near You'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                All Resources ({filteredResources.length})
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Search */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {Object.entries(CATEGORY_MAP).map(([catKey, cat]) => {
            const Icon = cat.icon;
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-500'
                    : isDark
                    ? 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}

          <div className="relative ml-auto flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by city, state, or name..."
              className={`w-full rounded-xl border pl-8 pr-3 py-1.5 text-xs outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 ${
                isDark
                  ? 'bg-white/5 border-white/10 text-white placeholder-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400'
              }`}
            />
          </div>
        </div>

        {locError && (
          <div className={`mt-2 text-[11px] rounded-lg p-2 border ${
            isDark ? 'border-amber-500/30 bg-amber-950/20 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            {locError}
          </div>
        )}
      </div>

      {/* MAP + LIST Dual-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Pane: Interactive Vector Map (7 cols) */}
        <div className={`lg:col-span-7 h-[300px] lg:h-full relative border-b lg:border-b-0 lg:border-r ${isDark ? 'border-white/10' : 'border-zinc-200/80'}`}>
          <ResQMap
            markers={mapMarkers}
            selectedMarkerId={selectedResource?.id}
            onSelectMarker={m => setSelectedResourceId(m.id)}
            theme={isDark ? 'dark' : 'light'}
            defaultStyle={isDark ? 'dark' : 'light'}
            className="w-full h-full"
            center={selectedResource ? [selectedResource.lng, selectedResource.lat] : [78.9629, 20.5937]}
            zoom={selectedResource ? 12 : 5}
            interactive={true}
          />
        </div>

        {/* Right Pane: Resource Cards List + Detail Inspector (5 cols) */}
        <div className={`lg:col-span-5 h-full overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-[#0B0D10]' : 'bg-zinc-50/50'}`}>
          {loading ? (
            <LoadingState label="Querying relief resource catalog..." />
          ) : fetchError && resources.length === 0 ? (
            <div className={`rounded-2xl border p-6 text-center shadow-sm ${
              isDark ? 'border-white/10 bg-white/5 text-zinc-100' : 'border-zinc-200 bg-white text-zinc-800'
            }`}>
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>Resource Registry Offline</h3>
              <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{fetchError}</p>
              <p className={`mt-3 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>
                ResQVision displays only verified relief sources. Missing external data is reported honestly.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <EmptyState
              theme={isDark ? 'dark' : 'light'}
              title="No Resources Found"
              description="No relief resources match your current category and search filter."
            />
          ) : (
            filteredResources.map(r => {
              const isSelected = selectedResource?.id === r.id;
              const catConfig = Object.values(CATEGORY_MAP).find(c => c.key === r.category) || CATEGORY_MAP.all;
              const Icon = catConfig.icon;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedResourceId(r.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition shadow-sm ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/15 ring-1 ring-orange-500'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 text-zinc-200'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/80 text-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className={`rounded-lg p-2 shrink-0 ${isDark ? 'bg-orange-500/20 text-orange-400' : catConfig.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>{r.name}</h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{r.address || 'Address unlisted'}</p>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          {r.city}, {r.state}
                        </p>
                      </div>
                    </div>
                    {r.distanceKm != null && (
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isDark ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {r.distanceKm} km away
                      </span>
                    )}
                  </div>

                  {/* Operational Disclaimers & Capacity State (§11-15) */}
                  <div className={`mt-3 grid grid-cols-2 gap-2 pt-2.5 border-t text-[11px] ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                    <div>
                      <span className={`block text-[10px] uppercase font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>Beds / Capacity</span>
                      <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
                        {r.capacity ? r.capacity : 'Capacity unavailable'}
                      </span>
                    </div>
                    <div>
                      <span className={`block text-[10px] uppercase font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>Current Availability</span>
                      <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-700'}`}>
                        {r.availability ? r.availability : 'Availability pending report'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: View Details & Directions (§10, §61) */}
                  <div className={`mt-3 flex items-center justify-between text-xs pt-2.5 border-t ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setDetailsModalResource(r);
                      }}
                      className={`font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                        isDark ? 'text-zinc-200 bg-white/10 hover:bg-white/15' : 'text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5 text-zinc-400" />
                      View Details
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedResourceId(r.id);
                        }}
                        className="text-orange-500 hover:text-orange-400 font-semibold flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        Map Pin
                      </button>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setDirectionsModalResource(r);
                        }}
                        className={`font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition ${
                          isDark ? 'text-sky-300 bg-sky-500/20 hover:bg-sky-500/30' : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        <Compass className="h-3.5 w-3.5 text-sky-400" />
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* VIEW DETAILS MODAL (§10, §11-15) */}
      {detailsModalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border space-y-4 ${
            isDark ? 'glass-dark border-white/15 text-white' : 'glass-light border-zinc-200 text-zinc-900'
          }`}>
            <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-orange-500">
                  {detailsModalResource.category} Details
                </span>
                <h3 className={`text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>{detailsModalResource.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsModalResource(null)}
                className={`rounded-lg p-1 transition ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className={`rounded-xl border p-3 space-y-2 ${isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Address:</span>
                  <span className={`font-medium text-right ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{detailsModalResource.address || 'Address unlisted'}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Coordinates:</span>
                  <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {detailsModalResource.lat?.toFixed(4)}, {detailsModalResource.lng?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Beds / Capacity:</span>
                  <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {detailsModalResource.capacity ? detailsModalResource.capacity : 'Capacity unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Availability:</span>
                  <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {detailsModalResource.availability ? detailsModalResource.availability : 'Availability pending report'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Reporting Source:</span>
                  <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{detailsModalResource.source || 'Civil Registry'}</span>
                </div>
              </div>

              {detailsModalResource.facilities && detailsModalResource.facilities.length > 0 && (
                <div>
                  <span className={`text-[11px] font-semibold block mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Staged Relief Facilities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsModalResource.facilities.map((f, i) => (
                      <span key={i} className={`rounded-md px-2 py-0.5 text-[11px] border ${
                        isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`flex justify-end pt-2 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              <button
                type="button"
                onClick={() => setDetailsModalResource(null)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition ${
                  isDark ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECTIONS MODAL WITH CRITICAL ANTI-HALLUCINATION WARNING (§61) */}
      {directionsModalResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-4 ${
            isDark ? 'glass-dark border-white/15 text-white' : 'glass-light border-zinc-200 text-zinc-900'
          }`}>
            <div className={`flex items-start justify-between border-b pb-3 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-sky-400">
                  Civilian Navigation Link
                </span>
                <h3 className={`text-sm font-bold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                  Route to {directionsModalResource.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDirectionsModalResource(null)}
                className={`rounded-lg p-1 transition ${isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* MANDATORY DISCLAIMER (§61: No Fake Safe Routes) */}
            <div className={`rounded-xl border p-4 text-xs space-y-1.5 ${
              isDark ? 'border-amber-500/30 bg-amber-950/30 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-900'
            }`}>
              <div className={`flex items-center gap-2 font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-950'}`}>
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Verified Evacuation Route Data Not Connected</span>
              </div>
              <p className="leading-relaxed">
                Standard turn-by-turn directions use public civilian road networks. <strong>They are NOT verified evacuation routes and do NOT guarantee road passability or structural safety.</strong>
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                During active flood surge or seismic events, follow instructions from local traffic police and DDMA wardens on the ground.
              </p>
            </div>

            <div className={`rounded-xl border p-3 text-xs space-y-1 ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Destination:</span>
                <span className={`font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{directionsModalResource.name}</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Coordinates:</span>
                <span className={`font-mono ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {directionsModalResource.lat?.toFixed(4)}, {directionsModalResource.lng?.toFixed(4)}
                </span>
              </div>
            </div>

            <div className={`flex items-center justify-between pt-2 border-t ${isDark ? 'border-white/10' : 'border-zinc-200'}`}>
              <button
                type="button"
                onClick={() => setDirectionsModalResource(null)}
                className={`text-xs transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
              >
                Cancel
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${directionsModalResource.lat},${directionsModalResource.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-xs shadow-md transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open External GPS Route
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
