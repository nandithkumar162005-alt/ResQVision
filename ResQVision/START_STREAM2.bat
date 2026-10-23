@echo off
cd /d "%~dp0stream2-ml-inference"
if not exist .venv ( python -m venv .venv && .venv\Scripts\pip install fastapi uvicorn pydantic pydantic-settings python-dotenv httpx tenacity numpy scipy scikit-learn loguru shapely pytest pytest-asyncio )
.venv\Scripts\uvicorn app.main:app --port 8002
