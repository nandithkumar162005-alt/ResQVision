"""
ResQVision Stream 1 — NewsAPI Collector
Searches for recent disaster-related news headlines for
corroboration with sensor data.  Gracefully degrades if
no API key is configured.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List

import httpx
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from schemas import RawNewsArticle
from config import settings

log = structlog.get_logger(__name__)

NEWSAPI_EVERYTHING_URL = "https://newsapi.org/v2/everything"

# Search terms used to find disaster-related articles
DISASTER_KEYWORDS = (
    "(earthquake OR flood OR tsunami OR cyclone OR hurricane "
    "OR typhoon OR landslide OR \"extreme weather\")"
)


class NewsCollector:
    """Fetch disaster-related headlines from NewsAPI."""

    def __init__(self, client: httpx.AsyncClient | None = None):
        self._client = client

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
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.TransportError)),
        reraise=True,
    )
    async def fetch(self) -> List[RawNewsArticle]:
        """
        Query NewsAPI for recent disaster-related articles.
        Returns an empty list if the API key is not configured.
        """
        if not settings.NEWS_API_KEY:
            log.warning("news_skip_no_api_key")
            return []

        client = await self._get_client()

        params = {
            "q": DISASTER_KEYWORDS,
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 20,
            "apiKey": settings.NEWS_API_KEY,
        }

        log.info("news_fetch_start")
        resp = await client.get(NEWSAPI_EVERYTHING_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

        articles: List[RawNewsArticle] = []
        for article in data.get("articles", []):
            if not isinstance(article, dict):
                continue
            published = article.get("publishedAt") or ""
            try:
                pub_dt = datetime.fromisoformat(str(published).replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                pub_dt = datetime.now(timezone.utc)

            source_dict = article.get("source") or {}
            source_name = source_dict.get("name") or "Unknown"

            articles.append(
                RawNewsArticle(
                    source_name=str(source_name),
                    title=str(article.get("title") or ""),
                    description=article.get("description"),
                    url=str(article.get("url") or ""),
                    published_at=pub_dt,
                    content_snippet=article.get("content"),
                )
            )

        log.info("news_fetch_done", count=len(articles))
        return articles
