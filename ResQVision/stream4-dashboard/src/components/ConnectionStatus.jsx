import React from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { formatRelativeSyncAge } from '../utils/formatters';

export function ConnectionStatus({
  connectionState = 'LIVE',
  lastSuccessfulSync = null,
  isValidating = false,
  onRefresh = null,
  isMock = false,
}) {
  const isHealthy = connectionState === 'LIVE' || connectionState === 'DEMO DATA';

  const config = isHealthy
    ? {
        icon: Wifi,
        label: 'TELEMETRY ONLINE',
        textClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
      }
    : connectionState === 'STALE'
    ? {
        icon: AlertCircle,
        label: 'TELEMETRY DELAYED',
        textClass: 'text-amber-400',
        bgClass: 'bg-amber-500/10 border-amber-500/30',
        dotClass: 'bg-amber-400',
      }
    : {
        icon: WifiOff,
        label: 'SYSTEM OFFLINE',
        textClass: 'text-[#EF4444]',
        bgClass: 'bg-[#EF4444]/10 border-[#EF4444]/30',
        dotClass: 'bg-[#EF4444]',
      };

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2 sm:gap-3 text-xs">
      {/* State Badge */}
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border ${config.bgClass} ${config.textClass} font-mono font-medium tracking-wide shadow-sm`}
        title={`Connection state: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass} animate-pulse`} />
        <Icon className="w-3.5 h-3.5" />
        <span className="font-semibold">{config.label}</span>
      </div>

      {/* Sync age */}
      <span className="text-slate-400 text-xs hidden md:inline-flex items-center gap-1.5 font-mono">
        <span>Updated:</span>
        <span className="text-white font-medium">
          {formatRelativeSyncAge(lastSuccessfulSync)}
        </span>
      </span>

      {/* Revalidate button */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isValidating}
          className="p-1.5 rounded-xl bg-[#08090C] hover:bg-[#1A1D24] text-slate-400 hover:text-white border border-[#272A36] transition disabled:opacity-50"
          title="Force telemetry refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-white' : ''}`} />
        </button>
      )}
    </div>
  );
}
