@echo off
title Zoya AI Companion
echo ========================================================
echo   Starting Zoya AI Companion - Dedicated Desktop Mode
echo ========================================================
set URL=https://ais-dev-kd6nzz4fwiajnbrwwa7pvx-789735568872.asia-southeast1.run.app

where msedge >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Launching via Microsoft Edge App Mode...
    start "" msedge --app="%URL%"
    exit /b
)

where chrome >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Launching via Google Chrome App Mode...
    start "" chrome --app="%URL%"
    exit /b
)

echo Opening default browser...
start "" "%URL%"
exit /b
