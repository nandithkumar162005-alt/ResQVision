import useSWR from 'swr';
import {
  fetchActiveDisasters,
  fetchDispatchLog,
  fetchGeospatialResources,
  USE_MOCK_DATA
} from '../services/api.js';

export const POLL_INTERVAL_MS = 10_000;
const STALE_THRESHOLD_MS = 120_000;

export function useActiveDisasters() {
  const swr = useSWR('active-disasters', fetchActiveDisasters, {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: !USE_MOCK_DATA,
    shouldRetryOnError: true,
    errorRetryInterval: POLL_INTERVAL_MS
  });

  const hasCachedEvents = Boolean(swr.data?.items?.length);
  const newestUpdateMs = hasCachedEvents
    ? Math.max(
        ...swr.data.items
          .map(item => (item.updated_at ? new Date(item.updated_at).getTime() : 0))
          .filter(Number.isFinite)
      )
    : 0;

  const isStale =
    !USE_MOCK_DATA &&
    Boolean(
      (swr.error && swr.data) ||
        (newestUpdateMs > 0 && Date.now() - newestUpdateMs > STALE_THRESHOLD_MS)
    );

  return {
    ...swr,
    isStale
  };
}

export function useDispatchLog(eventId) {
  return useSWR(eventId ? ['dispatch-log', eventId] : null, ([, id]) => fetchDispatchLog(id), {
    refreshInterval: POLL_INTERVAL_MS,
    revalidateOnFocus: false
  });
}

export function useGeospatialResources() {
  return useSWR('geospatial-resources', fetchGeospatialResources, {
    refreshInterval: USE_MOCK_DATA ? 0 : 30_000,
    revalidateOnFocus: false
  });
}
