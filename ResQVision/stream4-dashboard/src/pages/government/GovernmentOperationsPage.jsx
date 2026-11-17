import { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  Radio,
  Search,
  Shield,
  Truck,
  Users
} from 'lucide-react';
import ResQMap from '../../components/shared/ResQMap.jsx';
import { DemoBadge, EmptyState } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function GovernmentOperationsPage() {
  const { rescueOperations, updateGovernmentOperation, useMockData } = useAppState();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpId, setSelectedOpId] = useState(null);

  const filteredOperations = useMemo(() => {
    return (rescueOperations || []).filter(op => {
      if (filterStatus !== 'all' && op.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const mId = op.id?.toLowerCase().includes(q);
        const mRef = op.sos_reference?.toLowerCase().includes(q);
        const mLoc = op.location_name?.toLowerCase().includes(q);
        const mTeam = op.assigned_team?.toLowerCase().includes(q);
        if (!mId && !mRef && !mLoc && !mTeam) return false;
      }
      return true;
    });
  }, [rescueOperations, filterStatus, searchQuery]);

  const selectedOp = useMemo(() => {
    if (!selectedOpId) return filteredOperations[0] || null;
    return rescueOperations.find(o => o.id === selectedOpId) || filteredOperations[0] || null;
  }, [rescueOperations, selectedOpId, filteredOperations]);

  const mapMarkers = useMemo(() => {
    return filteredOperations
      .filter(o => o.lat != null && o.lng != null)
      .map(o => ({
        id: o.id,
        title: `${o.id}: ${o.location_name || 'Operation Target'}`,
        subtitle: `Team: ${o.assigned_team || 'Unassigned'} • Status: ${o.status || 'Active'}`,
        lat: o.lat,
        lng: o.lng,
        category: 'rescue',
        badgeColor: o.status === 'completed' ? '#10b981' : '#f59e0b',
        details: {
          'SOS Reference': o.sos_reference || '—',
          'Assigned Team': o.assigned_team || '—',
          'Assigned Resources': Array.isArray(o.resources_assigned)
            ? o.resources_assigned.join(', ')
            : o.resources_assigned || '—',
          'Operational Stage': o.stage || o.status || '—',
          'Live Tracking': 'Not connected (Simulation/Static)'
        }
      }));
  }, [filteredOperations]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0B0D10] text-zinc-100">
      {/* Top Bar */}
      <div className="glass-dark border-b border-white/10 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Authorized Rescue Operations
              </h1>
              {useMockData && <DemoBadge label="Demo Operations" />}
            </div>
            <p className="text-xs text-zinc-400">
              Active field deployments authorized by officers. Autonomous dispatch is strictly prohibited.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Filter Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="all" className="bg-[#14181F]">All Operations</option>
              <option value="in_progress" className="bg-[#14181F]">In Progress / Active</option>
              <option value="completed" className="bg-[#14181F]">Completed</option>
              <option value="pending" className="bg-[#14181F]">Pending Staging</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mandatory Live GPS Tracking Advisory (§29) */}
      <div className="bg-blue-950/40 border-b border-blue-500/20 px-6 py-2 text-[11px] text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-blue-400 shrink-0 animate-pulse" />
          <span>
            <strong>Operational Rule:</strong> Live vehicle/helicopter GPS telemetry is displayed only when authorized encrypted hardware feeds are active. Unconnected units show static staging coordinates.
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400/80">
          Telemetry: {useMockData ? 'Simulation Mode' : 'Awaiting Hardware Feed'}
        </span>
      </div>

      {/* MAP + LIST Dual-Pane Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
        {/* Left Map View (7 cols) */}
        <div className="lg:col-span-7 h-[300px] lg:h-full relative border-b lg:border-b-0 lg:border-r border-white/10">
          <ResQMap
            markers={mapMarkers}
            selectedMarkerId={selectedOp?.id}
            onSelectMarker={m => setSelectedOpId(m.id)}
            theme="dark"
            className="w-full h-full"
            center={selectedOp ? [selectedOp.lng, selectedOp.lat] : [78.9629, 20.5937]}
            zoom={selectedOp ? 12 : 5}
            interactive={true}
          />
        </div>

        {/* Right Operations List & Inspector (5 cols) */}
        <div className="lg:col-span-5 h-full overflow-y-auto p-4 space-y-3 bg-[#0F1216]">
          {filteredOperations.length === 0 ? (
            <EmptyState
              title="No Operations Recorded"
              description="No authorized rescue operations match the selected status filter."
            />
          ) : (
            filteredOperations.map(op => {
              const isSelected = selectedOp?.id === op.id;
              return (
                <div
                  key={op.id}
                  onClick={() => setSelectedOpId(op.id)}
                  className={`rounded-xl border p-4 cursor-pointer transition shadow-sm ${
                    isSelected
                      ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/50'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-orange-400">{op.id}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            op.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {op.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">
                        {op.location_name || 'Incident Target Location'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        SOS Ref: <span className="font-mono text-zinc-300">{op.sos_reference || '—'}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Assigned Unit</span>
                      <span className="text-xs font-semibold text-zinc-200">
                        {op.assigned_team || 'NDRF Batt. 10'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Resources Allocated</span>
                      <span className="text-zinc-300 font-medium">
                        {Array.isArray(op.resources_assigned)
                          ? op.resources_assigned.join(', ')
                          : op.resources_assigned || 'Rescue Boat, Medical Kit'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">Casualties Evacuated</span>
                      <span className="text-emerald-400 font-medium font-mono">
                        {op.casualties_saved != null ? `${op.casualties_saved} persons` : '— (Pending)'}
                      </span>
                    </div>
                  </div>

                  {op.officer_notes && (
                    <div className="mt-2 text-[11px] text-zinc-400 bg-black/20 rounded p-2 border border-white/5">
                      <strong className="text-zinc-300">Officer Note:</strong> {op.officer_notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
