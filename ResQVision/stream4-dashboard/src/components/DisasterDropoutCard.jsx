import React from 'react';
import {
  CloudRain,
  Wind,
  Activity,
  Waves,
  Sun,
  Mountain,
  AlertTriangle,
  ShieldAlert,
  Users,
  Compass,
  X,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { formatNumber } from '../utils/formatters';

export function DisasterDropoutCard({ incident, onClose, onInspect }) {
  const { isDark } = useTheme();

  if (!incident) return null;

  const category = (incident.hazard_category || '').toLowerCase();
  const weather = incident.weather_telemetry || {};
  const isRedAlert = incident.alert_level === 'RED' || incident.risk_level === 'CRITICAL';

  // Determine which live animation viewport to render
  const isRain =
    category === 'flood' ||
    (incident.disaster_type || '').toLowerCase().includes('rain') ||
    (incident.disaster_type || '').toLowerCase().includes('flood');
  const isQuake = category === 'earthquake' || (incident.disaster_type || '').toLowerCase().includes('earthquake');
  const isCyclone = category === 'cyclone' || (incident.disaster_type || '').toLowerCase().includes('cyclone');
  const isTsunami = category === 'tsunami' || (incident.disaster_type || '').toLowerCase().includes('tsunami');
  const isDrought = category === 'drought' || (incident.disaster_type || '').toLowerCase().includes('drought');
  const isLandslide = category === 'landslide' || (incident.disaster_type || '').toLowerCase().includes('landslide');

  return (
    <div
      className={`rounded-2xl border shadow-2xl overflow-hidden transition-all duration-300 ${
        isDark
          ? 'bg-[#12141A]/95 border-[#2A2E3D] text-white'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-xl'
      } backdrop-blur-md`}
    >
      {/* Top Banner with State Name & Severity Pill */}
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isDark ? 'border-[#272A36] bg-[#0A0C10]' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3 h-3 rounded-full animate-ping ${
              isRedAlert ? 'bg-red-500' : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-wider uppercase text-red-500">
                {incident.state_name || 'AFFECTED STATE'}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isRedAlert
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {incident.alert_level || 'ALERT'}
              </span>
            </div>
            <div className="text-xs font-semibold truncate max-w-[240px]">
              {incident.disaster_type}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${
              isDark ? 'hover:bg-[#1E222D] text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-black'
            }`}
            title="Close dropout"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* LIVE ANIMATED SIMULATION VIEWPORT */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-950 flex items-center justify-center border-b border-slate-800">
        {/* Scenario 1: RAINING / FLOOD ANIMATION */}
        {(isRain || isLandslide) && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-900 via-blue-950/70 to-slate-950">
            {/* Storm Clouds */}
            <div className="absolute -top-6 inset-x-0 h-16 bg-gradient-to-b from-slate-800/80 to-transparent blur-md" />

            {/* Falling CSS Rain Streaks */}
            <div className="absolute inset-0 rain-container pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="rain-streak"
                  style={{
                    left: `${(i * 2.5) % 100}%`,
                    top: `-${Math.random() * 40}px`,
                    animationDuration: `${0.4 + (i % 5) * 0.12}s`,
                    animationDelay: `${(i % 10) * 0.05}s`,
                    height: `${14 + (i % 8) * 3}px`,
                    opacity: 0.6 + (i % 4) * 0.1,
                  }}
                />
              ))}
            </div>

            {/* Inundation Water Surface with Ripples */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-blue-900/40 border-t border-blue-400/30 backdrop-blur-xs flex items-center justify-between px-3">
              <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-mono">
                <CloudRain className="w-4 h-4 animate-bounce text-blue-400" />
                <span>Precipitation: <strong>{weather.rainfall_rate_mm_hr || 245} mm/hr</strong></span>
              </div>
              {weather.water_level_m && (
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                  Surge: +{weather.water_level_m}m
                </span>
              )}
            </div>

            {/* Center Live Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 z-10 pointer-events-none">
              <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md mb-1 shadow-lg">
                Torrential Rain Simulation
              </div>
              <div className="text-[11px] text-blue-100 max-w-[280px] drop-shadow-md">
                Continuous downpour detected over epicenter catchment
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: EARTHQUAKE SEISMIC ANIMATION */}
        {isQuake && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 flex items-center justify-center">
            {/* Pulsing Concentric Shockwave Rings */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-red-500/80 animate-ping" />
              <div
                className="absolute w-20 h-20 rounded-full border border-red-400/60 animate-ping"
                style={{ animationDuration: '1.8s', animationDelay: '0.4s' }}
              />
              <div
                className="absolute w-28 h-28 rounded-full border border-amber-500/40 animate-ping"
                style={{ animationDuration: '2.4s', animationDelay: '0.8s' }}
              />

              {/* Epicenter Core Pin */}
              <div className="relative z-10 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                <Activity className="w-4 h-4 text-white animate-pulse" />
              </div>
            </div>

            {/* Bottom Seismic Telemetry Strip */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-red-950/40 border-t border-red-500/30 flex items-center justify-between px-3">
              <span className="text-red-300 text-[11px] font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-red-400" />
                Magnitude: <strong>{weather.magnitude_richter || '6.2'} Richter</strong>
              </span>
              <span className="text-[10px] font-mono bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                Depth: {weather.depth_km || 12} km
              </span>
            </div>

            {/* Center Live Badge */}
            <div className="absolute top-2 inset-x-0 flex justify-center z-10 pointer-events-none">
              <span className="px-3 py-0.5 rounded-full bg-red-600/30 border border-red-500/50 text-red-200 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                Active Seismic Fault Rupture
              </span>
            </div>
          </div>
        )}

        {/* Scenario 3: CYCLONE HURRICANE VORTEX ANIMATION */}
        {isCyclone && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-900 via-teal-950 to-slate-950 flex items-center justify-center">
            {/* Spinning Cyclone Vortex SVG */}
            <div className="relative w-32 h-32 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full text-teal-400/80 drop-shadow-[0_0_15px_rgba(45,212,191,0.6)]">
                <path
                  d="M50 10 C30 10 10 30 10 50 C10 65 25 80 40 80 C60 80 80 60 80 40 C80 25 65 15 50 25 C40 32 40 45 50 48 C55 50 60 45 58 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="6" fill="#FFFFFF" />
              </svg>
            </div>

            {/* Eyewall Wind Particles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono font-black text-white bg-slate-900/80 px-2 py-0.5 rounded border border-teal-400/40">
                {incident.storm_tag || 'CYCLONE VORTEX'}
              </span>
            </div>

            {/* Bottom Wind Telemetry Strip */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-teal-950/40 border-t border-teal-500/30 flex items-center justify-between px-3">
              <span className="text-teal-300 text-[11px] font-mono flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-teal-400" />
                Gale Eyewall: <strong>{weather.wind_speed_kmh || 175} km/h</strong>
              </span>
              <span className="text-[10px] font-mono bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                Gusts: {weather.gust_speed_kmh || 215} km/h
              </span>
            </div>
          </div>
        )}

        {/* Scenario 4: DROUGHT & HEAT HAZE ANIMATION */}
        {isDrought && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-amber-950 via-stone-900 to-amber-950 flex items-center justify-center">
            {/* Heat Haze Shimmer Waves */}
            <div className="absolute inset-0 flex flex-col justify-around opacity-40 animate-pulse">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent transform -skew-y-3" />
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent transform skew-y-2" />
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-300 to-transparent transform -skew-y-1" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <Sun className="w-10 h-10 text-amber-400 animate-spin" style={{ animationDuration: '24s' }} />
              <div className="text-lg font-mono font-black text-amber-200 mt-1">
                {weather.temperature_c || 43.8}°C
              </div>
              <div className="text-[10px] font-mono text-amber-300/80 uppercase">
                Extreme Thermal Stress
              </div>
            </div>

            {/* Bottom Moisture Telemetry Strip */}
            <div className="absolute bottom-0 inset-x-0 h-10 bg-amber-950/40 border-t border-amber-500/30 flex items-center justify-between px-3">
              <span className="text-amber-300 text-[11px] font-mono">
                Soil Moisture Deficit: <strong>{weather.soil_moisture_deficit_pct || 78}%</strong>
              </span>
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Aquifer: {weather.groundwater_anomaly_m || '-14.2m'}
              </span>
            </div>
          </div>
        )}

        {/* Scenario 5: TSUNAMI WAVE SURGE ANIMATION */}
        {isTsunami && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-blue-950 via-indigo-950 to-slate-950 flex items-center justify-center">
            <div className="relative z-10 flex flex-col items-center">
              <Waves className="w-12 h-12 text-cyan-400 animate-pulse" />
              <div className="text-lg font-mono font-black text-cyan-200 mt-1">
                +{weather.wave_height_m || 4.2}m Surge Crest
              </div>
              <div className="text-[10px] font-mono text-cyan-300/80 uppercase">
                Deep-Sea Seismic Propagation
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-10 bg-cyan-950/40 border-t border-cyan-500/30 flex items-center justify-between px-3">
              <span className="text-cyan-300 text-[11px] font-mono">
                Surge Velocity: <strong>{weather.surge_velocity_kmh || 68} km/h</strong>
              </span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                Trench Depth: {weather.epicenter_depth_km || 25} km
              </span>
            </div>
          </div>
        )}
      </div>

      {/* DETAILED STATS & STATUS SECTION */}
      <div className="p-4 space-y-3">
        {/* Status Message from Meteorological Network */}
        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          {weather.status_message || incident.location_name}
        </p>

        {/* Key Metrics Grid */}
        <div
          className={`grid grid-cols-2 gap-2 p-2.5 rounded-xl border text-xs font-mono ${
            isDark ? 'bg-[#0A0C10] border-[#222530]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              EXPOSED POPULATION
            </div>
            <div className="font-bold font-sans text-sm mt-0.5">
              {formatNumber(incident.affected_population_estimate)}
            </div>
          </div>
          <div>
            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              DAMAGE SCORE
            </div>
            <div className="font-bold text-sm text-red-500 mt-0.5">
              {incident.damage_score_out_of_100 || '—'} / 100
            </div>
          </div>
        </div>

        {/* Responsible Relief Agency */}
        <div className="flex items-center gap-2 text-xs">
          <ShieldAlert className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className={`text-[11px] truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <strong>Relief Squad:</strong> {incident.agency}
          </span>
        </div>

        {/* Epicenter Single Coordinate */}
        {incident.critical_zones && incident.critical_zones[0] && (
          <div className="flex items-center gap-2 text-xs">
            <Compass className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span className="font-mono text-[11px] text-slate-400">
              {incident.critical_zones[0].lat.toFixed(4)}°N, {incident.critical_zones[0].lng.toFixed(4)}°E (Single Epicenter)
            </span>
          </div>
        )}

        {/* Action Button */}
        {onInspect && (
          <button
            type="button"
            onClick={() => onInspect(incident.event_id)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md ${
              isDark
                ? 'bg-white hover:bg-slate-200 text-black'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
          >
            <span>Open Detailed Incident Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
