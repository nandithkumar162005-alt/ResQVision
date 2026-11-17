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
  const { useMockData } = useAppState();
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
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0D10] text-zinc-100">
      {/* Top Header */}
      <div className="glass-dark border-b border-white/10 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Government Resource & Asset Registry
              </h1>
              {useMockData && <DemoBadge label="Demo Assets" />}
            </div>
            <p className="text-xs text-zinc-400">
              Read-only view of verified civil relief depots, shelters, hospitals, and staging supplies.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search resource or city..."
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-orange-500 outline-none"
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
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm ring-1 ring-orange-400'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
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
      <div className="bg-zinc-900 border-b border-white/10 px-6 py-2 text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-orange-400 shrink-0" />
          <span>
            <strong>Read-Only Audit Mode:</strong> As specified by the anti-hallucination contract (§33), relief inventory modifications are restricted to verified backend API mutations. Frontend-only edits are prohibited to prevent false operational assurances.
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono text-zinc-500">
          Source: {useMockData ? 'Simulation Store' : 'Civil Depots API'}
        </span>
      </div>

      {/* MAP + LIST Dual-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Map View (7 cols) */}
        <div className="lg:col-span-7 h-[300px] lg:h-full relative border-b lg:border-b-0 lg:border-r border-white/10">
          <ResQMap
            markers={mapMarkers}
            selectedMarkerId={selectedItem?.id}
            onSelectMarker={m => setSelectedId(m.id)}
            theme="dark"
            className="w-full h-full"
            center={selectedItem ? [selectedItem.lng, selectedItem.lat] : [78.9629, 20.5937]}
            zoom={selectedItem ? 12 : 5}
            interactive={true}
          />
        </div>

        {/* Right Inventory List (5 cols) */}
        <div className="lg:col-span-5 h-full overflow-y-auto p-4 space-y-3 bg-[#0F1216]">
          {loading ? (
            <LoadingState label="Querying civil asset registries..." />
          ) : error && resources.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
              <h3 className="text-sm font-semibold text-white">External Registry Disconnected</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
              <p className="mt-3 text-[11px] text-zinc-500">
                ResQVision will not fabricate imaginary bed numbers or ration quantities.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <EmptyState
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
                  className={`rounded-xl border p-4 cursor-pointer transition ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-orange-400">
                        {r.category}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-0.5">{r.name}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{r.address || '—'}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {r.city}, {r.state}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/5 border border-white/5">
                      {r.lat?.toFixed(3)}, {r.lng?.toFixed(3)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Staging Capacity</span>
                      <span className="text-zinc-300 font-medium font-mono">
                        {r.capacity ? r.capacity : '— (Not available)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Current Availability</span>
                      <span className="text-zinc-300 font-medium font-mono">
                        {r.availability ? r.availability : '— (Pending verification)'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 pt-1.5 border-t border-white/5">
                    <span>Source: {r.source || 'Civil Registry'}</span>
                    <span className="text-orange-400 font-semibold">Inspect on Map</span>
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
