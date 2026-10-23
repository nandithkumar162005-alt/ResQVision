import useSWR from 'swr';
import { useRef, useEffect, useState } from 'react';
import { getActiveDisasters, isMockMode } from '../api/client';
import { sortIncidents } from '../utils/normalizeData';
import { calculateKpis } from '../utils/aggregations';

const POLL_INTERVAL_MS = 10000; // 10-second agreed cadence

export function useActiveDisasters() {
  const lastSyncRef = useRef(null);
  const [lastSyncDate, setLastSyncDate] = useState(null);

  const {
    data: incidents,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR('active-disasters', async () => {
    const result = await getActiveDisasters();
    const now = new Date();
    lastSyncRef.current = now;
    setLastSyncDate(now);
    return result;
  }, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 4000,
    keepPreviousData: true,
    shouldRetryOnError: true,
    errorRetryInterval: 5000,
  });

  const isMock = isMockMode();

  // Determine global connection status
  let connectionState = 'LIVE';
  if (isMock) {
    connectionState = 'DEMO DATA';
  } else if (error) {
    connectionState = incidents && incidents.length > 0 ? 'STALE' : 'OFFLINE';
  } else if (isLoading && !incidents) {
    connectionState = 'CONNECTING';
  } else {
    connectionState = 'LIVE';
  }

  // Memoized sorting and KPIs
  const safeIncidents = Array.isArray(incidents) ? incidents : [];
  const { sorted: sortedIncidents, hasTimestampSorting } = sortIncidents(safeIncidents);
  const kpis = calculateKpis(safeIncidents);

  return {
    incidents: safeIncidents,
    sortedIncidents,
    hasTimestampSorting,
    kpis,
    isLoading: isLoading && !incidents,
    isValidating,
    error,
    lastSuccessfulSync: lastSyncDate,
    connectionState,
    isMock,
    refetch: mutate,
  };
}
