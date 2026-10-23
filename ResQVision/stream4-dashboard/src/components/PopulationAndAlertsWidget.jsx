import React from 'react';
import { LargePopulationGauge } from './CircularGauge';
import { Bell, ShieldAlert, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { formatNumber, formatTimestamp, shortenId } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function PopulationAndAlertsWidget({
  kpis,
  incidents = [],
  selectedIncidentId = null,
  onSelectIncident = null,
}) {
  const { isDark } = useTheme();
  const totalPop = kpis?.estimatedAffectedPopulation || 47400;

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Top Card: Large Circular Population Gauge */}
      <div
        className={`border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col items-center text-center transition-colors ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div
          className={`w-full flex items-center justify-between pb-2 border-b mb-3 ${
            isDark ? 'border-[#272A36]' : 'border-slate-200'
          }`}
        >
          <span
            className={`text-xs font-mono font-bold uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Population Impact
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDark
                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                : 'text-blue-600 bg-blue-50 border-blue-200'
            }`}
          >
            AI ESTIMATE
          </span>
        </div>

        <LargePopulationGauge
          population={totalPop}
          percentage={68}
          size={130}
          strokeWidth={9}
          color="#3B82F6"
        />

        {/* 3 mini stats below gauge */}
        <div
          className={`grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t text-center font-mono ${
            isDark ? 'border-[#272A36]' : 'border-slate-200'
          }`}
        >
          <div>
            <div className={`text-[11px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {formatNumber(totalPop)}
            </div>
            <div className={`text-[9px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Total At-Risk
            </div>
          </div>
          <div className={`border-x ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
            <div className="text-[11px] font-bold text-blue-500">68%</div>
            <div className={`text-[9px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Evac Readiness
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-500">74%</div>
            <div className={`text-[9px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Response Avg
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: Notification / Incident Queue with colored dots */}
      <div
        className={`border rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div>
          <div
            className={`flex items-center justify-between pb-2.5 border-b mb-3 ${
              isDark ? 'border-[#272A36]' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span
                className={`text-xs font-mono font-bold uppercase ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Live Notifications
              </span>
            </div>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {incidents.length} Records
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {incidents.slice(0, 4).map((inc) => {
              const isSelected = inc.event_id === selectedIncidentId;
              const hasDestroyed = (inc.critical_zones || []).some(
                (z) => z.damage_classification === 'destroyed'
              );
              const riskTag = hasDestroyed ? 'HIGH RISK' : inc.dispatch_status === 'ndrf_confirmed' ? 'MEDIUM RISK' : 'LOW RISK';
              const dotColor = hasDestroyed ? 'bg-[#EF4444]' : inc.dispatch_status === 'ndrf_confirmed' ? 'bg-[#F59E0B]' : 'bg-blue-500';

              return (
                <button
                  key={inc.event_id}
                  type="button"
                  onClick={() => onSelectIncident && onSelectIncident(inc.event_id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition flex flex-col gap-1 ${
                    isSelected
                      ? isDark
                        ? 'bg-[#1A2234] border-blue-400 ring-1 ring-blue-500/30'
                        : 'bg-blue-50 border-blue-500 ring-1 ring-blue-400/30'
                      : isDark
                      ? 'bg-[#0B0D13] border-[#272A36] hover:border-slate-600'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div
                      className={`flex items-center gap-1.5 font-bold ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span>{riskTag}</span>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold border ${
                        isDark
                          ? 'bg-black/40 text-blue-400 border-slate-700'
                          : 'bg-white text-blue-600 border-slate-300'
                      }`}
                    >
                      {inc.dispatch_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div
                    className={`text-[11px] truncate leading-tight ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    {inc.location_name || inc.disaster_type || 'Event Area'}
                  </div>

                  <div
                    className={`text-[10px] font-mono flex items-center justify-between pt-1 border-t mt-0.5 ${
                      isDark ? 'border-[#272A36] text-slate-500' : 'border-slate-200 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold text-blue-500">{shortenId(inc.event_id, 6, 4)}</span>
                    <span>{inc.updated_at ? formatTimestamp(inc.updated_at).replace(' IST', '') : 'Just now'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
}
