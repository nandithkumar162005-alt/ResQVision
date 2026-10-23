import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useActiveDisasters } from '../hooks/useActiveDisasters';

const IncidentContext = createContext(null);

export function IncidentProvider({ children }) {
  const activeDisastersData = useActiveDisasters();
  const { incidents, sortedIncidents } = activeDisastersData;

  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  // Set default selected incident to first sorted incident after load/sort,
  // or preserve if still existing in list
  useEffect(() => {
    if (sortedIncidents.length === 0) {
      setSelectedIncidentId(null);
      setSelectedZoneId(null);
      return;
    }

    if (!selectedIncidentId || !sortedIncidents.some((i) => i.event_id === selectedIncidentId)) {
      setSelectedIncidentId(sortedIncidents[0].event_id);
      setSelectedZoneId(null);
    }
  }, [sortedIncidents, selectedIncidentId]);

  const selectedIncident = useMemo(() => {
    return incidents.find((i) => i.event_id === selectedIncidentId) || null;
  }, [incidents, selectedIncidentId]);

  const value = useMemo(
    () => ({
      ...activeDisastersData,
      selectedIncidentId,
      setSelectedIncidentId,
      selectedZoneId,
      setSelectedZoneId,
      selectedIncident,
    }),
    [activeDisastersData, selectedIncidentId, selectedZoneId, selectedIncident]
  );

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>;
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}
