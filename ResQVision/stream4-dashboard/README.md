# Stream 4: Portals (React + Vite) and portal backend (Node / Express)

Two parts live in this folder:

| Part | Port | What it does |
|---|---|---|
| Portals (`src/`, Vite dev server) | 5173 | Home page, Citizen portal, Rescue (NDRF) dashboard, Verify Image page |
| Portal backend (`server/`, "Layer 3") | 8004 | Accounts, SOS reports, officer review, and a relay that sends photos to Stream 2 for verification |

The portals read live incidents from Stream 3 (`/api/active-disasters`, `/api/assessments/:id/dispatch-log`) through the Vite proxy,
and the Rescue dashboard can Confirm / Deny an event (`POST /api/assessments/:id/verify`).

## Run
```
npm install
npm run server      # portal backend on 8004
npm run dev         # portals on 5173
npm run test:e2e    # 22 backend tests
npm run build
```
`.env`: `VITE_USE_MOCK_DATA=false` reads Stream 3 (live). `true` shows fake data (UI work only, nothing is sent anywhere).

## Demo accounts (seeded)
- Citizen: `citizen@resqvision.local` / `CitizenDemo!2026`
- Officer: `officer@ndrf.resqvision.local` / `OfficerDemo!2026`

## Verify Image (`/verify`)
Upload a photo (optionally say what, where and when). The backend relays it to Stream 2 `POST :8002/verify-image`, which returns:
1. authenticity analysis (metadata / C2PA / EXIF, noise, spectrum, edit traces, optional classifier), and
2. a context check: the photo's GPS/time or your claim compared with Open-Meteo rainfall/wind and USGS earthquakes.
The result is evidence, not proof. If Stream 2 is down the page says so.

## Editing the UI
Pages are in `src/pages`, shared pieces in `src/components`, API calls in `src/services/api.js`. Keep the `data-testid`s on
`VerifyImagePage` and `NdrfVerifyPanel` if you want the browser checks to keep working.
