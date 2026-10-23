"""
Demo helper: sends one earthquake and one flood through the REAL dispatcher
to Stream 2 (so you don't have to wait for a real disaster).

Usage:  python fire_test_event.py            (earthquake + flood)
        python fire_test_event.py quake      (earthquake only)
        python fire_test_event.py flood      (flood only)
Every run uses fresh event ids so Stream 2 does not reject them as duplicates.
"""
import asyncio, sys, time
from datetime import datetime, timezone

from dispatcher import Dispatcher, build_stream2_payload
from schemas import DisasterEvent, make_event_id


def make(kind: str) -> DisasterEvent:
    stamp = str(int(time.time() * 1000))
    if kind == "quake":
        return DisasterEvent(
            event_id=make_event_id("DEMO", "quake-" + stamp), source="DEMO", source_event_id="quake-" + stamp,
            event_type="earthquake", severity=6.8, latitude=19.0760, longitude=72.8777,
            location_name="Mumbai (demo)", timestamp_utc=datetime.now(timezone.utc))
    return DisasterEvent(
        event_id=make_event_id("DEMO", "flood-" + stamp), source="DEMO", source_event_id="flood-" + stamp,
        event_type="rainfall", severity=55.0, latitude=17.3850, longitude=78.4867,
        location_name="Hyderabad (demo)", timestamp_utc=datetime.now(timezone.utc))


async def main():
    kinds = ["quake", "flood"] if len(sys.argv) < 2 else [sys.argv[1]]
    events = [make(k) for k in kinds]
    for e in events:
        print("Sending:", build_stream2_payload(e))
    d = Dispatcher()
    print(await d.dispatch(events))
    await d.close()

asyncio.run(main())
