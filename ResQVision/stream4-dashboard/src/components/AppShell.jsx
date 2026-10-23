import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useIncidents } from '../context/IncidentContext';
import { useTheme } from '../context/ThemeContext';

export function AppShell({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { connectionState, lastSuccessfulSync, isValidating, refetch, isMock } = useIncidents();
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-200 ${
        isDark ? 'bg-[#08090C] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={title}
          subtitle={subtitle}
          connectionState={connectionState}
          lastSuccessfulSync={lastSuccessfulSync}
          isValidating={isValidating}
          onRefresh={refetch}
          isMock={isMock}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        <footer
          className={`py-3 px-6 border-t text-center text-[11px] font-mono transition-colors duration-200 ${
            isDark
              ? 'border-[#272A36] text-slate-500 bg-[#0E1015]/60'
              : 'border-slate-200 text-slate-500 bg-white/70'
          }`}
        >
          ResQVision Project • National Emergency Response Telemetry Grid • Asia/Kolkata (IST)
        </footer>
      </div>
    </div>
  );
}
