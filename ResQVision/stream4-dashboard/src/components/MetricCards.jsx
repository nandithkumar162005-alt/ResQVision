import React from 'react';
import { AlertCircle, MapPin, Users, Send, Clock, HelpCircle } from 'lucide-react';
import { formatNumber, formatRelativeSyncAge } from '../utils/formatters';
import { MetricCardSkeleton } from './LoadingState';
import { useTheme } from '../context/ThemeContext';

export function MetricCards({ kpis, lastSuccessfulSync, isLoading }) {
  const { isDark } = useTheme();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'active-incidents',
      label: 'Active Disasters',
      value: formatNumber(kpis?.activeIncidents ?? 0),
      icon: AlertCircle,
      iconColor: isDark ? 'text-white' : 'text-blue-600',
      badgeBg: isDark ? 'bg-white/10 border-white/20' : 'bg-blue-50 border-blue-200',
      tooltip: 'Total natural disaster records currently tracked.',
      note: 'Verified disaster sectors',
    },
    {
      id: 'critical-zones',
      label: 'Mapped Epicenters',
      value: formatNumber(kpis?.mappedCriticalZones ?? 0),
      icon: MapPin,
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      tooltip: 'Count of validated disaster coordinate spots on the map.',
      note: '1 spot per hazard',
    },
    {
      id: 'estimated-population',
      label: 'Est. Population at Risk',
      value: kpis?.hasPopulationData ? formatNumber(kpis.estimatedAffectedPopulation) : '—',
      icon: Users,
      iconColor: isDark ? 'text-white' : 'text-slate-800',
      badgeBg: isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200',
      tooltip: 'Sum of affected_population_estimate across active events.',
      note: 'Active population model',
    },
    {
      id: 'fully-dispatched',
      label: 'Dispatched Missions',
      value: formatNumber(kpis?.fullyDispatchedEvents ?? 0),
      icon: Send,
      iconColor: isDark ? 'text-slate-300' : 'text-indigo-600',
      badgeBg: isDark ? 'bg-slate-700/20 border-slate-600/30' : 'bg-indigo-50 border-indigo-200',
      tooltip: 'Count of active events where tactical dispatch is active.',
      note: 'All waves en route / on-site',
    },
    {
      id: 'last-sync',
      label: 'Telemetry Heartbeat',
      value: formatRelativeSyncAge(lastSuccessfulSync),
      icon: Clock,
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      tooltip: 'Age of last valid active-disaster response received from backend.',
      note: '10s real-time polling cadence',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`border rounded-2xl p-4 sm:p-5 transition duration-200 flex flex-col justify-between shadow-lg relative group ${
              isDark
                ? 'bg-[#12141A] border-[#272A36] hover:border-slate-500'
                : 'bg-white border-slate-200 hover:border-slate-400 shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span
                className={`text-xs font-semibold truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                title={card.label}
              >
                {card.label}
              </span>
              <div
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-help flex-shrink-0"
                title={card.tooltip}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 my-1">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {card.value}
              </span>
              <div className={`p-2 rounded-xl border ${card.badgeBg} ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className={`text-[11px] font-sans truncate mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {card.note}
            </div>
          </div>
        );
      })}
    </div>
  );
}
