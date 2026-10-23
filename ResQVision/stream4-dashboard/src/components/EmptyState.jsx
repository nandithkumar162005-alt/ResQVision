import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function EmptyState({
  title = 'No active incidents are currently returned by the dispatch service',
  description = 'Stream 3 reports no active disaster records requiring command response at this time. Early warning telemetry remains active.',
  icon: Icon = ShieldCheck,
  action = null,
  isCalmHealthy = true,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-[#12141A] border border-[#272A36] my-4 shadow-sm">
      <div className={`p-4 rounded-2xl mb-4 border ${
        isCalmHealthy 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-[#08090C] text-slate-400 border-[#272A36]'
      }`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-white mb-2 max-w-md">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
