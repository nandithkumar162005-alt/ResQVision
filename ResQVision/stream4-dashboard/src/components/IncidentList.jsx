import React from 'react';
import {
  MapPin,
  Users,
  Activity,
  Clock,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { formatNumber, formatTimestamp, shortenId } from '../utils/formatters';
import { getDispatchStatusInfo } from '../utils/severityColors';

export function IncidentList({
  incidents = [],
  selectedIncidentId = null,
  onSelectIncident = null,
}) {
  if (incidents.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {incidents.map((incident) => {
        const isSelected = incident.event_id === selectedIncidentId;
        const dispatchInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);
        const hasDestroyedZones = (incident.critical_zones || []).some(
          (z) => z.damage_classification === 'destroyed'
        );

        return (
          <button
            key={incident.event_id}
            type="button"
            onClick={() => onSelectIncident && onSelectIncident(incident.event_id)}
            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 group ${
              isSelected
                ? 'bg-[#18263A] border-[#67D4F3] ring-1 ring-[#67D4F3]/30 shadow-md'
                : 'bg-[#0B1220]/70 border-[#263449] hover:border-slate-600 hover:bg-[#152238]'
            }`}
            aria-pressed={isSelected}
            aria-label={`Incident ${shortenId(incident.event_id)} — ${dispatchInfo.label}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  {hasDestroyedZones && (
                    <Zap className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />
                  )}
                  <span className="text-xs font-mono font-bold text-[#F1F5F9] truncate" title={incident.event_id}>
                    {shortenId(incident.event_id, 8, 4)}
                  </span>
                </div>
                <div className="text-xs text-[#94A3B8] truncate leading-relaxed">
                  {incident.location_name || 'Location not provided'}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${dispatchInfo.bgClass} ${dispatchInfo.textClass} ${dispatchInfo.borderClass}`}
                >
                  {dispatchInfo.label}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition ${
                    isSelected ? 'text-[#67D4F3]' : 'text-slate-600 group-hover:text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Compact stats row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#94A3B8] font-mono border-t border-[#263449]/70 pt-2 mt-1">
              <span className="inline-flex items-center gap-1" title="Damage Score (0–100)">
                <Activity className="w-3 h-3 text-purple-400" />
                {incident.damage_score_out_of_100 !== null
                  ? `${incident.damage_score_out_of_100}/100`
                  : '—'}
              </span>

              <span className="inline-flex items-center gap-1" title="Count of mapped critical zones">
                <MapPin className="w-3 h-3 text-amber-400" />
                {incident.critical_zones_count} zones
              </span>

              <span className="inline-flex items-center gap-1" title="Estimated affected population">
                <Users className="w-3 h-3 text-sky-400" />
                {incident.affected_population_estimate !== null
                  ? formatNumber(incident.affected_population_estimate)
                  : '—'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
