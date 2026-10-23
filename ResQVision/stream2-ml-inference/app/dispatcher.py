"""
app/dispatcher.py — Dispatch completed DamageAssessment payloads to Stream 3.

Handles sending the completed DamageAssessment to Stream 3 with exponential
backoff retry logic. Distinguishes between non-retriable client errors (HTTP 4xx)
and retriable server/network errors (HTTP 5xx, timeouts, connection errors).
On permanent failure, logs the full payload at CRITICAL level for manual replay.
"""

from __future__ import annotations

import httpx
from loguru import logger
from tenacity import (
    AsyncRetrying,
    RetryCallState,
    RetryError,
    before_sleep_log,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.schemas import DamageAssessment


class DispatchError(Exception):
    """Custom exception raised on permanent dispatch failures to Stream 3."""


def _before_sleep_callback(retry_state: RetryCallState) -> None:
    """
    Log a warning before sleeping between tenacity retry attempts.

    Includes the current attempt number and the underlying exception that
    triggered the retry.
    """
    attempt_num = retry_state.attempt_number
    exc = retry_state.outcome.exception() if retry_state.outcome else None
    sleep_seconds = retry_state.next_action.sleep if retry_state.next_action else 0.0
    logger.warning(
        f"Retrying dispatch to Stream 3 (attempt {attempt_num}/{settings.max_retry_attempts}) "
        f"in {sleep_seconds:.1f}s after error: {exc}"
    )


async def dispatch_assessment(assessment: DamageAssessment) -> None:
    """
    Serialize and dispatch a DamageAssessment to Stream 3 with retries.

    Serializes the assessment using to_stream3_dict(), logs the full payload
    at DEBUG level, and sends an HTTP POST request to the configured Stream 3
    endpoint.

    Retry behavior:
      - Uses tenacity AsyncRetrying context manager for async compatibility.
      - Retries up to settings.max_retry_attempts with exponential backoff.
      - Retries on httpx.HTTPError and httpx.TimeoutException (including 5xx).
      - Immediately logs an ERROR and raises DispatchError on HTTP 4xx (no retries).
      - Logs at INFO on successful delivery (HTTP 2xx).
      - On permanent exhaustion of retries, logs at CRITICAL with the full
        unserialized payload (for manual replay) and raises DispatchError.

    Args:
        assessment: The validated DamageAssessment model to transmit.

    Raises:
        DispatchError: When dispatch permanently fails due to a client error (4xx)
                       or exhausted retries on server/network failure.
    """
    payload = assessment.to_stream3_dict()
    event_id_str = str(assessment.event_id)

    # Log full payload at DEBUG level before sending
    logger.debug(
        f"Dispatching DamageAssessment for event {event_id_str} "
        f"to {settings.stream3_assessment_url}: {payload}"
    )

    try:
        async with httpx.AsyncClient(timeout=settings.stream3_timeout_seconds) as client:
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(settings.max_retry_attempts),
                wait=wait_exponential(
                    multiplier=settings.retry_wait_seconds,
                    min=1.0,
                    max=30.0,
                ),
                retry=retry_if_exception_type((httpx.HTTPError, httpx.TimeoutException)),
                before_sleep=_before_sleep_callback,
                reraise=True,
            ):
                with attempt:
                    logger.debug(
                        f"Attempting dispatch for event {event_id_str} "
                        f"(attempt {attempt.retry_state.attempt_number}/{settings.max_retry_attempts})"
                    )

                    response = await client.post(
                        settings.stream3_assessment_url,
                        json=payload,
                    )

                    # On HTTP 4xx (non-retriable): log error with response body, raise immediately
                    if 400 <= response.status_code < 500:
                        logger.error(
                            f"Non-retriable HTTP {response.status_code} received from Stream 3 "
                            f"for event {event_id_str}: {response.text}"
                        )
                        raise DispatchError(
                            f"Stream 3 rejected assessment with status {response.status_code}: {response.text}"
                        )

                    # On HTTP 5xx (retriable): raise httpx.HTTPStatusError to trigger retry
                    if response.status_code >= 500:
                        logger.warning(
                            f"Retriable HTTP {response.status_code} received from Stream 3 "
                            f"for event {event_id_str}: {response.text}"
                        )
                        response.raise_for_status()

                    # On success: log at INFO with event_id and response status
                    logger.info(
                        f"Successfully dispatched assessment for event {event_id_str} "
                        f"to Stream 3 (HTTP {response.status_code})"
                    )

    except DispatchError:
        # Non-retriable 4xx client error: re-raise directly without further retries
        raise

    except (httpx.HTTPError, RetryError) as exc:
        # On permanent failure after all retries: log CRITICAL with full payload, raise DispatchError
        logger.critical(
            f"Permanent dispatch failure for event {event_id_str} after "
            f"{settings.max_retry_attempts} attempts: {exc}. "
            f"Replay payload: {payload}"
        )
        raise DispatchError(
            f"Failed to dispatch assessment for event {event_id_str} after "
            f"{settings.max_retry_attempts} attempts: {exc}"
        ) from exc

    except Exception as exc:
        # Unexpected error: log CRITICAL with full payload, raise DispatchError
        logger.critical(
            f"Unexpected permanent error dispatching assessment for event {event_id_str}: {exc}. "
            f"Replay payload: {payload}"
        )
        raise DispatchError(
            f"Unexpected dispatch error for event {event_id_str}: {exc}"
        ) from exc
