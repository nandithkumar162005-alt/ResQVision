import React, { useState } from 'react';
import { Newspaper, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Radio } from 'lucide-react';
import { SAMPLE_ALL_NEWS, SAMPLE_CRITICAL_NEWS, DEMO_NEWS_WATERMARK } from '../api/sampleNews';
import { formatTimestamp } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function NewsTicker({ compact = false }) {
  const { isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayNews = showAll ? SAMPLE_ALL_NEWS : SAMPLE_CRITICAL_NEWS;

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#111827] border-[#1e293b]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 transition text-left ${
          isDark ? 'hover:bg-[#131e33]' : 'hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              National Emergency Early Warning Bulletin
            </span>
            <span className="ml-2 text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 border border-red-500/30 uppercase font-bold">
              LIVE BROADCAST
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-[11px] font-mono hidden sm:inline">{DEMO_NEWS_WATERMARK}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-slate-800/60' : 'border-slate-200'}`}>
          {/* Filter toggle */}
          <div className="flex items-center gap-2 my-3">
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                !showAll
                  ? 'bg-red-500/15 text-red-400 border-red-500/30 font-semibold'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-300'
              }`}
            >
              Critical Only ({SAMPLE_CRITICAL_NEWS.length})
            </button>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                showAll
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-semibold'
                  : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-300'
              }`}
            >
              All ({SAMPLE_ALL_NEWS.length})
            </button>
          </div>

          {/* News items */}
          <div className="space-y-2">
            {displayNews.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border ${
                  item.isCritical
                    ? isDark
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-red-50 border-red-200'
                    : isDark
                    ? 'bg-[#0a0f1d] border-slate-800/60'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {item.isCritical && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                      {item.tag}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                    {formatTimestamp(item.timestamp).replace(' IST', '')}
                  </span>
                </div>
                <h4 className={`text-xs font-semibold leading-snug mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {item.headline}
                </h4>
                <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {item.summary}
                </p>
                <div className="text-[10px] text-slate-500 font-mono mt-1.5">{item.source}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
