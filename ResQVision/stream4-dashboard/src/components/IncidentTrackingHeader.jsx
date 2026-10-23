import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { formatRelativeSyncAge } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function IncidentTrackingHeader({
  incidents = [],
  lastSuccessfulSync = null,
  isValidating = false,
  onRefresh = null,
  isMock = false,
}) {
  const { isDark } = useTheme();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setCurrentDateTime(new Intl.DateTimeFormat('en-IN', options).format(now).toUpperCase() + ' IST');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute overall risk level based on destroyed zones
  const hasDestroyed = incidents.some((inc) =>
    (inc.critical_zones || []).some((z) => z.damage_classification === 'destroyed')
  );
  const overallRisk = incidents.length === 0 ? 'NORMAL' : hasDestroyed ? 'CRITICAL (LEVEL 3)' : 'MODERATE (LEVEL 2)';

  const riskBadge =
    hasDestroyed
      ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/40'
      : incidents.length > 0
      ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/40'
      : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/40';

  const riskDot =
    hasDestroyed ? 'bg-[#EF4444]' : incidents.length > 0 ? 'bg-[#F59E0B]' : 'bg-[#10B981]';

  return (
    <div
      className={`border rounded-2xl p-3.5 sm:p-4 mb-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono select-none transition-colors duration-200 ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-slate-200/50'
      }`}
    >
      {/* Left: Branding & Clock */}
      <div className={`flex flex-wrap items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-blue-600'}`} />
          <span className="font-extrabold tracking-wider text-sm uppercase">
            NATIONAL INCIDENT COMMAND CENTER
          </span>
        </div>

        <span className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>|</span>

        <span className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
          {currentDateTime}
        </span>

        <span className={`hidden sm:inline ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>|</span>

        <div className="flex items-center gap-1.5">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>NATIONAL THREAT LEVEL:</span>
          <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] border flex items-center gap-1.5 ${riskBadge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${riskDot}`} />
            {overallRisk}
          </span>
        </div>
      </div>

      {/* Right: Telemetry sync state */}
      <div className={`flex items-center gap-3 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>SYNC:</span>
          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatRelativeSyncAge(lastSuccessfulSync)}</span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isValidating}
            className={`p-1.5 rounded-lg border transition disabled:opacity-50 ${
              isDark
                ? 'bg-[#08090C] hover:bg-[#1A1D24] text-slate-300 hover:text-white border-[#272A36]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-black border-slate-300'
            }`}
            title="Refresh active incidents data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
}
