@echo off
chcp 65001 >nul
title KabanchikLauncher Installer
color 5F
echo.
echo   *** KabanchikLauncher Installer ***
echo.
echo   Запускаем установщик...
echo.
PowerShell -NoProfile -ExecutionPolicy Bypass -File "%~dp0KabanchikInstaller.ps1"
if %errorlevel% neq 0 (
    echo.
    echo   Ошибка! Попробуй запустить от имени администратора.
    pause
)
