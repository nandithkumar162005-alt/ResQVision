# ResQVision v4 (read this first)

- **Stream 4 is now the new frontend** (`stream4-dashboard/`): Citizen portal, Rescue (NDRF) dashboard, and a Verify Image page.
  It has its own small backend on port **8004** (`server/`) for accounts, SOS and the photo-check relay. See `stream4-dashboard/README.md`.
- **Start everything:** `RUN_DEMO.bat` (or `python run_demo.py`). Ports: Stream 3 `8003`, Stream 2 `8002`, portal backend `8004`, portals `5173`.
- **Viva photo check:** open `http://localhost:5173/verify`, upload any photo, optionally pick what/where/when. Stream 2 runs the
  image analysis and compares the claim with Open-Meteo weather and USGS earthquakes (needs internet).
  For better results on AI images with no metadata, install the optional classifier once:
  `pip install -r stream2-ml-inference/requirements-authenticity-model.txt` (downloads a model on first use).
- **Logins:** citizen `citizen@resqvision.local` / `CitizenDemo!2026`, officer `officer@ndrf.resqvision.local` / `OfficerDemo!2026`.
- **Tests:** Stream 1: 31, Stream 2: 72, Stream 3: 18, Stream 4 backend: 22 (143 total).
- Older notes below that mention `/citizen` and `/ndrf` describe the previous dashboard.

---

# ResQVision - all 4 streams combined

| Folder | Port | Role |
|---|---|---|
| stream1-data-ingestion | - | watches USGS / Open-Meteo / News, sends events to Stream 2 |
| stream2-ml-inference | 8002 | damage assessment (MOCK_INFERENCE=true), sends result to Stream 3 |
| stream3-dispatch-backend | 8003 | database + NDRF verification + 5 dispatch waves (SQLite, Telegram in mock mode) |
| stream4-dashboard | 5173 | React dashboard, reads http://localhost:8003/api/active-disasters every 10 s |

## Run the demo
ONE CLICK: double-click RUN_DEMO.bat. It installs everything on the first run, starts all streams, fires a demo
earthquake + flood and opens the dashboard and the NDRF page in your browser. Press Enter in its window to stop.
Optional .exe: double-click BUILD_EXE.bat once, then use ResQVision.exe instead of RUN_DEMO.bat
(the .exe is only a launcher - Python 3.10+ and Node 18+ must still be installed on the PC).

Manual way: double-click START_ALL.bat (opens Stream 3, Stream 2 and the dashboard in the right order).
The first run installs packages (a few minutes). Needs Python 3.10+ and Node 18+.
Then double-click FIRE_DEMO_EVENT.bat (sends one demo earthquake + one demo flood).

Dashboard: http://localhost:5173  (the login page is demo-only - pick a role, use Rescue for the dispatch view)
NDRF page: http://localhost:8003/demo - this is the NDRF verification page.
Click Confirm -> waves 2-5 (Medical, Police, Fire, Command) go out. Click Deny -> nothing else is sent.
Dashboard data: http://localhost:8003/api/active-disasters
API docs: http://localhost:8002/docs  and  http://localhost:8003/docs

For the real watcher (not the demo): cd stream1-data-ingestion, then  python main.py

## Changes made to Stream 1 (original kept as dispatcher.py.orig)
- dispatcher.py now sends exactly the 5 contract fields (event_id as UUID, disaster_type earthquake|flood,
  coordinates {lat,lng}, severity_metric, timestamp_utc). Before, Stream 2 rejected everything with 422.
- A 409 from Stream 2 ("already received") is now treated as success.
- Default Stream 2 URL is http://localhost:8002/trigger-assessment (was httpbin.org).
- Added fire_test_event.py and tests/test_dispatcher_payload.py.

## Changes made to Stream 2 and Stream 4
- Stream 2 now forwards disaster_type (earthquake/flood) to Stream 3 so the dashboard can label incidents.
  Stream 3 already accepted it as an optional field. Tests updated (58 pass).
- Stream 4 crashed on real Stream 3 data (it assumed location_name and disaster_type were always present, which
  the mock data does). Fixed with safe labels (src/utils/formatters.js, OverviewPage.jsx). Location falls back to
  the zone coordinates. .env now has VITE_USE_MOCK_DATA=false (set it to true to run the dashboard on its own).

## Known notes
- Start Stream 3 BEFORE Stream 2. If Stream 3 is down when an event arrives, Stream 2 retries 3 times and then
  drops it; re-sending the same event_id is blocked as a duplicate, so use a fresh event (FIRE_DEMO_EVENT does).
- Stream 1 earthquake threshold is 4.5 (spec said 6.0). Fine for a demo; change EARTHQUAKE_MIN_MAGNITUDE to tune.
- Telegram is in mock mode (TELEGRAM_BOT_TOKEN=mock): messages are logged and stored, not sent. Put a real
  bot token and chat ids in stream3-dispatch-backend/.env to send for real.

## Two separate portals (new)
- Citizen Portal: http://localhost:5173/citizen  - safety map, advisories, warning news, SOS. Own login.
- NDRF Command Portal: http://localhost:5173/ndrf - Dispatch Console with Confirm / Deny buttons (releases Waves 2-5), All Disasters, Impact Analytics. Own login.
- The two portals use separate sessions, so signing in to one does not open the other.
- The old http://localhost:8003/demo NDRF page still works as a backup.
- On Vercel, `vercel.json` makes /citizen and /ndrf work when the page is refreshed.

## Image Authenticity Check (new) - "is this photo real or AI-generated?"
- Where: NDRF Command Portal -> Dispatch Console -> "Image Authenticity Check" panel (upload an image).
- API: `POST http://localhost:8002/verify-image` (Stream 2, multipart field `file`). Returns verdict, 0-100 AI probability, reasons.
- What it checks today (works offline):
  1. File metadata: AI-tool names, PNG prompt chunks, C2PA/IPTC "trainedAlgorithmicMedia" markers (e.g. ChatGPT images carry these) -> verdict "AI-generated (declared)".
  2. Camera EXIF (make, model, exposure) -> supports "likely real".
  3. Sensor-noise level and generator-style resolution -> weak hints only.
- Experimental, shown but NOT counted in the verdict: frequency-spectrum and edit/splice (ELA) checks. In our tests they did not separate real from AI images reliably.
- Optional ML layer: `pip install -r stream2-ml-inference/requirements-authenticity-model.txt` adds a pretrained real-vs-AI classifier (needs internet once). This layer is NOT tested yet.
- Honest limit: a screenshot or re-saved AI image with its metadata stripped shows "Cannot tell - needs human review" unless the ML layer is installed. It is a decision aid, never a replacement for NDRF ground confirmation.
- Tests: `cd stream2-ml-inference && python -m pytest` -> 65 tests (7 new for this feature).
