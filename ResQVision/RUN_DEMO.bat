@echo off
cd /d "%~dp0"
where python >nul 2>nul || (echo Python was not found. Install Python 3.10+ and tick "Add Python to PATH". & pause & exit /b 1)
python run_demo.py
pause
