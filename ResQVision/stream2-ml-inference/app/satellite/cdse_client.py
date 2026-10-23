"""
app/satellite/cdse_client.py — Copernicus Data Space Ecosystem (CDSE) imagery client.

CDSE Overview:
The Copernicus Data Space Ecosystem (CDSE) is the open-access platform deployed by
the European Space Agency (ESA) and the European Commission to provide global earth
observation data from the Copernicus Sentinel satellite constellations.
- Sentinel-2 provides optical multi-spectral imagery (13 spectral bands, 10m to 60m
  spatial resolution, 5-day revisit cadence) ideal for visible infrastructure damage,
  vegetation loss, and flood boundary delineation.
- Sentinel-1 provides Synthetic Aperture Radar (SAR C-band 5.405 GHz, 10m resolution,
  dual-polarization VV/VH) unaffected by cloud cover, atmospheric smoke, or nighttime.

Access Architecture:
1. Authentication: OAuth2 client credentials grant via Keycloak IDP
   (https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token).
   Access tokens are cached until near expiry to minimize authentication overhead.
2. Discovery: Catalogue search via OData v4 API
   (https://catalogue.dataspace.copernicus.eu/odata/v1/Products).
   Queries filter by satellite collection, WKT polygon spatial intersection,
   temporal acquisition windows, and cloud coverage thresholds.
3. Download: Asset streaming via the CDSE Zipper service
   (https://zipper.dataspace.copernicus.eu/odata/v1/Products('{Id}')/$value)
   using 8KB streaming chunks to handle multi-gigabyte raster packages without
   memory bloat.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
import math
from pathlib import Path
import tempfile
import time
from typing import Any

import httpx
from loguru import logger

from app.config import settings
from app.schemas import BoundingBox


# ─────────────────────────────────────────────────────────────────────────────
# Custom Exceptions
# ─────────────────────────────────────────────────────────────────────────────


class CDSEError(Exception):
    """Base exception for all Copernicus Data Space Ecosystem operations."""


class CDSEAuthError(CDSEError):
    """Raised when authentication fails or required CDSE credentials are missing."""


class NoImageryAvailableError(CDSEError):
    """Raised when no suitable imagery is found matching spatial, temporal, or cloud criteria."""


# ─────────────────────────────────────────────────────────────────────────────
# Helper: Geographic Bounding Box Builder
# ─────────────────────────────────────────────────────────────────────────────


def build_bounding_box(lat: float, lng: float, half_km: float = 5.0) -> BoundingBox:
    """
    Convert a center coordinate point (lat, lng) to an axis-aligned BoundingBox.

    Spherical Earth approximation:
    - 1 degree latitude ≈ 111.32 km (constant across latitudes).
    - 1 degree longitude ≈ 111.32 * cos(lat_radians) km (converges toward poles).

    Args:
        lat: Epicenter / event latitude in decimal degrees [-90.0, 90.0].
        lng: Epicenter / event longitude in decimal degrees [-180.0, 180.0].
        half_km: Half-side distance from center in kilometers (default: 5.0 km,
            yielding a 10 km x 10 km square box).

    Returns:
        BoundingBox instance with min_lat, max_lat, min_lng, max_lng clamped
        to valid geographic coordinate intervals.
    """
    delta_lat = half_km / 111.32
    cos_lat = max(math.cos(math.radians(lat)), 1e-6)
    delta_lng = half_km / (111.32 * cos_lat)

    # Compute and clamp bounds to legal geographic intervals
    min_lat = max(-90.0, lat - delta_lat)
    max_lat = min(90.0, lat + delta_lat)
    min_lng = max(-180.0, lng - delta_lng)
    max_lng = min(180.0, lng + delta_lng)

    # Safeguard against zero/negative interval edge-cases at the extreme poles
    if min_lat >= max_lat:
        max_lat = min(90.0, min_lat + 1e-5)
    if min_lng >= max_lng:
        max_lng = min(180.0, min_lng + 1e-5)

    return BoundingBox(
        min_lat=round(min_lat, 6),
        max_lat=round(max_lat, 6),
        min_lng=round(min_lng, 6),
        max_lng=round(max_lng, 6),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Class: CDSEClient
# ─────────────────────────────────────────────────────────────────────────────


class CDSEClient:
    """
    Asynchronous client for interacting with the Copernicus Data Space Ecosystem (CDSE).

    Provides OAuth2 authentication with token caching, OData catalogue querying
    for Sentinel-2 optical and Sentinel-1 radar scenes, polling mechanisms for
    newly acquired post-disaster passes, and chunked streaming downloads.
    """

    CDSE_TOKEN_URL: str = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
    CDSE_SEARCH_URL: str = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    CDSE_DOWNLOAD_BASE: str = "https://zipper.dataspace.copernicus.eu/odata/v1/Products"

    def __init__(self) -> None:
        self._access_token: str | None = None
        self._token_expires_at: float = 0.0
        self._token_lock: asyncio.Lock = asyncio.Lock()

    async def _get_access_token(self) -> str:
        """
        Retrieve a valid OAuth2 access token, refreshing from Keycloak if expired or missing.

        Uses client_credentials grant type with credentials from `app.config.settings`.
        Caches the token in memory and automatically refreshes 60 seconds prior to expiration.

        Returns:
            Bearer access token string.

        Raises:
            CDSEAuthError: If credentials are missing or the Keycloak handshake fails.
        """
        async with self._token_lock:
            now = time.monotonic()
            if self._access_token and now < self._token_expires_at:
                return self._access_token

            client_id = settings.cdse_client_id.strip() if settings.cdse_client_id else ""
            client_secret = settings.cdse_client_secret.strip() if settings.cdse_client_secret else ""

            if not client_id or not client_secret:
                raise CDSEAuthError(
                    "CDSE credentials missing. Configure 'cdse_client_id' and 'cdse_client_secret' "
                    "in environment variables or .env file before making satellite requests."
                )

            data = {
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
            }
            headers = {"Content-Type": "application/x-www-form-urlencoded"}

            logger.debug("Requesting OAuth2 access token from CDSE Keycloak endpoint...")
            try:
                async with httpx.AsyncClient(timeout=settings.cdse_timeout_seconds) as client:
                    response = await client.post(self.CDSE_TOKEN_URL, data=data, headers=headers)
                    if response.status_code != 200:
                        raise CDSEAuthError(
                            f"CDSE token endpoint rejected authentication with HTTP {response.status_code}: "
                            f"{response.text}"
                        )
                    payload = response.json()
            except httpx.HTTPError as exc:
                raise CDSEAuthError(f"HTTP transport error while connecting to CDSE auth: {exc}") from exc

            access_token = payload.get("access_token")
            if not access_token:
                raise CDSEAuthError(f"Malformed auth response from CDSE, missing 'access_token': {payload}")

            expires_in = float(payload.get("expires_in", 300))
            # Cache token, refreshing 60 seconds before actual expiration
            self._access_token = access_token
            self._token_expires_at = time.monotonic() + max(0.0, expires_in - 60.0)
            logger.info("Successfully acquired CDSE access token (expires in {}s)", int(expires_in))
            return self._access_token

    async def _search_sentinel2(
        self,
        bbox: BoundingBox,
        start_date: str,
        end_date: str,
        max_cloud: int,
    ) -> list[dict[str, Any]]:
        """
        Query CDSE OData API for Sentinel-2 Level-2A products within bbox and date range.

        Args:
            bbox: Geographic bounding box of interest.
            start_date: ISO-8601 UTC start timestamp string (e.g., '2026-09-10T00:00:00.000Z').
            end_date: ISO-8601 UTC end timestamp string (e.g., '2026-10-10T00:00:00.000Z').
            max_cloud: Maximum acceptable cloud cover percentage (0 to 100).

        Returns:
            List of product dictionaries containing 'Id', 'Name', 'ContentDate', etc.

        Raises:
            CDSEError: If catalogue query fails or returns non-200 status code.
        """
        token = await self._get_access_token()

        # OData WKT polygon: counter-clockwise coordinates, closing back at start
        poly_wkt = (
            f"POLYGON(({bbox.min_lng} {bbox.min_lat}, "
            f"{bbox.max_lng} {bbox.min_lat}, "
            f"{bbox.max_lng} {bbox.max_lat}, "
            f"{bbox.min_lng} {bbox.max_lat}, "
            f"{bbox.min_lng} {bbox.min_lat}))"
        )
        cloud_str = f"{float(max_cloud):.2f}"

        filter_expr = (
            f"Collection/Name eq 'SENTINEL-2' and "
            f"OData.CSC.Intersects(area=geography'SRID=4326;{poly_wkt}') and "
            f"ContentDate/Start ge {start_date} and "
            f"ContentDate/Start le {end_date} and "
            f"Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'cloudCover' and "
            f"att/OData.CSC.StringAttribute/Value le '{cloud_str}')"
        )

        params = {
            "$filter": filter_expr,
            "$orderby": "ContentDate/Start desc",
            "$top": 5,
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        logger.debug("Searching CDSE Sentinel-2 catalogue: filter='{}'", filter_expr)
        try:
            async with httpx.AsyncClient(timeout=settings.cdse_timeout_seconds) as client:
                response = await client.get(self.CDSE_SEARCH_URL, params=params, headers=headers)
                if response.status_code != 200:
                    raise CDSEError(
                        f"CDSE catalogue query failed with HTTP {response.status_code}: {response.text}"
                    )
                data = response.json()
        except httpx.HTTPError as exc:
            raise CDSEError(f"HTTP transport error during Sentinel-2 catalogue search: {exc}") from exc

        products: list[dict[str, Any]] = data.get("value", [])
        logger.info(
            "Found {} Sentinel-2 candidates within bbox [{}, {}, {}, {}] between {} and {}",
            len(products),
            bbox.min_lat,
            bbox.min_lng,
            bbox.max_lat,
            bbox.max_lng,
            start_date,
            end_date,
        )
        return products

    async def _search_sentinel1(
        self,
        bbox: BoundingBox,
        start_date: str,
        end_date: str,
    ) -> list[dict[str, Any]]:
        """
        Query CDSE OData API for Sentinel-1 GRD products within bbox and date range.

        Synthetic Aperture Radar (SAR) penetrates cloud cover and atmospheric smoke,
        so no cloud cover filter is applied.

        Args:
            bbox: Geographic bounding box of interest.
            start_date: ISO-8601 UTC start timestamp string.
            end_date: ISO-8601 UTC end timestamp string.

        Returns:
            List of product dictionaries containing 'Id', 'Name', 'ContentDate', etc.

        Raises:
            CDSEError: If catalogue query fails or returns non-200 status code.
        """
        token = await self._get_access_token()

        poly_wkt = (
            f"POLYGON(({bbox.min_lng} {bbox.min_lat}, "
            f"{bbox.max_lng} {bbox.min_lat}, "
            f"{bbox.max_lng} {bbox.max_lat}, "
            f"{bbox.min_lng} {bbox.max_lat}, "
            f"{bbox.min_lng} {bbox.min_lat}))"
        )

        filter_expr = (
            f"Collection/Name eq 'SENTINEL-1' and "
            f"OData.CSC.Intersects(area=geography'SRID=4326;{poly_wkt}') and "
            f"ContentDate/Start ge {start_date} and "
            f"ContentDate/Start le {end_date}"
        )

        params = {
            "$filter": filter_expr,
            "$orderby": "ContentDate/Start desc",
            "$top": 5,
        }
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        logger.debug("Searching CDSE Sentinel-1 catalogue: filter='{}'", filter_expr)
        try:
            async with httpx.AsyncClient(timeout=settings.cdse_timeout_seconds) as client:
                response = await client.get(self.CDSE_SEARCH_URL, params=params, headers=headers)
                if response.status_code != 200:
                    raise CDSEError(
                        f"CDSE Sentinel-1 catalogue query failed with HTTP {response.status_code}: {response.text}"
                    )
                data = response.json()
        except httpx.HTTPError as exc:
            raise CDSEError(f"HTTP transport error during Sentinel-1 catalogue search: {exc}") from exc

        products: list[dict[str, Any]] = data.get("value", [])
        logger.info(
            "Found {} Sentinel-1 radar candidates within bbox between {} and {}",
            len(products),
            start_date,
            end_date,
        )
        return products

    async def _download_product(self, product_id: str, dest_dir: Path) -> Path:
        """
        Download a CDSE product archive using the Zipper service.

        Downloads the product via streaming chunks (8192 bytes) to maintain a minimal
        memory footprint even for multi-gigabyte satellite datasets. Logs download
        progress every 10% of total transfer.

        Args:
            product_id: CDSE UUID string of the product to download.
            dest_dir: Target directory path where the product file will be stored.

        Returns:
            Path to the downloaded file.

        Raises:
            CDSEError: If download fails or returns a non-200 status code.
        """
        token = await self._get_access_token()
        url = f"{self.CDSE_DOWNLOAD_BASE}('{product_id}')/$value"
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_file = dest_dir / f"{product_id}.zip"

        headers = {
            "Authorization": f"Bearer {token}",
        }

        logger.info("Initiating download for product ID: {} from Zipper service", product_id)

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(settings.cdse_timeout_seconds, read=300.0),
                follow_redirects=True,
            ) as client:
                async with client.stream("GET", url, headers=headers) as response:
                    if response.status_code != 200:
                        raise CDSEError(
                            f"CDSE Zipper download failed with HTTP {response.status_code} "
                            f"for product {product_id}"
                        )

                    total_bytes = int(response.headers.get("Content-Length", 0))
                    downloaded_bytes = 0
                    last_logged_pct = -1

                    with open(dest_file, "wb") as f:
                        async for chunk in response.aiter_bytes(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                downloaded_bytes += len(chunk)
                                if total_bytes > 0:
                                    pct = int((downloaded_bytes / total_bytes) * 100)
                                    if pct >= last_logged_pct + 10:
                                        logger.info(
                                            "Downloading product {}: {}% ({:.1f} MB / {:.1f} MB)",
                                            product_id,
                                            pct,
                                            downloaded_bytes / (1024 * 1024),
                                            total_bytes / (1024 * 1024),
                                        )
                                        last_logged_pct = (pct // 10) * 10
                                else:
                                    # Fallback if Content-Length header is omitted: log every 20 MB
                                    mb = downloaded_bytes // (20 * 1024 * 1024)
                                    if mb > last_logged_pct:
                                        logger.info(
                                            "Downloading product {}: {:.1f} MB received",
                                            product_id,
                                            downloaded_bytes / (1024 * 1024),
                                        )
                                        last_logged_pct = mb

            logger.info(
                "Completed download of product {} ({:.2f} MB) -> {}",
                product_id,
                downloaded_bytes / (1024 * 1024),
                dest_file,
            )
            return dest_file
        except httpx.HTTPError as exc:
            raise CDSEError(f"HTTP streaming error while downloading product {product_id}: {exc}") from exc

    async def fetch_image_pair(
        self,
        bbox: BoundingBox,
        event_timestamp: datetime,
    ) -> tuple[Path, Path]:
        """
        Acquire optical Sentinel-2 pre-event and post-event imagery for a disaster event.

        - Pre-event: Search window from 30 days before event up to event timestamp.
        - Post-event: Search window from event timestamp to present.
        - If post-event imagery is not yet catalogued, polls periodically every
          settings.post_image_poll_interval_hours for up to settings.post_image_max_wait_hours.
        - Downloads both images to a temporary directory created via tempfile.mkdtemp().

        Args:
            bbox: BoundingBox enclosing the area of interest.
            event_timestamp: Datetime when the disaster occurred.

        Returns:
            Tuple of (pre_event_image_path, post_event_image_path).

        Raises:
            NoImageryAvailableError: If no pre-event imagery or post-event imagery
                meets cloud cover thresholds within allowable time limits.
        """
        # Ensure UTC timezone alignment
        if event_timestamp.tzinfo is None:
            event_timestamp = event_timestamp.replace(tzinfo=timezone.utc)
        else:
            event_timestamp = event_timestamp.astimezone(timezone.utc)

        logger.info(
            "Fetching Sentinel-2 image pair for event at {} (BBox: min_lat={}, min_lng={}, max_lat={}, max_lng={})",
            event_timestamp.isoformat(),
            bbox.min_lat,
            bbox.min_lng,
            bbox.max_lat,
            bbox.max_lng,
        )

        # 1. Search Pre-event imagery (30 days prior up to event timestamp)
        pre_start = (event_timestamp - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        pre_end = event_timestamp.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        logger.info("Searching pre-event Sentinel-2 imagery ({} to {})...", pre_start, pre_end)

        pre_candidates = await self._search_sentinel2(
            bbox=bbox,
            start_date=pre_start,
            end_date=pre_end,
            max_cloud=settings.max_cloud_cover,
        )
        if not pre_candidates:
            raise NoImageryAvailableError(
                f"No pre-event Sentinel-2 imagery found within 30 days before "
                f"{event_timestamp.isoformat()} with cloud cover <= {settings.max_cloud_cover}%."
            )
        pre_product = pre_candidates[0]
        logger.info("Selected pre-event product: {} (ID: {})", pre_product.get("Name"), pre_product.get("Id"))

        # 2. Search Post-event imagery (event timestamp to now) with polling loop
        post_start = event_timestamp.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        now_utc = datetime.now(timezone.utc)
        post_end = now_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        logger.info("Searching post-event Sentinel-2 imagery ({} to {})...", post_start, post_end)

        post_candidates = await self._search_sentinel2(
            bbox=bbox,
            start_date=post_start,
            end_date=post_end,
            max_cloud=settings.max_cloud_cover,
        )

        poll_interval_sec = settings.post_image_poll_interval_hours * 3600.0
        max_wait_sec = settings.post_image_max_wait_hours * 3600.0
        elapsed_sec = 0.0

        while not post_candidates and elapsed_sec < max_wait_sec:
            wait_time = min(poll_interval_sec, max_wait_sec - elapsed_sec)
            logger.warning(
                "No post-event Sentinel-2 imagery catalogued yet. "
                "Sleeping for {:.1f} hours before retry (elapsed: {:.1f}h / max: {:.1f}h)...",
                wait_time / 3600.0,
                elapsed_sec / 3600.0,
                settings.post_image_max_wait_hours,
            )
            await asyncio.sleep(wait_time)
            elapsed_sec += wait_time

            now_utc = datetime.now(timezone.utc)
            post_end = now_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            post_candidates = await self._search_sentinel2(
                bbox=bbox,
                start_date=post_start,
                end_date=post_end,
                max_cloud=settings.max_cloud_cover,
            )

        if not post_candidates:
            raise NoImageryAvailableError(
                f"No post-event Sentinel-2 imagery available after waiting "
                f"{settings.post_image_max_wait_hours:.1f} hours since {event_timestamp.isoformat()}."
            )

        post_product = post_candidates[0]
        logger.info("Selected post-event product: {} (ID: {})", post_product.get("Name"), post_product.get("Id"))

        # 3. Download both products to a secure temporary directory
        temp_dir = Path(tempfile.mkdtemp(prefix="resqvision_cdse_s2_"))
        logger.info("Downloading image pair to temporary workspace: {}", temp_dir)

        pre_path = await self._download_product(pre_product["Id"], temp_dir)
        post_path = await self._download_product(post_product["Id"], temp_dir)

        logger.info("Successfully acquired optical image pair: pre={}, post={}", pre_path.name, post_path.name)
        return pre_path, post_path

    async def fetch_sentinel1_fallback(
        self,
        bbox: BoundingBox,
        event_timestamp: datetime,
    ) -> tuple[Path, Path]:
        """
        Acquire Synthetic Aperture Radar (SAR) Sentinel-1 GRD pre/post imagery as fallback.

        WARNING:
            SAR-specific preprocessing (calibration, speckle filtering, terrain correction)
            is NOT applied in this version. This is a known simplification — Sentinel-1
            data is passed through the same optical pipeline as a fallback. Proper SAR
            preprocessing is a future improvement.

        Sentinel-1 operates in C-band microwave frequencies and penetrates clouds, fog,
        and smoke, making it invaluable when Sentinel-2 optical imagery is obscured by
        dense cloud cover or storm conditions.

        Args:
            bbox: BoundingBox enclosing the area of interest.
            event_timestamp: Datetime when the disaster occurred.

        Returns:
            Tuple of (pre_event_image_path, post_event_image_path).

        Raises:
            NoImageryAvailableError: If no suitable Sentinel-1 imagery is catalogued.
        """
        if event_timestamp.tzinfo is None:
            event_timestamp = event_timestamp.replace(tzinfo=timezone.utc)
        else:
            event_timestamp = event_timestamp.astimezone(timezone.utc)

        logger.info(
            "Fetching Sentinel-1 GRD fallback pair for event at {} (BBox: min_lat={}, min_lng={}, max_lat={}, max_lng={})",
            event_timestamp.isoformat(),
            bbox.min_lat,
            bbox.min_lng,
            bbox.max_lat,
            bbox.max_lng,
        )

        pre_start = (event_timestamp - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        pre_end = event_timestamp.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        logger.info("Searching pre-event Sentinel-1 imagery ({} to {})...", pre_start, pre_end)

        pre_candidates = await self._search_sentinel1(bbox=bbox, start_date=pre_start, end_date=pre_end)
        if not pre_candidates:
            raise NoImageryAvailableError(
                f"No pre-event Sentinel-1 imagery found within 30 days before {event_timestamp.isoformat()}."
            )
        pre_product = pre_candidates[0]
        logger.info("Selected pre-event Sentinel-1 product: {} (ID: {})", pre_product.get("Name"), pre_product.get("Id"))

        post_start = event_timestamp.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        now_utc = datetime.now(timezone.utc)
        post_end = now_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
        logger.info("Searching post-event Sentinel-1 imagery ({} to {})...", post_start, post_end)

        post_candidates = await self._search_sentinel1(bbox=bbox, start_date=post_start, end_date=post_end)

        poll_interval_sec = settings.post_image_poll_interval_hours * 3600.0
        max_wait_sec = settings.post_image_max_wait_hours * 3600.0
        elapsed_sec = 0.0

        while not post_candidates and elapsed_sec < max_wait_sec:
            wait_time = min(poll_interval_sec, max_wait_sec - elapsed_sec)
            logger.warning(
                "No post-event Sentinel-1 imagery catalogued yet. "
                "Sleeping for {:.1f} hours before retry (elapsed: {:.1f}h / max: {:.1f}h)...",
                wait_time / 3600.0,
                elapsed_sec / 3600.0,
                settings.post_image_max_wait_hours,
            )
            await asyncio.sleep(wait_time)
            elapsed_sec += wait_time

            now_utc = datetime.now(timezone.utc)
            post_end = now_utc.strftime("%Y-%m-%dT%H:%M:%S.000Z")
            post_candidates = await self._search_sentinel1(bbox=bbox, start_date=post_start, end_date=post_end)

        if not post_candidates:
            raise NoImageryAvailableError(
                f"No post-event Sentinel-1 imagery available after waiting "
                f"{settings.post_image_max_wait_hours:.1f} hours since {event_timestamp.isoformat()}."
            )

        post_product = post_candidates[0]
        logger.info("Selected post-event Sentinel-1 product: {} (ID: {})", post_product.get("Name"), post_product.get("Id"))

        temp_dir = Path(tempfile.mkdtemp(prefix="resqvision_cdse_s1_"))
        logger.info("Downloading Sentinel-1 image pair to temporary workspace: {}", temp_dir)

        pre_path = await self._download_product(pre_product["Id"], temp_dir)
        post_path = await self._download_product(post_product["Id"], temp_dir)

        logger.info("Successfully acquired radar image pair: pre={}, post={}", pre_path.name, post_path.name)
        return pre_path, post_path
