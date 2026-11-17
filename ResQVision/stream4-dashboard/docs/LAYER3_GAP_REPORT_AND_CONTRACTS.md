# ResQVision Layer 3 — Gap Report & API Contracts

## 1. Requirement Gap Classification

Legend:
- **A**: Already implemented (frontend + local backend)
- **B**: Implemented using mock data only (when `VITE_USE_MOCK_DATA=true`)
- **C**: Requires a backend API (implemented locally in `server/`, requires production hosting/DB)
- **D**: Requires an external provider, integration, or credential
- **E**: Requires institutional authorization or operational approval
- **F**: Blocked until a dependency is provided

| Capability / Requirement | Classification | Current Reality in Repository |
|---|---|---|
| Citizen Portal UI (4 routes, Light theme, MapLibre, Search, Validation) | **A** | Completed in `src/pages/citizen/*` |
| Government Portal UI (4 routes, Dark Charcoal + Orange, MapLibre, Review UI) | **A** | Completed in `src/pages/government/*` |
| Citizen SOS Submission, History, Duplicate Guard & RBAC Attachments | **A / C** | Implemented locally in `server/app.js` (`/api/v1/sos`, `/api/v1/citizen/sos`, `/api/v1/attachments/:id`) using JSON store + local disk uploads; production deployment requires managed DB & object storage |
| Server-Generated PDF Submission Receipt | **A** | Implemented in `server/pdfGenerator.js` (`GET /api/v1/citizen/sos/:reference/receipt.pdf`) bound to stored records |
| Officer Review, Audit Log, Rescue Operations & Separate Casualties | **A / C** | Implemented locally in `server/app.js` (`/api/v1/government/*`) |
| Role-Based Authentication (Citizen vs Government Tokens) | **A / D / E** | Local HMAC-SHA256 + scrypt RBAC implemented in `server/auth.js`; **real government identity verification requires institutional SSO / PKI (D, E)** |
| Active Disasters & Dispatch Log (`GET /api/active-disasters`, `GET /api/assessments/:event_id/dispatch-log`) | **F** | Frontend client + Vite proxy ready (`http://localhost:8003`); **Stream 3 server is offline/absent in this workspace** |
| External AI Image Authenticity Assessment | **D / F** | Cautious boundary UI & server stub implemented; **no external AI provider URL/API key provided** |
| Authoritative Hospitals / Shelters / Food / Water / Road Closures / Verified Evacuation Routes | **D / E / F** | Returns empty/unconnected in live mode (`GET /api/v1/resources`); demo placeholders only in mock mode. **Requires authoritative NDMA/SDMA/state geospatial feeds** |
| Real-World Rescue Team Dispatch & Live Team GPS | **E / F** | Officer authorization records operational intent locally (`real_world_dispatch_confirmed: false`); **actual dispatch requires institutional CAD/NDRF integration** |

---

## 2. Implemented API Contracts

### A. Confirmed Stream 3 Brief Contracts (External — `http://localhost:8003`)
- `GET /api/active-disasters` — Polled every 10 seconds by SWR (`src/hooks/useDashboardData.js`). Expects array or `{ status: "success", data: [] }`.
- `GET /api/assessments/:event_id/dispatch-log` — Polled when an event is selected. Supports statuses `received`, `ndrf_notified`, `ndrf_confirmed`, `ndrf_denied`, `fully_dispatched`.

