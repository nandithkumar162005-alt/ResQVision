import React from 'react';

export function LoadingState({ message = 'Synchronizing stream data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center select-none" role="status" aria-label={message}>
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white animate-spin"></div>
      </div>
      <p className="text-xs font-mono font-medium text-slate-400 tracking-wider uppercase">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#12141A] border border-[#272A36] rounded-2xl p-4 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-[#08090C] rounded"></div>
        <div className="h-7 w-7 bg-[#08090C] rounded-xl"></div>
      </div>
      <div className="h-8 w-20 bg-[#1C1F28] rounded mb-2"></div>
      <div className="h-2.5 w-32 bg-[#08090C] rounded"></div>
    </div>
  );
}
