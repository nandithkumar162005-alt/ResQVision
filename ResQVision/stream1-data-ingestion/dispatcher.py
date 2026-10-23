"""
ResQVision Stream 1 — Event Dispatcher
Forwards canonical DisasterEvent objects to Stream 2 via HTTP webhook,
with retry logic and structured logging.
"""

from __future__ import annotations

import uuid
from datetime import timezone
from typing import List

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

from schemas import DisasterEvent
from config import settings

log = structlog.get_logger(__name__)


def _is_retryable_error(exc: BaseException) -> bool:
    """Only retry on network errors, 5xx server errors, or 429 rate limits."""
    if isinstance(exc, httpx.TransportError):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500 or exc.response.status_code == 429
    return False


def build_stream2_payload(event: DisasterEvent) -> dict:
    """
    Convert Stream 1's internal DisasterEvent into the exact contract Stream 2
    expects (5 keys, nothing else). Internal fields (source, metadata,
    corroborated_by_news...) stay inside Stream 1 and are never sent.
    """
    if event.event_type == "earthquake":
        disaster_type = "earthquake"
    elif event.event_type in ("rainfall", "flood"):
        disaster_type = "flood"
    else:
        raise ValueError(f"Unsupported event_type for Stream 2: {event.event_type!r}")

    ts = event.timestamp_utc
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    return {
        # uuid5 is deterministic: the same internal id always maps to the same UUID
        "event_id": str(uuid.uuid5(uuid.NAMESPACE_URL, event.event_id)),
        "disaster_type": disaster_type,
        "coordinates": {"lat": float(event.latitude), "lng": float(event.longitude)},
        "severity_metric": float(event.severity),
        "timestamp_utc": ts.astimezone(timezone.utc).isoformat(),
    }


class Dispatcher:
    """POST canonical DisasterEvent payloads to the Stream 2 webhook."""

    def __init__(
        self,
        client: httpx.AsyncClient | None = None,
        webhook_url: str | None = None,
    ):
        self._client = client
        self._webhook_url = webhook_url or settings.STREAM_2_WEBHOOK_URL

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30)
        return self._client

    async def close(self) -> None:
        """Close the underlying HTTP client session."""
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception(_is_retryable_error),
        reraise=True,
    )
    async def _send_one(self, event: DisasterEvent) -> bool:
        """POST a single event. Returns True on success."""
        client = await self._get_client()
        payload = build_stream2_payload(event)

        log.info(
            "dispatch_sending",
            event_id=event.event_id,
            sent_uuid=payload["event_id"],
            event_type=event.event_type,
            severity=event.severity,
            webhook=self._webhook_url,
        )

        resp = await client.post(self._webhook_url, json=payload)
        if resp.status_code == 409:
            # Stream 2 already has this event (idempotency) - that is success, not failure.
            log.info("dispatch_already_received", event_id=event.event_id, sent_uuid=payload["event_id"])
            return True
        resp.raise_for_status()

        log.info("dispatch_success", event_id=event.event_id, status=resp.status_code)
        return True

    async def dispatch(self, events: List[DisasterEvent]) -> dict:
        """
        Send a batch of events. Returns a summary dict with
        counts of successes and failures.
        """
        results = {"sent": 0, "failed": 0, "errors": []}

        for event in events:
            try:
                await self._send_one(event)
                results["sent"] += 1
            except Exception as exc:
                results["failed"] += 1
                results["errors"].append(
                    {"event_id": event.event_id, "error": str(exc)}
                )
                log.error(
                    "dispatch_failed",
                    event_id=event.event_id,
                    error=str(exc),
                )

        log.info("dispatch_batch_done", **{k: v for k, v in results.items() if k != "errors"})
        return results
