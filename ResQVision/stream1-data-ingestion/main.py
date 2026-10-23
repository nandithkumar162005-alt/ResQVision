"""
ResQVision Stream 1 — Main Entry Point
Runs three concurrent async polling loops (USGS, Open-Meteo, NewsAPI),
feeds results through the normalisation pipeline, and dispatches
canonical DisasterEvent objects to Stream 2.
"""

from __future__ import annotations

import asyncio
import signal
import sys

import structlog

from collectors import MeteoCollector, NewsCollector, USGSCollector
from config import settings
from dispatcher import Dispatcher
from pipeline import AlertPipeline
from cache import evict_event

# ── Structured logging setup ────────────────────────────────

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(colors=True),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    cache_logger_on_first_use=True,
)

log = structlog.get_logger("resqvision.stream1")


# ── Polling loops ────────────────────────────────────────────

async def poll_usgs(
    collector: USGSCollector,
    pipeline: AlertPipeline,
    dispatcher: Dispatcher,
    stop_event: asyncio.Event,
):
    """Poll USGS for earthquakes on a fixed interval."""
    while not stop_event.is_set():
        try:
            raw = await collector.fetch()
            events = pipeline.process_earthquakes(raw)
            if events:
                results = await dispatcher.dispatch(events)
                if results.get("failed", 0) > 0:
                    failed_ids = {e["event_id"] for e in results.get("errors", [])}
                    for ev in events:
                        if ev.event_id in failed_ids:
                            evict_event(ev.source, ev.source_event_id)
        except Exception:
            log.exception("usgs_poll_error")

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=settings.USGS_POLL_INTERVAL)
        except asyncio.TimeoutError:
            pass  # Interval elapsed — loop again


async def poll_meteo(
    collector: MeteoCollector,
    pipeline: AlertPipeline,
    dispatcher: Dispatcher,
    stop_event: asyncio.Event,
):
    """Poll Open-Meteo for weather data on a fixed interval."""
    while not stop_event.is_set():
        try:
            raw = await collector.fetch()
            events = pipeline.process_weather(raw)
            if events:
                results = await dispatcher.dispatch(events)
                if results.get("failed", 0) > 0:
                    failed_ids = {e["event_id"] for e in results.get("errors", [])}
                    for ev in events:
                        if ev.event_id in failed_ids:
                            evict_event(ev.source, ev.source_event_id)
        except Exception:
            log.exception("meteo_poll_error")

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=settings.METEO_POLL_INTERVAL)
        except asyncio.TimeoutError:
            pass


async def poll_news(
    collector: NewsCollector,
    pipeline: AlertPipeline,
    stop_event: asyncio.Event,
):
    """
    Poll NewsAPI for disaster headlines and update the pipeline's
    corroboration buffer.  News is NOT dispatched as its own event —
    it enriches earthquake/rainfall events with the corroborated_by_news flag.
    """
    while not stop_event.is_set():
        try:
            articles = await collector.fetch()
            pipeline.update_news_buffer(articles)
        except Exception:
            log.exception("news_poll_error")

        try:
            await asyncio.wait_for(stop_event.wait(), timeout=settings.NEWS_POLL_INTERVAL)
        except asyncio.TimeoutError:
            pass


# ── Entrypoint ───────────────────────────────────────────────

async def main():
    log.info(
        "stream1_starting",
        usgs_interval=settings.USGS_POLL_INTERVAL,
        meteo_interval=settings.METEO_POLL_INTERVAL,
        news_interval=settings.NEWS_POLL_INTERVAL,
        monitor_coords=(settings.MONITOR_LATITUDE, settings.MONITOR_LONGITUDE),
        webhook=settings.STREAM_2_WEBHOOK_URL,
    )

    # Shared resources
    pipeline = AlertPipeline()
    dispatcher = Dispatcher()
    stop_event = asyncio.Event()

    # Collectors
    usgs = USGSCollector()
    meteo = MeteoCollector()
    news = NewsCollector()

    # Prime news buffer on startup so initial sensor alerts have corroboration
    try:
        articles = await news.fetch()
        pipeline.update_news_buffer(articles)
    except Exception:
        log.exception("news_initial_prime_error")

    # Graceful shutdown on SIGINT / SIGTERM
    def _shutdown(sig, _frame):
        log.warning("stream1_shutdown_requested", signal=sig)
        stop_event.set()

    if sys.platform != "win32":
        loop = asyncio.get_running_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, lambda s=sig: _shutdown(s, None))
    else:
        signal.signal(signal.SIGINT, _shutdown)

    # Launch all polling loops concurrently
    tasks = [
        asyncio.create_task(poll_usgs(usgs, pipeline, dispatcher, stop_event), name="usgs"),
        asyncio.create_task(poll_meteo(meteo, pipeline, dispatcher, stop_event), name="meteo"),
        asyncio.create_task(poll_news(news, pipeline, stop_event), name="news"),
    ]

    log.info("stream1_running", active_tasks=len(tasks))

    try:
        await asyncio.gather(*tasks)
    except (asyncio.CancelledError, KeyboardInterrupt):
        pass
    finally:
        stop_event.set()
        for t in tasks:
            if not t.done():
                t.cancel()
        await asyncio.gather(
            usgs.close(),
            meteo.close(),
            news.close(),
            dispatcher.close(),
            return_exceptions=True,
        )
        log.info("stream1_stopped")


if __name__ == "__main__":
    asyncio.run(main())
