@echo off
rem Optional: turns the launcher into ResQVision.exe (needs internet once).
cd /d "%~dp0"
python -m pip install pyinstaller
python -m PyInstaller --onefile --name ResQVision run_demo.py
copy /Y dist\ResQVision.exe ResQVision.exe
echo.
echo Done. ResQVision.exe is now in this folder - keep it next to the stream folders and double-click it.
pause
