@echo off
title Center Manager Installer Builder
cd /d "%~dp0.."
echo.
echo ========================================
echo   Building Center Manager Installer
echo ========================================
echo.
C:\Users\ACER\AppData\Local\Programs\Python\Python313\python.exe installer\build_installer.py
echo.
pause
