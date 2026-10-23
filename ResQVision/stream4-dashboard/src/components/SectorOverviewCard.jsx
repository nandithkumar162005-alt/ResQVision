import React from 'react';
import { MapPin, Layers, ExternalLink, Compass } from 'lucide-react';
import { CircularGauge } from './CircularGauge';
import { formatNumber, formatCoordinate } from '../utils/formatters';
import { getDispatchStatusInfo, getDamageSeverity } from '../utils/severityColors';
import { useTheme } from '../context/ThemeContext';

export function SectorOverviewCard({
  incident,
  onViewDetails,
}) {
  const { isDark } = useTheme();

  if (!incident) return null;

  const dispatchInfo = incident.dispatch_status_info || getDispatchStatusInfo(incident.dispatch_status);
  const totalZones = incident.critical_zones_count || 1;
  const destroyedCount = (incident.critical_zones || []).filter(z => z.damage_classification === 'destroyed').length;
  const majorCount = (incident.critical_zones || []).filter(z => z.damage_classification === 'major_damage').length;

  const inundation = incident.inundation_percentage || 74;
  const structuralStrain = incident.structural_strain || incident.damage_score_out_of_100 || 46;
  const primaryZone = (incident.critical_zones || [])[0];

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl h-full transition-colors duration-200 ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}
    >
      {/* Location Header */}
      <div>
        <div className={`flex items-start justify-between gap-3 mb-3 pb-3 border-b ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl border mt-0.5 flex-shrink-0 ${
              isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-blue-600 border-slate-300'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                isDark ? 'text-white' : 'text-blue-600'
              }`}>
                {incident.severity_label || 'High Priority Disaster Sector'}
              </span>
              <h3 className={`text-base font-bold truncate leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {incident.location_name || 'Location Not Specified'}
              </h3>
              <p className={`text-xs font-sans truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {incident.disaster_type} • Response: <span className="font-semibold">{incident.agency || 'NDRF Combined Forces'}</span>
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${dispatchInfo.bgClass} ${dispatchInfo.textClass} ${dispatchInfo.borderClass} flex-shrink-0`}>
            {dispatchInfo.label}
          </span>
        </div>

        {/* High-Resolution Reconnaissance Imagery Banner */}
        {incident.image_url && (
          <div className={`relative rounded-xl overflow-hidden h-44 border mb-4 group shadow-md ${
            isDark ? 'border-[#272A36]' : 'border-slate-200'
          }`}>
            <img
              src={incident.image_url}
              alt="Disaster site reconnaissance capture"
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end justify-between p-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-white bg-black/80 px-2 py-0.5 rounded border border-white/20 backdrop-blur-sm">
                  PRIMARY EPICENTER SPOT
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-black/80 px-2 py-0.5 rounded border border-white/20 backdrop-blur-sm">
                  Verified Observation
                </span>
              </div>
              <span className="text-[10px] font-mono text-white font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm border border-white/30">
                Score: {incident.damage_score_out_of_100}/100
              </span>
            </div>
          </div>
        )}

        {/* 3 Metric Columns with Big Numbers */}
        <div className={`grid grid-cols-3 gap-3 py-2 mb-4 border rounded-xl p-3 text-center ${
          isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className={`text-[10px] font-mono font-bold uppercase truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              MAP SPOT
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              1 Epicenter
            </div>
          </div>
          <div className={`border-x ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
            <div className="text-[10px] font-mono font-bold uppercase text-red-500 truncate">
              DESTROYED
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#EF4444] mt-0.5">
              {destroyedCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-amber-500 truncate">
              EXPOSURE
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold font-mono mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatNumber(incident.affected_population_estimate)}
            </div>
          </div>
        </div>

        {/* Circular Progress Gauges */}
        <div className={`grid grid-cols-2 gap-4 py-3 mb-4 border rounded-xl p-3 ${
          isDark ? 'bg-[#08090C]/80 border-[#272A36]' : 'bg-slate-50 border-slate-200'
        }`}>
          <CircularGauge
            percentage={inundation}
            size={90}
            strokeWidth={7}
            color={isDark ? '#FFFFFF' : '#2563EB'}
            label="Hazard Impact"
            sublabel={`${formatNumber(incident.affected_population_estimate || 0)} affected`}
          />
          <CircularGauge
            percentage={structuralStrain}
            size={90}
            strokeWidth={7}
            color="#F59E0B"
            label="Structural Damage"
            sublabel={`Index: ${incident.damage_score_out_of_100 || 0}/100`}
          />
        </div>

        {/* Primary Epicenter Spot Details */}
        {primaryZone && (
          <div className="mb-2">
            <h4 className={`text-xs font-mono font-bold uppercase mb-2 flex items-center gap-1.5 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              <Compass className="w-3.5 h-3.5 text-blue-500" />
              Primary Epicenter Coordinate Spot
            </h4>
            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
              isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Locality:</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{primaryZone.locality}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Coordinates:</span>
                <span className="font-bold text-blue-500">{formatCoordinate(primaryZone.lat, primaryZone.lng)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Classification:</span>
                <span className="text-red-500 font-bold uppercase">{primaryZone.damage_classification}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action to View Dispatch */}
      {onViewDetails && (
        <button
          type="button"
          onClick={() => onViewDetails(incident.event_id)}
          className={`w-full mt-4 py-2.5 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg ${
            isDark
              ? 'bg-white hover:bg-slate-200 text-black'
              : 'bg-slate-900 hover:bg-black text-white'
          }`}
        >
          <span>View Tactical Dispatch Waves & Response Logs</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
