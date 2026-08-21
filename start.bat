@echo off
title Center Manager Server
cd /d "%~dp0"
echo Starting Center Manager App...

where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    py main.py
) else (
    python main.py
)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Could not start Python. Please ensure Python is installed.
    pause
)
