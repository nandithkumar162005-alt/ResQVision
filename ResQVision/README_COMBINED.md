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
