import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { aggregatePopulationByIncident } from '../utils/aggregations';
import { formatNumber } from '../utils/formatters';
import { HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  return (
    <div
      className={`rounded-xl px-3 py-2 shadow-xl text-xs font-mono max-w-xs border ${
        isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className={`font-semibold mb-1 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{label}</div>
      <div className={`space-y-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <div>Est. Population: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(item?.population)}</span></div>
        <div>Damage Score: <span className={isDark ? 'text-white' : 'text-slate-900'}>{item?.damageScore !== null && item?.damageScore !== undefined ? `${item.damageScore}/100` : '—'}</span></div>
        <div>Workflow Status: <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{item?.status || '—'}</span></div>
      </div>
    </div>
  );
}

export function PopulationChart({ incidents = [] }) {
  const { isDark } = useTheme();
  const data = aggregatePopulationByIncident(incidents);
  const hasAnyPopulation = data.some((d) => d.population > 0);

  const cardClasses = isDark
    ? 'bg-[#12141A] border-[#272A36]'
    : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderSubtle = isDark ? 'border-[#272A36]' : 'border-slate-200';
  const gridStroke = isDark ? '#272A36' : '#E2E8F0';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';
  const barFill = isDark ? '#FFFFFF' : '#0F172A';

  if (data.length === 0 || !hasAnyPopulation) {
    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold mb-3 flex items-center gap-2 ${textTitle}`}>
          Population Impact by Incident
          <span className="text-slate-500 cursor-help" title="affected_population_estimate per event. Estimates from separate incidents may overlap.">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <div className={`flex items-center justify-center h-48 text-xs font-mono ${textMuted}`}>
          No population estimates available
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
      <div className={`flex items-center justify-between mb-2 pb-2 border-b ${borderSubtle}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 ${textTitle}`}>
          Population Impact by Incident
          <span className="text-slate-500 cursor-help" title="affected_population_estimate per event. Estimates from separate incidents may overlap.">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <span className={`text-[11px] font-mono ${textMuted}`}>Model Estimates (May Overlap)</span>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={axisStroke}
              fontSize={10}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke={axisStroke}
              fontSize={10}
              tickLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Bar dataKey="population" fill={barFill} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
