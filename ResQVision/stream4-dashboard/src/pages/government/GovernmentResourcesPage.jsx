import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  Compass,
  Droplets,
  HeartPulse,
  Info,
  MapPin,
  Package,
  Search,
  Shield,
  Truck,
  UtensilsCrossed,
  Wrench
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import { DemoBadge, EmptyState, LoadingState } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { DEMO_RESOURCES } from '../../data/mockData.js';
import { apiFetchResources } from '../../services/api.js';

const RESOURCE_TABS = [
  { id: 'all', label: 'All Assets & Depots', icon: Package },
  { id: 'shelter', label: 'Shelters & Relief Camps', icon: Building },
  { id: 'hospital', label: 'Medical & Hospitals', icon: HeartPulse },
  { id: 'food', label: 'Food Rations Distribution', icon: UtensilsCrossed },
  { id: 'water', label: 'Water Depots & Supply', icon: Droplets },
  { id: 'rescue', label: 'Rescue Equipment & Staging', icon: Shield }
];

export default function GovernmentResourcesPage() {
  const { useMockData, theme } = useAppState();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      setLoading(true);
      setError('');
      try {
        if (useMockData) {
          setResources(DEMO_RESOURCES);
        } else {
          const data = await apiFetchResources();
          if (!cancelled) setResources(data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'External resource management API feed not connected.');
          setResources([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [useMockData]);

  const filteredResources = useMemo(() => {
    return resources.filter(item => {
      if (activeTab !== 'all' && item.category !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mName = item.name?.toLowerCase().includes(q);
        const mCity = item.city?.toLowerCase().includes(q);
        const mState = item.state?.toLowerCase().includes(q);
        const mAddress = item.address?.toLowerCase().includes(q);
        if (!mName && !mCity && !mState && !mAddress) return false;
      }
      return true;
    });
  }, [resources, activeTab, searchQuery]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return filteredResources[0] || null;
    return resources.find(r => r.id === selectedId) || filteredResources[0] || null;
  }, [resources, selectedId, filteredResources]);

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
        Address: r.address || '—',
        Capacity: r.capacity || '— (Not available in feed)',
        'Bed Availability': r.availability || '— (Not available in feed)',
        Source: r.source || 'Civil Registry',
        Freshness: r.is_demo ? 'Civil Defense Directory' : 'Official Relief Database'
      }
    }));
  }, [filteredResources]);

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] overflow-hidden ${isDark ? 'bg-[#0B0D10] text-zinc-100' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Top Header */}
      <div className={`border-b px-4 sm:px-6 py-3.5 shrink-0 ${isDark ? 'glass-dark border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Government Resource &amp; Asset Registry
              </h1>
              {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} label="Demo Assets" />}
            </div>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Read-only view of verified civil relief depots, shelters, hospitals, and staging supplies.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className={`absolute left-3 top-2.5 h-3.5 w-3.5 ${isDark ? 'text-zinc-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resource or city..."
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:border-orange-500 ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-white placeholder-zinc-500'
                  : 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {RESOURCE_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-400'
                    : isDark
                    ? 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Read-Only Anti-Hallucination Disclaimer Banner (§33) */}
      <div className={`border-b px-6 py-2 text-[11px] flex items-center justify-between ${
        isDark ? 'bg-zinc-900 border-white/10 text-zinc-400' : 'bg-slate-100 border-slate-200 text-slate-700'
      }`}>
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-orange-500 shrink-0" />
          <span>
            <strong>Read-Only Audit Mode:</strong> As specified by the anti-hallucination contract (§33), relief inventory modifications are restricted to verified backend API mutations. Frontend-only edits are prohibited to prevent false operational assurances.
          </span>
        </div>
        <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          Source: {useMockData ? 'Simulation Store' : 'Civil Depots API'}
        </span>
      </div>

      {/* MAP + LIST Dual-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Map View (7 cols) */}
        <div className={`lg:col-span-7 h-[300px] lg:h-full relative border-b lg:border-b-0 lg:border-r ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <ResQMap
            markers={mapMarkers}
            selectedMarkerId={selectedItem?.id}
            onSelectMarker={m => setSelectedId(m.id)}
            theme={theme}
            defaultStyle={isDark ? 'dark' : 'light'}
            className="w-full h-full"
            center={selectedItem ? [selectedItem.lng, selectedItem.lat] : [78.9629, 20.5937]}
            zoom={selectedItem ? 12 : 5}
            interactive={true}
          />
        </div>

        {/* Right Inventory List (5 cols) */}
        <div className={`lg:col-span-5 h-full overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-[#0F1216]' : 'bg-slate-50'}`}>
          {loading ? (
            <LoadingState label="Querying civil asset registries..." />
          ) : error && resources.length === 0 ? (
            <div className={`rounded-xl border p-6 text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white shadow-sm'}`}>
              <AlertCircle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>External Registry Disconnected</h3>
              <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{error}</p>
              <p className={`mt-3 text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                ResQVision will not fabricate imaginary bed numbers or ration quantities.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <EmptyState
              theme={isDark ? 'dark' : 'light'}
              title="No Resources Found"
              description="No assets match the active category filter."
            />
          ) : (
            filteredResources.map(r => {
              const isSelected = selectedItem?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition shadow-sm ${
                    isSelected
                      ? isDark
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                        : 'border-orange-500 bg-orange-50/70 ring-1 ring-orange-500/50 shadow-md'
                      : isDark
                      ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-orange-500">
                        {r.category}
                      </span>
                      <h4 className={`text-xs font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.name}</h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{r.address || '—'}</p>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        {r.city}, {r.state}
                      </p>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDark ? 'text-zinc-400 bg-white/5 border-white/5' : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                      {r.lat?.toFixed(3)}, {r.lng?.toFixed(3)}
                    </span>
                  </div>

                  <div className={`mt-3 grid grid-cols-2 gap-2 pt-2 border-t text-[11px] ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                    <div>
                      <span className={`text-[10px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Staging Capacity</span>
                      <span className={`font-medium font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {r.capacity ? r.capacity : '— (Not available)'}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[10px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Current Availability</span>
                      <span className={`font-medium font-mono ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                        {r.availability ? r.availability : '— (Pending verification)'}
                      </span>
                    </div>
                  </div>

                  <div className={`mt-2 flex items-center justify-between text-[10px] pt-1.5 border-t ${
                    isDark ? 'text-zinc-500 border-white/5' : 'text-slate-500 border-slate-200'
                  }`}>
                    <span>Source: {r.source || 'Civil Registry'}</span>
                    <span className="text-orange-500 font-semibold">Inspect on Map</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
