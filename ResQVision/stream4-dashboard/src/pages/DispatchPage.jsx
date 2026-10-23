import React from 'react';
import { AppShell } from '../components/AppShell';
import { DispatchTimeline } from '../components/DispatchTimeline';
import { DisasterMap } from '../components/DisasterMap';
import { useIncidents } from '../context/IncidentContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  MapPin,
  Radio,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { shortenId, formatNumber } from '../utils/formatters';
import { getDispatchStatusInfo } from '../utils/severityColors';

export function DispatchPage() {
  const { isDark } = useTheme();
  const {
    incidents,
    sortedIncidents,
    selectedIncidentId,
    setSelectedIncidentId,
    selectedIncident,
    selectedZoneId,
    setSelectedZoneId,
  } = useIncidents();

  const activeIncident = selectedIncident || sortedIncidents[0] || null;

  return (
    <AppShell
      title="National Emergency Dispatch & Tactical Responder Tracking"
      subtitle="Operational wave transmission telemetry, deployment confirmations, and battalion logs"
    >
      {/* Scope Notice */}
      <div
        className={`flex items-start gap-2.5 p-3.5 mb-5 rounded-2xl border text-xs shadow-md transition-colors duration-200 ${
          isDark
            ? 'bg-[#12141A] border-[#272A36] text-slate-400'
            : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <Shield className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
        <div>
          <span className={`font-semibold font-mono uppercase mr-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Rescue Team Operational Clearance:
          </span>
          Tactical unit transmissions and resource allocation across natural disaster zones. Real-time surveillance of deployed battalions, wave receipts, and field reports.
        </div>
      </div>

      {/* FULL WIDTH MAP CENTERED ON SELECTED INCIDENT / ALL INCIDENTS (SINGLE SPOT) */}
      <div className="mb-6">
        <div className="flex items-center justify-between pb-2 mb-2">
          <span className={`text-xs font-mono font-bold uppercase flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <MapPin className={`w-4 h-4 ${isDark ? 'text-white' : 'text-blue-600'}`} />
            Responder Deployment Grid (Single Epicenter Spot Per Hazard)
          </span>
          {activeIncident && (
            <span className={`text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Target: {activeIncident.location_name}
            </span>
          )}
        </div>
        <DisasterMap
          incidents={activeIncident ? [activeIncident] : incidents}
          selectedIncidentId={activeIncident?.event_id}
          selectedZoneId={selectedZoneId}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
          onSelectZone={(zid) => setSelectedZoneId(zid)}
          height="420px"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Incident Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div
            className={`border rounded-2xl p-4 shadow-xl transition-colors duration-200 ${
              isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
            }`}
          >
            <h3 className={`text-xs font-mono font-bold uppercase tracking-wider mb-3 flex items-center justify-between pb-2 border-b ${
              isDark ? 'text-white border-[#272A36]' : 'text-slate-900 border-slate-200'
            }`}>
              <span>Active Disaster Sectors</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded border ${
                  isDark ? 'text-white bg-white/10 border-white/20' : 'text-slate-900 bg-slate-100 border-slate-300'
                }`}
              >
                {incidents.length} Operations
              </span>
            </h3>

            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {sortedIncidents.map((incident) => {
                const isSelected = incident.event_id === selectedIncidentId;
                const statusInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);

                return (
                  <div
                    key={incident.event_id}
                    onClick={() => setSelectedIncidentId(incident.event_id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex gap-2.5 ${
                      isSelected
                        ? isDark
                          ? 'bg-[#1C1F28] border-white ring-1 ring-white/50 shadow-lg'
                          : 'bg-blue-50 border-blue-600 ring-1 ring-blue-500/40 shadow-md'
                        : isDark
                        ? 'bg-[#08090C] border-[#272A36] hover:border-slate-500 hover:bg-[#14161E]'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {incident.image_url && (
                      <div className={`w-14 h-14 rounded-lg overflow-hidden border flex-shrink-0 ${
                        isDark ? 'border-[#272A36]' : 'border-slate-200'
                      }`}>
                        <img
                          src={incident.image_url}
                          alt={incident.location_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-mono font-bold text-xs truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {incident.state_name || shortenId(incident.event_id, 8, 4)}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${statusInfo.bgClass} ${statusInfo.textClass} ${statusInfo.borderClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>

                      <div className={`text-[11px] font-semibold truncate leading-tight mb-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {incident.disaster_type}
                      </div>

                      <div className={`text-[10px] truncate leading-tight mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {incident.location_name}
                      </div>

                      <div className={`flex items-center justify-between text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span className="font-semibold text-blue-500">{incident.event_id}</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Score: {incident.damage_score_out_of_100}/100</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selected Event Dispatch Details & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeIncident ? (
            <>
              {/* Event Summary Header */}
              <div
                className={`border rounded-2xl p-4 sm:p-5 shadow-xl transition-colors duration-200 ${
                  isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b mb-3 ${
                  isDark ? 'border-[#272A36]' : 'border-slate-200'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-mono uppercase font-bold tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-blue-600'
                      }`}>
                        Target Operation Dossier
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                        {activeIncident.state_name || 'India Scope'}
                      </span>
                    </div>
                    <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {activeIncident.location_name}
                    </h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {activeIncident.disaster_type} • Agency: <strong>{activeIncident.agency || 'NDRF Combined Forces'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                        activeIncident.dispatch_status_info?.bgClass
                      } ${activeIncident.dispatch_status_info?.textClass} ${
                        activeIncident.dispatch_status_info?.borderClass
                      }`}
                    >
                      {activeIncident.dispatch_status_info?.label}
                    </span>
                  </div>
                </div>

                {/* Metadata cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-mono text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Damage Score</span>
                    <span className={`font-mono font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {activeIncident.damage_score_out_of_100}/100
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-mono text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Population Exposed</span>
                    <span className={`font-mono font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatNumber(activeIncident.affected_population_estimate)}
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-mono text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monitored Spot</span>
                    <span className={`font-mono font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      1 Epicenter
                    </span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`font-mono text-[10px] block uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Stream 3 Polling</span>
                    <span className="font-mono font-bold text-emerald-500 text-xs">
                      Active (10s sync)
                    </span>
                  </div>
                </div>

                {/* Enriched Live Telemetry & Ground Meteorological Conditions Box */}
                {activeIncident.weather_telemetry && (
                  <div className={`mt-3 p-3 rounded-xl border text-xs font-mono ${
                    isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-inherit">
                      <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <Radio className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        Live Ground Sensor & Environmental Telemetry
                      </span>
                      <span className="text-[10px] text-emerald-500 font-semibold">Sensor Active</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed mb-2 font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {activeIncident.weather_telemetry.status_message}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">Condition:</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeIncident.weather_telemetry.condition}</span>
                      </div>
                      {activeIncident.weather_telemetry.rainfall_rate_mm_hr && (
                        <div>
                          <span className="text-slate-400 block">Precipitation:</span>
                          <span className="font-bold text-blue-400">{activeIncident.weather_telemetry.rainfall_rate_mm_hr} mm/hr</span>
                        </div>
                      )}
                      {activeIncident.weather_telemetry.wind_speed_kmh && (
                        <div>
                          <span className="text-slate-400 block">Gale Speed:</span>
                          <span className="font-bold text-teal-400">{activeIncident.weather_telemetry.wind_speed_kmh} km/h</span>
                        </div>
                      )}
                      {activeIncident.weather_telemetry.magnitude_richter && (
                        <div>
                          <span className="text-slate-400 block">Magnitude:</span>
                          <span className="font-bold text-red-400">{activeIncident.weather_telemetry.magnitude_richter} Richter</span>
                        </div>
                      )}
                      {activeIncident.weather_telemetry.water_level_m && (
                        <div>
                          <span className="text-slate-400 block">Surge Height:</span>
                          <span className="font-bold text-cyan-400">+{activeIncident.weather_telemetry.water_level_m}m</span>
                        </div>
                      )}
                      {activeIncident.weather_telemetry.temperature_c && (
                        <div>
                          <span className="text-slate-400 block">Temperature:</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeIncident.weather_telemetry.temperature_c}°C</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Vertical Dispatch Timeline */}
              <DispatchTimeline eventId={activeIncident.event_id} />
            </>
          ) : (
            <div className={`border rounded-2xl p-10 text-center ${
              isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}>
              Select an incident to view chronological responder wave logs.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
