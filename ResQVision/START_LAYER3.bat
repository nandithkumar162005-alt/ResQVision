@echo off
cd /d "%~dp0stream4-dashboard"
if not exist node_modules ( npm install )
set RESQVISION_API_PORT=8004
node server\index.js
