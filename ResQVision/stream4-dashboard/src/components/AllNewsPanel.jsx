import React from 'react';
import { Newspaper } from 'lucide-react';
import { SAMPLE_ALL_NEWS } from '../api/sampleNews';
import { formatTimestamp } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function AllNewsPanel() {
  const { isDark } = useTheme();

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-xl transition-colors duration-200 ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between gap-2 pb-3 border-b mb-3 ${
        isDark ? 'border-[#272A36]' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${
            isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-blue-600 border-slate-300'
          }`}>
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              National Situational Intelligence Wire
            </h3>
            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Inter-agency hydrometeorological & relief operations
            </span>
          </div>
        </div>
        <span
          className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border uppercase flex-shrink-0 ${
            isDark ? 'bg-white/10 text-white border-white/20' : 'bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          OFFICIAL FEEDS
        </span>
      </div>

      {/* Items */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {SAMPLE_ALL_NEWS.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border transition flex flex-col sm:flex-row gap-3 ${
              item.isCritical
                ? isDark ? 'bg-[#08090C] border-red-500/25' : 'bg-red-50/50 border-red-200'
                : isDark ? 'bg-[#08090C] border-[#272A36] hover:border-slate-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            {item.image_url && (
              <div className={`sm:w-28 h-20 rounded-lg overflow-hidden flex-shrink-0 border ${
                isDark ? 'border-[#272A36]' : 'border-slate-200'
              }`}>
                <img
                  src={item.image_url}
                  alt={item.headline}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                      item.isCritical ? 'text-[#EF4444]' : isDark ? 'text-white' : 'text-blue-600'
                    }`}
                  >
                    {item.tag}
                  </span>
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {formatTimestamp(item.timestamp).replace(' IST', '')}
                  </span>
                </div>
                <h4 className={`text-xs font-bold leading-snug mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {item.headline}
                </h4>
                <p className={`text-[11px] leading-relaxed mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.summary}
                </p>
              </div>
              <div className={`text-[10px] font-mono pt-1.5 border-t ${
                isDark ? 'border-[#272A36] text-slate-500' : 'border-slate-200 text-slate-400'
              }`}>
                Source: <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
