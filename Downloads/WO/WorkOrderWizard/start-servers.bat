@echo off
echo Starting WorkOrderWizard servers...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\EDWoo\Downloads\WO\WorkOrderWizard\backend && npm run dev"

timeout /t 3

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d c:\Users\EDWoo\Downloads\WO\WorkOrderWizard\frontend && npm run dev"

echo Servers starting... Check the opened windows for status.
pause
