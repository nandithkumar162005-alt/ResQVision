import React from 'react';
import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function AlertBanner({ incidents = [], error = null }) {
  const { isDark } = useTheme();

  if (error) {
    return null;
  }

  const activeCount = incidents.length;

  if (activeCount === 0) {
    return (
      <div
        className={`flex items-center gap-3 p-3.5 mb-6 rounded-2xl border text-xs transition-colors ${
          isDark
            ? 'bg-[#12141A] border-[#272A36] text-slate-400'
            : 'bg-white border-slate-200 text-slate-600 shadow-sm'
        }`}
      >
        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span>Operations normal. No active disaster records currently dispatched or awaiting deployment.</span>
      </div>
    );
  }

  // Count destroyed zones to determine if urgent/critical treatment is supported by data
  const hasDestroyedZones = incidents.some((inc) =>
    (inc.critical_zones || []).some((z) => z.damage_classification === 'destroyed')
  );

  if (hasDestroyedZones) {
    return (
      <div
        className={`flex items-start sm:items-center justify-between gap-3 p-3.5 mb-6 rounded-2xl border text-xs shadow-sm transition-colors ${
          isDark
            ? 'bg-red-950/30 border-red-500/40 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <div>
            <span className="font-semibold font-mono tracking-wide uppercase mr-2 text-red-500">
              Critical Damage Reported:
            </span>
            <span className={isDark ? 'text-white' : 'text-slate-900 font-medium'}>
              {activeCount} incident {activeCount === 1 ? 'record' : 'records'} actively tracked with confirmed structural destruction zones.
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-500 border border-red-500/30 uppercase font-semibold">
          Priority 1
        </span>
      </div>
    );
  }

  // Calm active tracking banner
  return (
    <div
      className={`flex items-start sm:items-center justify-between gap-3 p-3.5 mb-6 rounded-2xl border text-xs shadow-sm transition-colors ${
        isDark
          ? 'bg-[#12141A] border-white/20'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <div>
          <span className={`font-semibold font-mono tracking-wide uppercase mr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Operations Active:
          </span>
          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
            {activeCount} active disaster {activeCount === 1 ? 'record is' : 'records are'} being tracked across operational sectors.
          </span>
        </div>
      </div>
      <span
        className={`hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold border ${
          isDark
            ? 'bg-white/10 text-white border-white/20'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}
      >
        Verified Feeds
      </span>
    </div>
  );
}
