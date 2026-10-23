import React, { useState, useCallback } from 'react';
import { useActiveDisasters } from '../hooks/useActiveDisasters';
import { TopNav } from '../components/TopNav';
import { AlertBanner } from '../components/AlertBanner';
import { ErrorBanner } from '../components/ErrorBanner';
import { MetricCards } from '../components/MetricCards';
import { DisasterMap } from '../components/DisasterMap';
import { IncidentList } from '../components/IncidentList';
import { IncidentDetailCard } from '../components/IncidentDetailCard';
import { DispatchTimeline } from '../components/DispatchTimeline';
import { DamageOverviewChart } from '../components/DamageOverviewChart';
import { PopulationChart } from '../components/PopulationChart';
import { DamageByIncidentChart } from '../components/DamageByIncidentChart';
import { NewsTicker } from '../components/NewsTicker';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

export function DashboardPage() {
  const {
    incidents,
    sortedIncidents,
    kpis,
    isLoading,
    isValidating,
    error,
    lastSuccessfulSync,
    connectionState,
    isMock,
    refetch,
  } = useActiveDisasters();

  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  const selectedIncident = incidents.find((i) => i.event_id === selectedIncidentId) || null;

  const handleSelectIncident = useCallback((eventId) => {
    setSelectedIncidentId((prev) => (prev === eventId ? null : eventId));
    setSelectedZoneId(null);
  }, []);

  const handleSelectZone = useCallback((zoneId) => {
    setSelectedZoneId(zoneId);
  }, []);

  const handleViewDetails = useCallback((eventId) => {
    setSelectedIncidentId(eventId);
    setSelectedZoneId(null);
    // Scroll to detail section
    setTimeout(() => {
      const el = document.getElementById('incident-detail-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedIncidentId(null);
    setSelectedZoneId(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1d]">
      <TopNav
        connectionState={connectionState}
        lastSuccessfulSync={lastSuccessfulSync}
        isValidating={isValidating}
        onRefresh={refetch}
        isMock={isMock}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">
        {/* Error banner (non-blocking) */}
        <ErrorBanner error={error} onRetry={refetch} isRetrying={isValidating} />

        {/* Alert banner */}
        <AlertBanner incidents={incidents} error={error} />

        {/* Loading state (initial load only) */}
        {isLoading ? (
          <LoadingState message="Establishing telemetry link with dispatch service..." />
        ) : incidents.length === 0 && !error ? (
          <EmptyState isCalmHealthy />
        ) : (
          <>
            {/* KPI Metric Cards */}
            <MetricCards
              kpis={kpis}
              lastSuccessfulSync={lastSuccessfulSync}
              isLoading={false}
            />

            {/* Map + Incident List Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Map takes 2/3 */}
              <div className="lg:col-span-2">
                <DisasterMap
                  incidents={incidents}
                  selectedIncidentId={selectedIncidentId}
                  selectedZoneId={selectedZoneId}
                  onSelectIncident={handleSelectIncident}
                  onSelectZone={handleSelectZone}
                  onViewDetails={handleViewDetails}
                  height="480px"
                />
              </div>

              {/* Incident List takes 1/3 */}
              <div className="lg:col-span-1 max-h-[520px] overflow-y-auto pr-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider">
                    Active Incidents
                  </h2>
                  <span className="text-xs text-slate-500 font-mono">
                    {sortedIncidents.length} record{sortedIncidents.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <IncidentList
                  incidents={sortedIncidents}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncident={handleSelectIncident}
                />
              </div>
            </div>

            {/* Selected Incident Detail + Dispatch Timeline */}
            {selectedIncident && (
              <div id="incident-detail-section" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <IncidentDetailCard
                  incident={selectedIncident}
                  onBack={handleBackToList}
                />
                <DispatchTimeline eventId={selectedIncident.event_id} />
              </div>
            )}

            {/* Analytics Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <DamageOverviewChart incidents={incidents} />
              <PopulationChart incidents={incidents} />
              <DamageByIncidentChart incidents={incidents} />
            </div>

            {/* News Ticker */}
            <div className="mb-6">
              <NewsTicker />
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="border-t border-[#1e293b] pt-4 pb-6 mt-4 text-center">
          <p className="text-[11px] text-slate-600 font-mono">
            ResQVision Stream 4 — AI Disaster Intelligence Command Interface • v1.0.0
          </p>
          <p className="text-[10px] text-slate-700 mt-1">
            Data sourced from Stream 3 dispatch service.{' '}
            {isMock && 'Currently showing synthetic demo fixtures — not connected to live backend.'}
          </p>
        </footer>
      </main>
    </div>
  );
}
