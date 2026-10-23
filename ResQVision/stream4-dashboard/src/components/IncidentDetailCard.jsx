import React from 'react';
import {
  MapPin,
  Activity,
  Users,
  Clock,
  Layers,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { formatNumber, formatTimestamp, formatCoordinate, shortenId } from '../utils/formatters';
import { getDispatchStatusInfo, getDamageSeverity } from '../utils/severityColors';
import { useTheme } from '../context/ThemeContext';

export function IncidentDetailCard({ incident, onBack = null }) {
  const { isDark } = useTheme();

  if (!incident) return null;

  const dispatchInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);
  const zones = incident.critical_zones || [];

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-colors ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`inline-flex items-center gap-1 text-xs transition mb-2 font-mono ${
                isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all incidents</span>
            </button>
          )}
          <h2
            className={`text-base sm:text-lg font-bold font-mono tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            title={incident.event_id}
          >
            {incident.event_id}
          </h2>
          <p className={`text-sm mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>
            {incident.location_name || 'Location name not provided'}
          </p>
          {incident.disaster_type && (
            <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {incident.disaster_type}
            </p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${dispatchInfo.bgClass} ${dispatchInfo.textClass} ${dispatchInfo.borderClass}`}
        >
          {dispatchInfo.label}
        </span>
      </div>

      {/* Recon Photo Banner */}
      {incident.image_url && (
        <div
          className={`relative rounded-xl overflow-hidden h-40 border mb-4 group shadow-md ${
            isDark ? 'border-[#272A36]' : 'border-slate-200'
          }`}
        >
          <img
            src={incident.image_url}
            alt="Field reconnaissance capture"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-3">
            <span className="text-[10px] font-mono font-bold text-white bg-black/70 px-2 py-0.5 rounded border border-white/20">
              RECONNAISSANCE EVIDENCE
            </span>
            <span className="text-[10px] font-mono font-bold text-blue-400 bg-black/70 px-2 py-0.5 rounded border border-blue-400/30">
              TELEMETRY VERIFIED
            </span>
          </div>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div
          className={`rounded-xl p-3 border ${
            isDark ? 'bg-[#0B0D13] border-[#272A36]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Activity className="w-3.5 h-3.5 text-purple-500" />
            Damage Score
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {incident.damage_score_out_of_100 !== null ? `${incident.damage_score_out_of_100}` : '—'}
            <span className="text-xs text-slate-500 font-normal">/100</span>
          </div>
        </div>

        <div
          className={`rounded-xl p-3 border ${
            isDark ? 'bg-[#0B0D13] border-[#272A36]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Users className="w-3.5 h-3.5 text-sky-500" />
            Est. Population
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {incident.affected_population_estimate !== null
              ? formatNumber(incident.affected_population_estimate)
              : '—'}
          </div>
        </div>

        <div
          className={`rounded-xl p-3 border ${
            isDark ? 'bg-[#0B0D13] border-[#272A36]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            Primary Epicenter
          </div>
          <div className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            1 Spot
          </div>
        </div>

        <div
          className={`rounded-xl p-3 border ${
            isDark ? 'bg-[#0B0D13] border-[#272A36]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[11px] font-mono mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Last Updated
          </div>
          <div className={`text-xs font-mono leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {incident.updated_at ? formatTimestamp(incident.updated_at) : 'Timestamp unavailable'}
          </div>
        </div>
      </div>

      {/* Critical Zones Coordinates Table */}
      {zones.length > 0 && (
        <div className="mt-4">
          <h4
            className={`text-xs font-semibold mb-2 flex items-center gap-1.5 font-mono uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            Mapped Epicenter Zone ({zones.length})
          </h4>
          <div
            className={`overflow-x-auto rounded-xl border ${
              isDark ? 'border-[#272A36]' : 'border-slate-200'
            }`}
          >
            <table className="w-full text-xs">
              <thead className={isDark ? 'bg-[#0B0D13]' : 'bg-slate-100'}>
                <tr className={`border-b ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
                  <th className={`text-left py-2 px-3 font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>#</th>
                  <th className={`text-left py-2 px-3 font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Coordinates</th>
                  <th className={`text-left py-2 px-3 font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Classification</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, idx) => {
                  const severity = zone.severityInfo || getDamageSeverity(zone.damage_classification);
                  return (
                    <tr
                      key={zone.id || idx}
                      className={`border-b last:border-0 transition ${
                        isDark
                          ? 'border-[#272A36]/60 hover:bg-[#1E212B]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                      <td className={`py-2 px-3 font-mono font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {formatCoordinate(zone.lat, zone.lng)}
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: severity.colorHex }}
                          />
                          <span className={`font-mono text-xs font-semibold ${severity.textClass}`}>
                            {severity.label}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Status description */}
      <div
        className={`mt-4 pt-3 border-t text-[11px] leading-relaxed ${
          isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-600'
        }`}
      >
        <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
          Workflow Note:{' '}
        </span>
        {dispatchInfo.description || 'No description available for this status.'}
      </div>
    </div>
  );
}
