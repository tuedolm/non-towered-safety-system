@echo off
SETLOCAL EnableDelayedExpansion

REM Non-Towered Airport Safety System Backend Starter Script for Windows
REM This script starts all backend components in the correct order

echo Starting Non-Towered Airport Safety System Backend...

REM Ensure data directory exists
if not exist "data" mkdir data

REM Start Go components (in separate windows)
echo Starting Data Ingestion Service...
cd backend\go\data_ingestion
start "Data Ingestion" cmd /c "go build && data_ingestion.exe && pause"
cd ..\..\..

echo Starting Conflict Detection Engine...
cd backend\go\conflict_detection
start "Conflict Detection" cmd /c "go build && conflict_detection.exe && pause"
cd ..\..\..

REM Start Python components (in separate windows)
echo Starting Airport Intelligence Module...
cd backend\python\airport_intelligence
start "Airport Intelligence" cmd /c "python airport_database.py && pause"
cd ..\..\..

echo Starting Advisory Generation System...
cd backend\python\advisory_generation
start "Advisory Generation" cmd /c "python advisory_engine.py && pause"
cd ..\..\..

echo All backend components started successfully!
echo Close the individual component windows to stop them.

pause 