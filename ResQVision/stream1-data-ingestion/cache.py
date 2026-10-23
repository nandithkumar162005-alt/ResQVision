from cachetools import TTLCache
import structlog

logger = structlog.get_logger()

# 6-Hour rolling window: 6 hours * 3600 seconds = 21,600 seconds
DEDUP_CACHE = TTLCache(maxsize=10000, ttl=21600)

def is_duplicate_event(source: str, source_event_id: str) -> bool:
    """
    Checks if an event from the source has been seen within the last 6 hours.
    Returns True if duplicate, False if fresh.
    """
    dedup_key = f"{source}:{source_event_id}"
    if dedup_key in DEDUP_CACHE:
        logger.info("duplicate_event_dropped", key=dedup_key)
        return True
    
    DEDUP_CACHE[dedup_key] = True
    return False


def evict_event(source: str, source_event_id: str) -> bool:
    """
    Evicts an event from the deduplication cache (e.g. when dispatch fails),
    allowing it to be re-processed on subsequent polling cycles.
    Returns True if evicted, False if not found.
    """
    dedup_key = f"{source}:{source_event_id}"
    if dedup_key in DEDUP_CACHE:
        del DEDUP_CACHE[dedup_key]
        logger.info("event_evicted_from_cache", key=dedup_key)
        return True
    return False

