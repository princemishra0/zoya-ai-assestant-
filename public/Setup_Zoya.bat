@echo off
title Zoya AI Assistant - Windows Setup & Desktop Shortcut Installer
color 0b
echo ========================================================
echo     Zoya AI Assistant - Automated Windows Setup
echo ========================================================
echo.

set APP_URL=https://ais-dev-kd6nzz4fwiajnbrwwa7pvx-789735568872.asia-southeast1.run.app
set INSTALL_DIR=%USERPROFILE%\.zoya
set DESKTOP_DIR=%USERPROFILE%\Desktop

:: Create Zoya working directory
echo [*] Creating Zoya directory at %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Download or extract Zoya icon
echo [*] Fetching Zoya App Icon...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%APP_URL%/favicon.ico' -OutFile '%INSTALL_DIR%\zoya.ico' -TimeoutSec 5 } catch {}" 2>nul

:: 1. Create Windows Desktop .LNK Shortcut (Native Windows Application Shortcut)
echo [*] Creating Desktop Shortcut 'Zoya AI Companion.lnk'...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$DesktopPath = [Environment]::GetFolderPath('Desktop'); " ^
    "$Shortcut = $WshShell.CreateShortcut($DesktopPath + '\Zoya AI Companion.lnk'); " ^
    "if (Get-Command msedge -ErrorAction SilentlyContinue) { " ^
    "    $Shortcut.TargetPath = (Get-Command msedge).Source; " ^
    "    $Shortcut.Arguments = '--app=""%APP_URL%""'; " ^
    "} elseif (Get-Command chrome -ErrorAction SilentlyContinue) { " ^
    "    $Shortcut.TargetPath = (Get-Command chrome).Source; " ^
    "    $Shortcut.Arguments = '--app=""%APP_URL%""'; " ^
    "} else { " ^
    "    $Shortcut.TargetPath = '%APP_URL%'; " ^
    "} " ^
    "if (Test-Path '%INSTALL_DIR%\zoya.ico') { $Shortcut.IconLocation = '%INSTALL_DIR%\zoya.ico,0' }; " ^
    "$Shortcut.Description = 'Zoya AI Realtime Voice Companion & Assistant'; " ^
    "$Shortcut.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$Shortcut.Save();"

:: 2. Create Windows .URL Desktop Shortcut (Always 100%% works even on restricted PCs)
echo [*] Creating Desktop Shortcut 'Zoya AI.url'...
(
echo [{000214A0-0000-0000-C000-000000000046}]
echo Prop3=19,11
echo [InternetShortcut]
echo IDList=
echo URL=%APP_URL%
echo IconIndex=0
echo IconFile=%INSTALL_DIR%\zoya.ico
) > "%DESKTOP_DIR%\Zoya AI.url"

:: 3. Create Desktop Batch Launcher
echo [*] Creating Desktop Launcher 'Zoya AI Assistant.bat'...
(
echo @echo off
echo title Zoya AI Companion
echo where msedge ^>nul 2^>^&1
echo if %%ERRORLEVEL%% EQU 0 ^(
echo     start "" msedge --app="%APP_URL%"
echo     exit /b
echo ^)
echo where chrome ^>nul 2^>^&1
echo if %%ERRORLEVEL%% EQU 0 ^(
echo     start "" chrome --app="%APP_URL%"
echo     exit /b
echo ^)
echo start "" "%APP_URL%"
echo exit /b
) > "%DESKTOP_DIR%\Zoya AI Assistant.bat"

:: 4. Set up Python Companion Agent
echo [*] Configuring Python Companion for Voice Shutdown/Restart...
(
echo import time
echo import requests
echo import os
echo import platform
echo.
echo SERVER_URL = "%APP_URL%"
echo POLL_INTERVAL = 3
echo.
echo print("="*50^)
echo print(" Zoya Companion is listening for system commands..."^)
echo print("="*50^)
echo.
echo def execute_command(cmd^):
echo     system_name = platform.system(^).lower(^)
echo     print(f"\n[!] Executing Zoya system command: {cmd}"^)
echo     if cmd == "shutdown":
echo         os.system("shutdown /s /t 10"^)
echo     elif cmd == "restart":
echo         os.system("shutdown /r /t 10"^)
echo     elif cmd == "sleep":
echo         os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0"^)
echo.
echo while True:
echo     try:
echo         res = requests.get(f"{SERVER_URL}/api/commands/pending", timeout=5^)
echo         if res.status_code == 200:
echo             data = res.json(^)
echo             if data and data.get("command"^):
echo                 execute_command(data["command"]^)
echo     except Exception:
echo         pass
echo     time.sleep(POLL_INTERVAL^)
) > "%INSTALL_DIR%\zoya_companion.py"

:: Check Python and install requests module
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [+] Python detected. Ensuring 'requests' library is installed...
    python -m pip install requests --quiet 2>nul
) else (
    echo [!] Note: Python not found. Voice shutdown works when Python is installed.
)

:: 5. Create Desktop Companion Shortcut
(
echo @echo off
echo title Zoya Voice Companion
echo python "%INSTALL_DIR%\zoya_companion.py"
echo pause
) > "%DESKTOP_DIR%\Start Zoya Companion.bat"

echo.
echo ========================================================
echo     ✨ Desktop Shortcuts Created Successfully!
echo ========================================================
echo  [✓] 'Zoya AI Companion.lnk' is now on your Desktop!
echo  [✓] 'Zoya AI.url' (1-Click Web Shortcut) is on your Desktop!
echo  [✓] 'Start Zoya Companion.bat' (PC Controller) is ready!
echo ========================================================
echo.
set /p LAUNCH="Do you want to launch Zoya right now? (Y/N): "
if /i "%LAUNCH%"=="Y" (
    start "" "%DESKTOP_DIR%\Zoya AI Companion.lnk" 2>nul || start "" "%DESKTOP_DIR%\Zoya AI Assistant.bat"
)
exit /b
