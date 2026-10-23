import React from 'react';
import { Camera, MapPin, Activity, ShieldAlert, ArrowRight, Eye } from 'lucide-react';
import { shortenId } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function PhotoReconGallery({
  incidents = [],
  selectedIncidentId = null,
  onSelectIncident = null,
}) {
  const { isDark } = useTheme();

  if (!incidents || incidents.length === 0) return null;

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 mb-6 shadow-xl transition-colors ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div
        className={`flex items-center justify-between pb-3 border-b mb-4 ${
          isDark ? 'border-[#272A36]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Operational Reconnaissance & Damage Imagery
            </h3>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Live drone captures, satellite inspection feeds, and verified field photography
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isDark
              ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
              : 'text-blue-600 bg-blue-50 border-blue-200'
          }`}
        >
          {incidents.length} SECTORS MONITORED
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {incidents.slice(0, 8).map((incident) => {
          const isSelected = incident.event_id === selectedIncidentId;
          const hasDestroyed = (incident.critical_zones || []).some(
            (z) => z.damage_classification === 'destroyed'
          );

          return (
            <div
              key={incident.event_id}
              onClick={() => onSelectIncident && onSelectIncident(incident.event_id)}
              className={`rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 group flex flex-col justify-between ${
                isSelected
                  ? isDark
                    ? 'bg-[#1A2234] border-blue-400 ring-2 ring-blue-500/40 shadow-lg scale-[1.02]'
                    : 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-400/40 shadow-md scale-[1.02]'
                  : isDark
                  ? 'bg-[#0B0D13] border-[#272A36] hover:border-slate-500'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="relative h-28 overflow-hidden bg-slate-900">
                <img
                  src={incident.image_url || '/disasters/flood-inundation.jpg'}
                  alt={incident.location_name || 'Disaster site'}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2 left-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase backdrop-blur-md ${
                      hasDestroyed
                        ? 'bg-red-500/90 text-white border-red-400'
                        : 'bg-amber-500/90 text-white border-amber-400'
                    }`}
                  >
                    {hasDestroyed ? 'DESTROYED' : 'MAJOR DAMAGE'}
                  </span>
                </div>
              </div>

              <div className="p-2.5">
                <div
                  className={`text-xs font-bold truncate leading-snug ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {incident.location_name || 'Operational Sector'}
                </div>
                <div
                  className={`flex items-center justify-between text-[10px] font-mono mt-1 pt-1 border-t ${
                    isDark ? 'text-slate-400 border-[#272A36]' : 'text-slate-600 border-slate-200'
                  }`}
                >
                  <span className="font-bold text-blue-500">
                    {shortenId(incident.event_id, 6, 2)}
                  </span>
                  <span>{(incident.critical_zones || []).length} Zones</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
