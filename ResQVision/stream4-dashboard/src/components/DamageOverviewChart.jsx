import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { aggregateDamageOverview } from '../utils/aggregations';
import { HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload, isDark }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      className={`rounded-xl px-3 py-2 shadow-xl text-xs font-mono border ${
        isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.name}</span>
      </div>
      <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
        {item.value} critical zone{item.value !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export function DamageOverviewChart({ incidents = [] }) {
  const { isDark } = useTheme();
  const { totalZones, chartData } = aggregateDamageOverview(incidents);

  const cardClasses = isDark
    ? 'bg-[#12141A] border-[#272A36]'
    : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderSubtle = isDark ? 'border-[#272A36]' : 'border-slate-200';

  if (totalZones === 0) {
    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold mb-3 flex items-center gap-2 ${textTitle}`}>
          Damage Classification Overview
          <span className="text-slate-500 cursor-help" title="Distribution of damage_classification across all critical_zones">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <div className={`flex items-center justify-center h-48 text-xs font-mono ${textMuted}`}>
          No critical zones to visualize
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
      <div className={`flex items-center justify-between mb-2 pb-2 border-b ${borderSubtle}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 ${textTitle}`}>
          Damage Classification Overview
          <span className="text-slate-500 cursor-help" title="Distribution of damage_classification across all critical_zones">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <span className={`text-xs font-mono ${textMuted}`}>{totalZones} zones total</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={isDark ? '#08090C' : '#FFFFFF'}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend
              formatter={(value) => (
                <span className={`text-xs font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
