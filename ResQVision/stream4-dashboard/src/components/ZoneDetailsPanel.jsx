import React from 'react';
import { X, MapPin, AlertCircle, Users, Activity, ExternalLink } from 'lucide-react';
import { formatCoordinate, formatNumber, shortenId } from '../utils/formatters';
import { getDamageSeverity, getDispatchStatusInfo } from '../utils/severityColors';
import { useTheme } from '../context/ThemeContext';

export function ZoneDetailsPanel({
  selectedZone,
  parentIncident,
  onClose,
  onViewIncident,
}) {
  const { isDark } = useTheme();

  if (!selectedZone) return null;

  const severity = selectedZone.severityInfo || getDamageSeverity(selectedZone.damage_classification);
  const dispatchStatus = parentIncident ? getDispatchStatusInfo(parentIncident.dispatch_status) : null;

  return (
    <div
      className={`border rounded-2xl p-4 shadow-xl transition-colors ${
        isDark ? 'bg-[#12141A] border-[#272A36] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b mb-3 ${
          isDark ? 'border-[#272A36]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: severity.colorHex }}
          />
          <span
            className={`font-semibold text-sm font-mono uppercase tracking-wide ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {severity.label} Zone
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-lg transition ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-black hover:bg-slate-100'
          }`}
          aria-label="Close zone details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className={`flex items-center gap-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            Coordinates:
          </span>
          <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {formatCoordinate(selectedZone.lat, selectedZone.lng)}
          </span>
        </div>

        {parentIncident && (
          <>
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Parent Event:
              </span>
              <span className="font-mono font-semibold text-blue-500" title={parentIncident.event_id}>
                {shortenId(parentIncident.event_id, 8, 4)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dispatch Status:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${dispatchStatus?.bgClass} ${dispatchStatus?.textClass} ${dispatchStatus?.borderClass}`}>
                {dispatchStatus?.label}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Activity className="w-3.5 h-3.5 text-purple-500" />
                Damage Score:
              </span>
              <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {parentIncident.damage_score_out_of_100 !== null ? `${parentIncident.damage_score_out_of_100}/100` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <Users className="w-3.5 h-3.5 text-sky-500" />
                Est. Population:
              </span>
              <span className={`font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {parentIncident.affected_population_estimate !== null ? formatNumber(parentIncident.affected_population_estimate) : '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {onViewIncident && parentIncident && (
        <button
          type="button"
          onClick={() => onViewIncident(parentIncident.event_id)}
          className={`w-full mt-3.5 py-2 px-3 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition border ${
            isDark
              ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300'
          }`}
        >
          <span>View Incident & Dispatch Log</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
