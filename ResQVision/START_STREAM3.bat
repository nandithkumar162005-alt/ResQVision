@echo off
cd /d "%~dp0stream3-dispatch-backend"
if not exist .venv ( python -m venv .venv && .venv\Scripts\pip install -r requirements.txt )
.venv\Scripts\uvicorn app.main:app --port 8003
