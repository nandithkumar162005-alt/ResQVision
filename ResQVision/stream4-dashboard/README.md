# ResQVision — Stream 4 Command Dashboard
### AI Disaster Intelligence Operations Interface

An emergency-operations coordination interface built with **React 18**, **Vite**, **Tailwind CSS**, and **MapLibre GL JS**, presenting authoritative disaster intelligence from Stream 3 (Dispatch Backend).

---

## 1. Architecture Boundaries

ResQVision comprises four streams:
* **Stream 1**: Data Ingestion & Early Warning (monitors external data sources).
* **Stream 2**: AI & Satellite Analysis (produces damage scores and classifications).
* **Stream 3**: Response Dispatch & Alerts (owns authoritative event records, dispatch orchestration, persistence, and dispatch logs).
* **Stream 4 (This Project)**: Read-only command interface that polls Stream 3 data and visualizes active disasters, critical zones, population impact, and dispatch wave chronologies.

> [!IMPORTANT]
> **Stream 4 is strictly read-only.** It does NOT run AI models, perform satellite analysis, write to a database, or initiate real emergency dispatches.

---

## 2. Quick Start & Local Setup

### Prerequisites
* Node.js v18+ or v20+
* npm v9+

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run unit test suite (Vitest)
npm test

# 3. Start local development server (defaults to Mock Mode)
npm run dev

# 4. Build for production
npm run build
```

Development server runs on: **`http://localhost:3000`**

---

## 3. Environment Variables

Configure environment variables in `.env` (or copy from `.env.example`):

```bash
# Stream 3 Backend API Base URL
VITE_STREAM3_BASE_URL=http://localhost:8003

# Use Mock Data (true enables synthetic local demonstration fixtures)
VITE_USE_MOCK_DATA=true

# Demo Auth Bypass (permitted only when import.meta.env.DEV && VITE_USE_MOCK_DATA=true)
VITE_ENABLE_DEMO_AUTH=true
```

### Switching between Mock and Real API Mode
* **Mock Mode (`VITE_USE_MOCK_DATA=true`)**: The dashboard runs self-contained using 5 synthetic Indian disaster scenarios across multiple regions (coastal cyclone, riverine flooding, seismic disturbance, landslide) with zero backend dependency.
* **Real API Mode (`VITE_USE_MOCK_DATA=false`)**: The dashboard makes live HTTP GET requests to `http://localhost:8003/api/active-disasters` and `http://localhost:8003/api/assessments/:event_id/dispatch-log`. If Stream 3 is unreachable, it displays a calm connection warning (`Dispatch service unavailable — retrying`) and preserves cached data with a `STALE DATA` indicator. It **never silently falls back to mock data**.

---

## 4. Visual Design System

The visual identity follows a dark command-center aesthetic inspired by emergency management consoles (SACHET, Bhuvan, GDACS, Copernicus EMS):

* **Main App Background**: `#0B1220` (Deep navy/slate, not pure black)
* **Sidebar & Navigation**: `#0E1726`
* **Card & Panel Surfaces**: `#131F31`
* **Elevated Cards**: `#18263A`
* **Borders**: `#263449`
* **Text**: High-contrast off-white (`#F1F5F9`) and muted cool slate (`#94A3B8`)
* **Primary Accent**: Retrained cyan (`#67D4F3`)
* **Severity Tokens**:
  * **Destroyed**: `#EF4444` (Red — catastrophic structural failure)
  * **Major Damage**: `#F59E0B` (Amber — structural compromise requiring search and rescue)
  * **Unknown Severity**: `#64748B` (Neutral slate — awaiting satellite classification)
  * **Confirmed / Verified**: `#34D399` (Green — only for confirmed responder check-in)

---

## 5. Navigation & Routes

The application features a responsive sidebar navigation with five implemented routes:

1. **Overview (`/` or `/overview`)**: Operations overview with connection status, conditional alert banner, 5 primary KPI cards, interactive MapLibre street map, incident snapshot list, two sample news panels, and 4-stage pipeline telemetry strip.
2. **Incidents (`/incidents`)**: Searchable and filterable incident queue (search by event ID, disaster type, location; filter by dispatch status, damage classification) with synchronized map and critical zone tables.
3. **Analytics (`/analytics`)**: Three data-derived Recharts visualizations:
   * *Damage Classification Overview* (donut chart)
   * *Population Impact by Incident* (comparative horizontal bar chart with notice that estimates may overlap)
   * *Critical Zones by Incident* (stacked bar chart)
