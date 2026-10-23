import React from 'react';
import { DAMAGE_SEVERITY } from '../utils/severityColors';
import { useTheme } from '../context/ThemeContext';

export function MapLegend({ compact = false }) {
  const { isDark } = useTheme();

  const items = [
    DAMAGE_SEVERITY.destroyed,
    DAMAGE_SEVERITY.major_damage,
    DAMAGE_SEVERITY.unknown,
  ];

  return (
    <div
      className={`backdrop-blur-md border rounded-xl p-2.5 sm:p-3 shadow-xl select-none text-xs transition-colors duration-200 ${
        isDark
          ? 'bg-[#12141A]/95 border-[#2B2E3A] text-white'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-md'
      }`}
    >
      <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 font-semibold ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Zone Classification Legend
      </div>
      <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-1.5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: item.colorHex }}
            />
            <span className={`font-medium text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
