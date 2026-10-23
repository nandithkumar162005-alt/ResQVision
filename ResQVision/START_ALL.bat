@echo off
rem Opens Stream 3, Stream 2 and the dashboard, each in its own window, in the right order.
start "Stream 3 - Dispatch" cmd /k "%~dp0START_STREAM3.bat"
timeout /t 8 >nul
start "Stream 2 - ML" cmd /k "%~dp0START_STREAM2.bat"
timeout /t 5 >nul
start "Stream 4 - Dashboard" cmd /k "%~dp0START_STREAM4.bat"
echo.
echo When all three windows say they are running, double-click FIRE_DEMO_EVENT.bat
echo Dashboard: http://localhost:5173   (login page is demo-only: pick any role)
echo NDRF page: http://localhost:8003/demo
pause