4. **Dispatch (`/dispatch`)**: Incident switcher and chronological vertical timeline displaying wave numbers, responder teams (e.g. NDRF, SDRF), status pills, IST timestamps, and tactical messages.
5. **Intelligence Feed (`/news`)**: Two separate demo-news panels (*Critical News — Demo Samples* and *All News — Demo Samples*) explicitly watermarked `DEMO / SAMPLE — NOT LIVE NEWS`.

On mobile viewports (< 768px), the sidebar collapses into a drawer accessible via an accessible hamburger button.

---

## 6. Manual Verification Checklist

- [x] **Mock mode with multiple incidents**: 5 fictional scenarios display on the map across India with varying damage scores, population estimates, and dispatch statuses.
- [x] **Mock mode with zero incidents**: Click "Fixture: Active Fixture" in the top bar to toggle to "Zero Events". Confirms calm empty state ("No active incidents are currently returned by the dispatch service") with no red emergency banner.
- [x] **Real API success**: When `VITE_USE_MOCK_DATA=false` and backend is running, polls `/api/active-disasters` every 10 seconds and updates KPIs and map.
- [x] **Real API unreachable**: Shows `Dispatch service unavailable — retrying` warning banner with retry button. Preserves last good data labeled `STALE DATA`.
- [x] **Malformed API response**: API client catches non-JSON or invalid response shapes and displays development diagnostics without crashing React.
- [x] **Map markers & legend**: Destroyed zones render in red (`#EF4444`), major damage in amber (`#F59E0B`), unknown in slate (`#64748B`). Legend is clearly visible.
- [x] **Marker selection**: Clicking a marker anchors a compact popup showing zone coordinates, parent event ID, dispatch status, damage score, and population.
- [x] **Dispatch timeline continuity**: Selecting an incident updates the dispatch timeline immediately, cancelling stale pending requests.
- [x] **Timestamp sorting**: Sorts newest activity first using `updated_at`, falling back to `created_at`. If timestamps are absent, preserves original API order with a subtle note.
- [x] **Metadata filters**: Filters only appear when data exists; active filters show a "Reset Filters" action.
- [x] **Demo news labels**: Both news panels prominently feature `DEMO / SAMPLE — NOT LIVE NEWS` and individual sample badges.
- [x] **Demo auth guard**: Demo login is permitted only when `DEV && VITE_USE_MOCK_DATA=true`. In production builds, demo login is permanently blocked.

---

## 7. Unresolved Stream 3 & Auth Contract Questions

These items are documented for the backend and auth team to finalize:

1. **Base URL and Port**: Is `http://localhost:8003` the finalized local API URL? What is the production HTTPS domain?
2. **Active Disasters Envelope**: Will `GET /api/active-disasters` always return `{ "status": "success", "data": [...] }`?
3. **Dispatch Log Envelope**: Will `GET /api/assessments/:event_id/dispatch-log` return a raw array `[...]` or wrapped in `{ "status": "success", "data": [...] }`? (Client currently normalizes both).
4. **Exact Event Fields**: Confirm nullability and typing for `event_id`, `dispatch_status`, `damage_score_out_of_100`, `affected_population_estimate`, and `critical_zones`.
5. **Timestamp Fields**: Confirm whether `updated_at` and `created_at` will be standardized ISO-8601 UTC strings.
6. **Optional Metadata**: Will future payloads include `location_name`, `disaster_type`, and `event_status`?
7. **Dispatch Status Enum**: Confirm all possible status values: `received`, `ndrf_notified`, `ndrf_confirmed`, `ndrf_denied`, `fully_dispatched`.
8. **Critical Zone Semantics**: Does one entry in `critical_zones` represent a building, parcel, or sensor cell?
9. **Damage Score Interpretation**: Does `damage_score_out_of_100` measure event-wide severity or physical asset loss?
10. **Population Estimates**: Are population counts deduplicated across adjacent events?
11. **Production Authentication**: Which IDP/auth provider (OAuth2, OIDC, JWT Bearer, or HttpOnly session cookie) will be implemented?
12. **CORS & Credentials**: Confirm allowed origins and `Access-Control-Allow-Credentials` configuration for frontend deployment.
13. **Upstream Health Check**: Are there health endpoints for Stream 1 (Ingestion) and Stream 2 (AI Satellite)? (Currently displayed as *Not Instrumented*).

---

## 8. Deployment (Vercel)

1. Build command: `npm run build`
2. Output directory: `dist`
3. Set environment variable: `VITE_STREAM3_BASE_URL=https://your-production-stream3-api.domain`
4. Set `VITE_USE_MOCK_DATA=false`
5. Note: Localhost cannot be used in a deployed Vercel environment; the backend must be hosted with valid HTTPS and CORS headers.
