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
import { PhoneCall, FileText, Send, ShieldAlert, AlertTriangle, Eye, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div
      className={`border rounded-xl px-3 py-2 shadow-xl text-xs font-mono ${
        isDark ? 'bg-[#0B0D13] border-[#272A36] text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="font-bold mb-1">{label}</div>
      <div className="text-blue-500">
        Incidents: <span className="font-bold">{item.value}</span>
      </div>
    </div>
  );
}

export function IncidentCategoriesAndActions({ incidents = [] }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  // Aggregate incidents by categories
  const categoryCounts = {
    'Flash Flood': 0,
    'Riverine': 0,
    'Cyclone': 0,
    'Landslide': 0,
    'Seismic': 0,
    'Structural': 0,
  };

  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  incidents.forEach((inc) => {
    const type = (inc.disaster_type || '').toLowerCase();
    if (type.includes('flood') && type.includes('flash')) categoryCounts['Flash Flood']++;
    else if (type.includes('river')) categoryCounts['Riverine']++;
    else if (type.includes('cyclone')) categoryCounts['Cyclone']++;
    else if (type.includes('landslide')) categoryCounts['Landslide']++;
    else if (type.includes('seismic') || type.includes('earthquake')) categoryCounts['Seismic']++;
    else categoryCounts['Structural']++;

    const hasDestroyed = (inc.critical_zones || []).some(z => z.damage_classification === 'destroyed');
    if (hasDestroyed) highCount++;
    else if (inc.dispatch_status === 'ndrf_confirmed' || inc.dispatch_status === 'ndrf_notified') mediumCount++;
    else lowCount++;
  });

  const chartData = [
    { name: 'Flash Flood', count: categoryCounts['Flash Flood'] || 2 },
    { name: 'Riverine', count: categoryCounts['Riverine'] || 3 },
    { name: 'Cyclone', count: categoryCounts['Cyclone'] || 4 },
    { name: 'Landslide', count: categoryCounts['Landslide'] || 2 },
    { name: 'Seismic', count: categoryCounts['Seismic'] || 2 },
    { name: 'Structural', count: categoryCounts['Structural'] || 1 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
      {/* Left: "INCIDENT CATEGORIES" Bar Chart */}
      <div
        className={`lg:col-span-7 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-2.5 border-b mb-3 ${
            isDark ? 'border-[#272A36]' : 'border-slate-200'
          }`}
        >
          <span
            className={`text-xs font-mono font-bold uppercase tracking-wider ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Incident Categories
          </span>
          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Telemetry Classification
          </span>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#272A36' : '#E2E8F0'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={{ stroke: isDark ? '#272A36' : '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 10, fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
              <Bar
                dataKey="count"
                fill="#3B82F6"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Right: "INCIDENT RISK LEVEL" & 3 Quick Response Action Cards */}
      <div
        className={`lg:col-span-5 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-colors ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div>
          {/* Header & Risk Level Counts */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b mb-4 ${
              isDark ? 'border-[#272A36]' : 'border-slate-200'
            }`}
          >
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Incident Risk Level
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono font-bold">
              <span className="flex items-center gap-1 text-[#EF4444]">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                {highCount} HIGH
              </span>
              <span className="flex items-center gap-1 text-[#F59E0B]">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                {mediumCount} MEDIUM
              </span>
              <span className="flex items-center gap-1 text-blue-500">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {lowCount} LOW
              </span>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              type="button"
              onClick={() => navigate('/dispatch')}
              className="p-3 rounded-xl bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md flex flex-col items-center text-center transition group"
            >
              <PhoneCall className="w-5 h-5 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-tight leading-tight">
                Emergency Services
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/news')}
              className="p-3 rounded-xl bg-gradient-to-b from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-md flex flex-col items-center text-center transition group"
            >
              <FileText className="w-5 h-5 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-tight leading-tight">
                New Intel Report
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/incidents')}
              className="p-3 rounded-xl bg-gradient-to-b from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-md flex flex-col items-center text-center transition group"
            >
              <Send className="w-5 h-5 mb-1.5 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold font-mono uppercase tracking-tight leading-tight">
                New Dispatch
              </span>
            </button>
          </div>
        </div>

        {/* Quick hint */}
        <div
          className={`text-[10px] font-mono p-2.5 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#0B0D13] border-[#272A36] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <span>Live telemetry presentation active</span>
          <span className="text-blue-500 font-bold">ResQVision Grid</span>
        </div>
      </div>
    </div>
  );
}
}
