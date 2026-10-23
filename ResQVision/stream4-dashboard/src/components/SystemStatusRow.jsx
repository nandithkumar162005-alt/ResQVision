import React from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { formatRelativeSyncAge } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

export function SystemStatusRow({ connectionState, lastSuccessfulSync, isMock }) {
  const { isDark } = useTheme();

  const stages = [
    {
      id: 'stream1',
      title: 'Stream 1',
      name: 'Data Ingestion & Early Warning',
      status: 'Active Feed',
      stateClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      dotColor: 'bg-emerald-500',
      note: 'Ingesting IMD radar, CWC hydrology, and seismic streams',
    },
    {
      id: 'stream2',
      title: 'Stream 2',
      name: 'AI & Satellite Damage Assessment',
      status: 'Model Active',
      stateClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
      dotColor: 'bg-blue-500',
      note: 'Automated damage scoring & satellite hazard footprint classification',
    },
    {
      id: 'stream3',
      title: 'Stream 3',
      name: 'Dispatch Backend & Persistence',
      status: connectionState === 'OFFLINE' ? 'Offline' : 'Connected',
      stateClass: connectionState === 'OFFLINE'
        ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
        : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
      dotColor: connectionState === 'OFFLINE' ? 'bg-rose-500' : 'bg-emerald-500',
      note: `Heartbeat verified • Sync ${formatRelativeSyncAge(lastSuccessfulSync)}`,
    },
    {
      id: 'stream4',
      title: 'Stream 4',
      name: 'National Command Interface',
      status: 'Operational',
      stateClass: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
      dotColor: 'bg-cyan-500',
      note: 'Full-width geospatial visualization and response tracking active',
    },
  ];

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-5 shadow-xl transition-colors ${
        isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-2.5 border-b ${
          isDark ? 'border-[#272A36]' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-500" />
          <h3
            className={`text-xs font-mono uppercase tracking-wider font-bold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            ResQVision National Disaster Intelligence Architecture
          </h3>
        </div>
        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Four-stream end-to-end operational pipeline
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`p-3.5 rounded-xl border flex flex-col justify-between ${
              isDark ? 'bg-[#0B0D13] border-[#272A36]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-blue-500 uppercase">
                  {stage.title}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${stage.stateClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                  {stage.status}
                </span>
              </div>
              <div
                className={`text-xs font-bold mb-1 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {stage.name}
              </div>
            </div>
            <div
              className={`text-[10px] font-mono mt-2 pt-2 border-t truncate ${
                isDark ? 'border-[#272A36] text-slate-400' : 'border-slate-200 text-slate-600'
              }`}
              title={stage.note}
            >
              {stage.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
