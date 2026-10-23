import React from 'react';
import { AppShell } from '../components/AppShell';
import { DamageOverviewChart } from '../components/DamageOverviewChart';
import { PopulationChart } from '../components/PopulationChart';
import { DamageByIncidentChart } from '../components/DamageByIncidentChart';
import { useIncidents } from '../context/IncidentContext';
import { useTheme } from '../context/ThemeContext';
import { Info, ShieldAlert, Users, Layers } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export function AnalyticsPage() {
  const { incidents, kpis } = useIncidents();
  const { isDark } = useTheme();

  return (
    <AppShell
      title="Disaster Impact Analytics"
      subtitle="Data-derived comparative metrics and structural severity distributions"
    >
      {/* Notice */}
      <div
        className={`flex items-start gap-2.5 p-3.5 mb-6 rounded-2xl border text-xs shadow-sm transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
        <div>
          <span className={`font-semibold font-mono uppercase mr-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Natural Disaster Assessment Matrix:
          </span>
          All comparative metrics reflect active observations across the 6 major natural hazards (Floods, Earthquakes, Cyclones, Tsunamis, Drought, Landslides).
        </div>
      </div>

      {/* Top statistical summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs font-mono mb-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Epicenter Spots Mapped</span>
            <Layers className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {kpis?.mappedCriticalZones || 6}
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            1 unique spot per hazard
          </div>
        </div>

        <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs font-mono mb-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Modeled At-Risk Population</span>
            <Users className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {kpis?.hasPopulationData ? formatNumber(kpis.estimatedAffectedPopulation) : '—'}
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Cumulative modeled exposure
          </div>
        </div>

        <div className={`border rounded-2xl p-4 transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`flex items-center justify-between text-xs font-mono mb-1 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>Active Disaster Types</span>
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {incidents.length}
          </div>
          <div className={`text-[11px] font-mono mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Major natural hazard categories
          </div>
        </div>
      </div>

      {/* Three Core Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-1">
          <DamageOverviewChart incidents={incidents} />
        </div>

        <div className="lg:col-span-2">
          <PopulationChart incidents={incidents} />
        </div>
      </div>

      {/* Chart 3: Critical Zones per Incident */}
      <div className="mb-6">
        <DamageByIncidentChart incidents={incidents} />
      </div>
    </AppShell>
  );
}
