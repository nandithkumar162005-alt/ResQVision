@echo off
cd /d "%~dp0stream4-dashboard"
if not exist node_modules ( npm install )
npm run dev -- --port 5173
