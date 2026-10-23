import useSWR from 'swr';
import { useRef, useState } from 'react';
import { getDispatchLog } from '../api/client';

const DISPATCH_POLL_INTERVAL_MS = 10000;

export function useDispatchLog(eventId) {
  const lastSyncRef = useRef(null);
  const [lastSyncDate, setLastSyncDate] = useState(null);

  const {
    data: logs,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    eventId ? ['dispatch-log', eventId] : null,
    async ([, id]) => {
      const result = await getDispatchLog(id);
      const now = new Date();
      lastSyncRef.current = now;
      setLastSyncDate(now);
      return result;
    },
    {
      refreshInterval: DISPATCH_POLL_INTERVAL_MS,
      revalidateOnFocus: true,
      dedupingInterval: 4000,
      keepPreviousData: false, // Prevents showing previous event's log when switching events
      shouldRetryOnError: true,
      errorRetryInterval: 5000,
    }
  );

  const safeLogs = Array.isArray(logs) ? logs : [];

  return {
    logs: safeLogs,
    isLoading: isLoading && !logs,
    isValidating,
    error,
    lastSuccessfulSync: lastSyncDate,
    refetch: mutate,
  };
}
