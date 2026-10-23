import React from 'react';
import { AppShell } from '../components/AppShell';
import { CriticalNewsPanel } from '../components/CriticalNewsPanel';
import { AllNewsPanel } from '../components/AllNewsPanel';
import { Radio } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function NewsPage() {
  const { isDark } = useTheme();

  return (
    <AppShell
      title="National Early Warning & Situational Bulletins"
      subtitle="Authoritative meteorological advisories, ISRO Bhuvan satellite damage maps, and relief logistics"
    >
      {/* Top Banner */}
      <div
        className={`flex items-start gap-3 p-4 mb-6 rounded-2xl border text-xs shadow-md transition-colors duration-200 ${
          isDark ? 'bg-[#12141A] border-[#272A36]' : 'bg-white border-slate-200'
        }`}
      >
        <Radio className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-white' : 'text-blue-600'}`} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-bold font-mono uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              National Disaster Warning Broadcast Grid
            </span>
          </div>
          <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Consolidated intelligence feeds from the India Meteorological Department (IMD), National Remote Sensing Centre (NRSC / ISRO), Central Water Commission (CWC), and National Disaster Management Authority (NDMA) operations control rooms.
          </p>
        </div>
      </div>

      {/* The Two Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="flex flex-col h-[700px]">
          <CriticalNewsPanel />
        </div>
        <div className="flex flex-col h-[700px]">
          <AllNewsPanel />
        </div>
      </div>
    </AppShell>
  );
}