### B. Implemented Layer 3 Local Backend (`/api/v1/*` — `server/app.js` on port `8004`)
- `GET /api/v1/health` — Returns backend & external dependency availability flags.
- `POST /api/v1/auth/citizen/register` — Registers citizen (`name`, `email`, `password >= 8`), returns `201` + Bearer token or `409` duplicate email.
- `POST /api/v1/auth/citizen/login` — Authenticates citizen, returns `200` + Bearer token or `401`.
- `POST /api/v1/auth/government/login` — Authenticates government officer with agency role, returns `200` + Bearer token or `401`.
- `POST /api/v1/sos` (`citizen` role, `multipart/form-data`) — Validates fields & image magic bytes (JPEG/PNG/WebP <= 5 MB, max 4), prevents 10-min duplicates (`409`), stores attachments outside `public/`, creates government notification, returns `201`.
- `GET /api/v1/citizen/sos` (`citizen` role) — Returns authenticated citizen's own reports only.
- `GET /api/v1/citizen/sos/:reference` (`citizen` owner only, `403` otherwise).
- `POST /api/v1/citizen/sos/:reference/reply` (`citizen` owner only) — Responds to officer info request.
- `GET /api/v1/citizen/sos/:reference/receipt.pdf` (`citizen` owner only) — Streams PDF-1.4 submission receipt.
- `GET /api/v1/attachments/:attachmentId` (`government` role OR owning `citizen` only, `403` otherwise).
- `GET /api/v1/government/notifications`, `POST /api/v1/government/notifications/read` (`government` role).
- `GET /api/v1/government/sos` (`government` role).
- `POST /api/v1/government/sos/:reference/review` (`government` role) — Human actions: `verify`, `reject` (requires `reason`), `request_info` (requires `infoRequest`), `authorize` (requires `unit`, creates operation record).
- `GET /api/v1/government/operations`, `POST /api/v1/government/operations/:operationRef/update` (`government` role, supports multipart evidence upload).
- `GET /api/v1/government/casualties`, `POST /api/v1/government/casualties` (`government` role, strictly separate from operation counts).

---

## 3. Proposed External Contracts (PROPOSED — NOT CURRENTLY IMPLEMENTED)

### 1. Authoritative Geospatial Resources & Verified Evacuation Routes
**Status:** `PROPOSED — NOT CURRENTLY IMPLEMENTED`
- **Endpoint:** `GET /api/v1/external/geospatial-resources?state=&district=&bbox=`
- **Permissions:** Public read for citizen-safe facilities (`hospital`, `shelter`, `food`, `water`, `rescue_center`, `road_closure`, `verified_evacuation_route`); `government` role required for `authorized_rescue_units`.
- **Response Fields:** `{ source: string, authority: string, updated_at: ISO8601, resources: Array<{ id, category, name, lat, lng, address, status, verified }>, verified_evacuation_routes: Array<{ id, name, authoritative_source, verified: true, coordinates: [lng, lat][] }> }`
- **Validation & Errors:** `400` invalid bounding box, `503` upstream geospatial authority unreachable (frontend must show unavailability notice and zero fabricated markers).

### 2. External Image Authenticity Assessment Service
**Status:** `PROPOSED — NOT CURRENTLY IMPLEMENTED`
- **Endpoint:** `POST /api/v1/external/image-assessment`
- **Permissions:** Server-to-server (`government` review workflow only; credentials stored in server env vars only).
- **Request:** `{ attachmentId: string, sha256: string }`
- **Response Fields:** `{ advisory_only: true, signal_level: "low_concern" | "inconclusive" | "manual_check_advised", limitations: string, metadata_summary: string }`
- **Validation & Errors:** `503` provider unavailable; UI must always display human-verification disclaimer and never claim automated certainty.

### 3. Institutional Government SSO / RBAC Identity Provider
**Status:** `PROPOSED — NOT CURRENTLY IMPLEMENTED`
- **Protocol:** OIDC / OAuth2 PKCE against authorized NDMA / NIC / Parichay identity provider.
- **Claims Required:** `sub`, `agency_code`, `role_tier`, `jurisdiction_state`, `verified_officer: true`.
- **Errors:** `401` invalid signature/expired token, `403` missing agency authorization claim.

### 4. Authorized Rescue Dispatch CAD Bridge
**Status:** `PROPOSED — NOT CURRENTLY IMPLEMENTED`
- **Endpoint:** `POST /api/v1/external/dispatch-authorization`
- **Permissions:** Senior officer RBAC claim (`can_authorize_dispatch: true`) + explicit human confirmation payload.
- **Request:** `{ operation_ref, sos_ref, unit_id, officer_id, confirmation_timestamp }`
- **Response:** `{ accepted_by_cad: boolean, cad_ticket_id: string, dispatch_confirmed: boolean }`
- **Errors:** `403` insufficient authority, `502` CAD gateway unreachable.
