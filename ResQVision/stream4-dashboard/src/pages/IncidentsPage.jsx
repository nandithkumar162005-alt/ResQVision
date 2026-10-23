import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SectorOverviewCard } from '../components/SectorOverviewCard';
import { DisasterMap } from '../components/DisasterMap';
import { useIncidents } from '../context/IncidentContext';
import { useTheme } from '../context/ThemeContext';
import {
  Search,
  RotateCcw,
  X,
} from 'lucide-react';
import { getDispatchStatusInfo } from '../utils/severityColors';

export function IncidentsPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const {
    incidents,
    sortedIncidents,
    hasTimestampSorting,
    selectedIncidentId,
    setSelectedIncidentId,
    selectedIncident,
    selectedZoneId,
    setSelectedZoneId,
  } = useIncidents();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedClassification, setSelectedClassification] = useState('ALL');
  const [sortBy, setSortBy] = useState('NAME'); // 'NAME' | 'TIME' | 'SCORE'

  // Discover available filter options from the current dataset
  const availableStatuses = useMemo(() => {
    const statuses = new Set();
    incidents.forEach((i) => {
      if (i.dispatch_status) statuses.add(i.dispatch_status);
    });
    return Array.from(statuses);
  }, [incidents]);

  // Filter and sort incidents
  const filteredIncidents = useMemo(() => {
    let list = sortedIncidents.filter((incident) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchId = incident.event_id.toLowerCase().includes(query);
        const matchLoc = incident.location_name?.toLowerCase().includes(query);
        const matchType = incident.disaster_type?.toLowerCase().includes(query);
        if (!matchId && !matchLoc && !matchType) return false;
      }

      if (selectedStatus !== 'ALL' && incident.dispatch_status !== selectedStatus) {
        return false;
      }

      if (selectedClassification !== 'ALL') {
        const hasMatchingZone = (incident.critical_zones || []).some(
          (z) => z.damage_classification === selectedClassification
        );
        if (!hasMatchingZone) return false;
      }

      return true;
    });

    if (sortBy === 'NAME') {
      list = [...list].sort((a, b) => (a.location_name || '').localeCompare(b.location_name || ''));
    } else if (sortBy === 'SCORE') {
      list = [...list].sort((a, b) => (b.damage_score_out_of_100 || 0) - (a.damage_score_out_of_100 || 0));
    }

    return list;
  }, [sortedIncidents, searchQuery, selectedStatus, selectedClassification, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedStatus !== 'ALL' || selectedClassification !== 'ALL' || sortBy !== 'NAME';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setSelectedClassification('ALL');
    setSortBy('NAME');
  };

  const handleSelectIncident = (id) => {
    setSelectedIncidentId(id);
    setSelectedZoneId(null);
  };

  const activeIncident = selectedIncident || filteredIncidents[0] || null;

  return (
    <AppShell
      title="Disaster Incidents Queue & Geospatial Analysis"
      subtitle="Operational event surveillance, Copernicus EMS footprints, and multi-hazard assessment"
    >
      {/* Search and Filters Bar */}
      <div
        className={`border rounded-2xl p-4 mb-5 shadow-lg transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? 'text-slate-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event ID, disaster type, state, locality..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs focus:outline-none transition font-sans ${
                isDark
                  ? 'bg-[#08090C] border-[#272A36] text-white placeholder-slate-500 focus:border-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
              }`}
              aria-label="Search incident records"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-black'}`}
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-mono text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`py-1.5 px-3 rounded-xl border text-xs focus:outline-none font-mono ${
                  isDark
                    ? 'bg-[#08090C] border-[#272A36] text-white focus:border-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
                aria-label="Filter by dispatch status"
              >
                <option value="ALL">All Statuses ({incidents.length})</option>
                {availableStatuses.map((st) => {
                  const info = getDispatchStatusInfo(st);
                  const count = incidents.filter((i) => i.dispatch_status === st).length;
                  return (
                    <option key={st} value={st}>
                      {info.label} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-mono text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Severity:</span>
              <select
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                className={`py-1.5 px-3 rounded-xl border text-xs focus:outline-none font-mono ${
                  isDark
                    ? 'bg-[#08090C] border-[#272A36] text-white focus:border-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
                aria-label="Filter by damage classification"
              >
                <option value="ALL">All Classifications</option>
                <option value="destroyed">Contains Destroyed Zones</option>
                <option value="major_damage">Contains Major Damage</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className={`font-mono text-[11px] hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Order:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`py-1.5 px-3 rounded-xl border text-xs focus:outline-none font-mono font-semibold ${
                  isDark
                    ? 'bg-[#08090C] border-[#272A36] text-white focus:border-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-600'
                }`}
                aria-label="Sort incident queue order"
              >
                <option value="NAME">Order: Name (A-Z)</option>
                <option value="TIME">Order: Latest Activity</option>
                <option value="SCORE">Order: Severity Score</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-mono transition ${
                  isDark
                    ? 'bg-[#1A1D24] hover:bg-[#232731] text-white border-[#272A36]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-300'
                }`}
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className={`flex items-center justify-between mt-2.5 pt-2 border-t text-[11px] font-mono ${
          isDark ? 'border-[#272A36] text-slate-500' : 'border-slate-200 text-slate-400'
        }`}>
          <span>
            {hasTimestampSorting
              ? 'Sorted by latest verified telemetry updates (updated_at / created_at)'
              : 'Sorted by authoritative Stream 3 event records'}
          </span>
          <span className={`font-semibold ${isDark ? 'text-white' : 'text-blue-600'}`}>
            Showing {filteredIncidents.length} of {incidents.length} active events
          </span>
        </div>
      </div>

      {/* FULL WIDTH MAP (NO CARDS ON LEFT OR RIGHT) */}
      <div className="mb-6">
        <DisasterMap
          incidents={filteredIncidents}
          selectedIncidentId={selectedIncidentId}
          selectedZoneId={selectedZoneId}
          onSelectIncident={handleSelectIncident}
          onSelectZone={(zid) => setSelectedZoneId(zid)}
          onViewDetails={handleSelectIncident}
          height="520px"
        />
      </div>

      {/* BELOW MAP: Split Queue and Detailed Copernicus EMS Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Incident Queue Column (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
            <span className={`text-xs font-mono font-bold uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Emergency Events Queue
            </span>
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                isDark ? 'text-white bg-white/10 border-white/20' : 'text-slate-900 bg-slate-100 border-slate-300'
              }`}
            >
              {filteredIncidents.length} Records
            </span>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className={`border rounded-2xl p-8 text-center ${
              isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              No active events match the specified search filters.
              <button
                type="button"
                onClick={handleClearFilters}
                className="block mx-auto mt-2 text-xs text-blue-500 hover:underline font-mono"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredIncidents.map((incident) => {
              const isSelected = incident.event_id === selectedIncidentId;
              const dispatchInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);

              return (
                <div
                  key={incident.event_id}
                  onClick={() => handleSelectIncident(incident.event_id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex gap-3 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1C1F28] border-white ring-1 ring-white/50 shadow-xl'
                        : 'bg-blue-50 border-blue-600 ring-1 ring-blue-500/40 shadow-md'
                      : isDark
                      ? 'bg-[#12141A] border-[#272A36] hover:border-slate-500 hover:bg-[#161820]'
                      : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  {incident.image_url && (
                    <div className={`w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 ${
                      isDark ? 'border-[#272A36]' : 'border-slate-200'
                    }`}>
                      <img
                        src={incident.image_url}
                        alt={incident.location_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {incident.state_name && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold uppercase flex-shrink-0">
                              {incident.state_name}
                            </span>
                          )}
                          <span className={`text-xs font-bold truncate leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {incident.location_name}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${dispatchInfo.bgClass} ${dispatchInfo.textClass} ${dispatchInfo.borderClass} flex-shrink-0`}
                        >
                          {dispatchInfo.label}
                        </span>
                      </div>
                      <p className={`text-[11px] font-medium leading-tight mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {incident.disaster_type}
                      </p>
                      <p className={`text-[10px] truncate leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Response Agency: <strong>{incident.agency || 'NDRF Combined Forces'}</strong>
                      </p>
                    </div>

                    <div className={`flex items-center justify-between text-[10px] font-mono pt-2 border-t mt-1.5 ${
                      isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-500'
                    }`}>
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-blue-600'}`}>{incident.event_id}</span>
                      <span>Damage: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{incident.damage_score_out_of_100 || '—'}/100</strong></span>
                      <span className="text-emerald-500 font-semibold">1 Epicenter Spot</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Incident Dossier Column (7 cols) */}
        <div className="lg:col-span-7">
          {activeIncident ? (
            <SectorOverviewCard
              incident={activeIncident}
              onViewDetails={() => navigate('/dispatch')}
            />
          ) : (
            <div className={`border rounded-2xl p-8 text-center ${
              isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              Select an incident from the queue to view detailed satellite analysis.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
