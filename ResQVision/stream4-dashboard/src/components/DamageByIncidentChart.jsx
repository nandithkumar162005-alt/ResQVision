import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { aggregateDamageByIncident } from '../utils/aggregations';
import { DAMAGE_SEVERITY } from '../utils/severityColors';
import { HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  return (
    <div
      className={`rounded-xl px-3 py-2.5 shadow-xl text-xs font-mono max-w-xs border ${
        isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className={`font-semibold mb-1.5 truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{label}</div>
      <div className={`space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <div>Total Zones: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item?.totalZones}</span></div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DAMAGE_SEVERITY.destroyed.colorHex }} />
          Destroyed: <span className="text-red-500 font-semibold">{item?.destroyed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DAMAGE_SEVERITY.major_damage.colorHex }} />
          Major Damage: <span className="text-amber-500 font-semibold">{item?.majorDamage}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DAMAGE_SEVERITY.unknown.colorHex }} />
          Unknown: <span className="text-slate-400 font-semibold">{item?.unknown}</span>
        </div>
        <div className={`mt-1 pt-1 border-t ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`}>
          Damage Score: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item?.damageScore !== null && item?.damageScore !== undefined ? `${item.damageScore}/100` : '—'}</span>
        </div>
      </div>
    </div>
  );
}

export function DamageByIncidentChart({ incidents = [] }) {
  const { isDark } = useTheme();
  const data = aggregateDamageByIncident(incidents);

  const cardClasses = isDark
    ? 'bg-[#12141A] border-[#272A36]'
    : 'bg-white border-slate-200 shadow-sm';
  const textTitle = isDark ? 'text-white' : 'text-slate-900';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderSubtle = isDark ? 'border-[#272A36]' : 'border-slate-200';
  const gridStroke = isDark ? '#272A36' : '#E2E8F0';
  const axisStroke = isDark ? '#64748B' : '#94A3B8';

  if (data.length === 0) {
    return (
      <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold mb-3 flex items-center gap-2 ${textTitle}`}>
          Critical Zones by Incident
          <span className="text-slate-500 cursor-help" title="Stacked breakdown of zone damage_classification per incident">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <div className={`flex items-center justify-center h-48 text-xs font-mono ${textMuted}`}>
          No zone data to chart
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 shadow-sm ${cardClasses}`}>
      <div className={`flex items-center justify-between mb-2 pb-2 border-b ${borderSubtle}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider font-semibold flex items-center gap-2 ${textTitle}`}>
          Critical Zones by Incident
          <span className="text-slate-500 cursor-help" title="Stacked breakdown of zone damage_classification per incident">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </h3>
        <span className={`text-[11px] font-mono ${textMuted}`}>Stacked Classification</span>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
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
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Legend
              formatter={(value) => (
                <span className={`text-xs font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>
              )}
            />
            <Bar
              dataKey="destroyed"
              name="Destroyed"
              stackId="a"
              fill={DAMAGE_SEVERITY.destroyed.colorHex}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="majorDamage"
              name="Major Damage"
              stackId="a"
              fill={DAMAGE_SEVERITY.major_damage.colorHex}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="unknown"
              name="Unknown"
              stackId="a"
              fill={DAMAGE_SEVERITY.unknown.colorHex}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
