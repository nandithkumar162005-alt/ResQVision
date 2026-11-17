@echo off
rem Opens Stream 3, Stream 2 and the dashboard, each in its own window (Stream 3, Stream 2, portal backend, portals), in the right order.
start "Stream 3 - Dispatch" cmd /k "%~dp0START_STREAM3.bat"
timeout /t 8 >nul
start "Stream 2 - ML" cmd /k "%~dp0START_STREAM2.bat"
timeout /t 5 >nul
start "Layer 3 - Portal backend" cmd /k "%~dp0START_LAYER3.bat"
timeout /t 4 >nul
start "Stream 4 - Portals" cmd /k "%~dp0START_STREAM4.bat"
echo.
echo When all three windows say they are running, double-click FIRE_DEMO_EVENT.bat
echo Portals: http://localhost:5173   Verify an image: http://localhost:5173/verify
echo NDRF page: http://localhost:8003/demo
pause
