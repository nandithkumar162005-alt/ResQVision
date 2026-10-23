@echo off
cd /d "%~dp0stream1-data-ingestion"
if not exist .venv ( python -m venv .venv && .venv\Scripts\pip install -r requirements.txt )
.venv\Scripts\python fire_test_event.py %*
pause
