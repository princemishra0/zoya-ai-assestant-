#!/bin/bash
# ========================================================
#   Zoya AI Assistant - Linux Setup & Desktop Shortcut Installer
# ========================================================

set -e

APP_URL="https://ais-dev-kd6nzz4fwiajnbrwwa7pvx-789735568872.asia-southeast1.run.app"
INSTALL_DIR="$HOME/.zoya"

# Detect real Desktop directory (supports localized Ubuntu/Debian/Arch/Fedora desktop folders)
if command -v xdg-user-dir >/dev/null 2>&1; then
    DESKTOP_DIR="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
else
    DESKTOP_DIR="$HOME/Desktop"
fi

APPS_DIR="$HOME/.local/share/applications"

echo "========================================================"
echo "    🚀 Installing Zoya Desktop Shortcut & Assistant... "
echo "========================================================"

mkdir -p "$INSTALL_DIR"
mkdir -p "$APPS_DIR"
mkdir -p "$DESKTOP_DIR"

# 1. Download App Icon
echo "[+] Downloading Zoya application icon..."
if command -v curl >/dev/null 2>&1; then
    curl -sSL "$APP_URL/zoya_icon.jpg" -o "$INSTALL_DIR/zoya_icon.jpg" 2>/dev/null || true
elif command -v wget >/dev/null 2>&1; then
    wget -q "$APP_URL/zoya_icon.jpg" -O "$INSTALL_DIR/zoya_icon.jpg" 2>/dev/null || true
fi

ICON_PATH="$INSTALL_DIR/zoya_icon.jpg"
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="applications-multimedia"
fi

# 2. Create Desktop Shortcut on user's Desktop
echo "[+] Creating Desktop Shortcut at $DESKTOP_DIR/Zoya.desktop..."
cat << EOF > "$DESKTOP_DIR/Zoya.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Zoya AI Companion
GenericName=AI Voice Assistant
Comment=Zoya AI Realtime Voice Companion & Assistant
Exec=sh -c "google-chrome --app=$APP_URL || chromium-browser --app=$APP_URL || chromium --app=$APP_URL || msedge --app=$APP_URL || xdg-open $APP_URL"
Icon=$ICON_PATH
Terminal=false
StartupNotify=true
Categories=AudioVideo;Utility;Network;
Actions=NewWindow;

[Desktop Action NewWindow]
Name=Open in New Window
Exec=xdg-open $APP_URL
EOF

chmod +x "$DESKTOP_DIR/Zoya.desktop"

# Trust the desktop launcher for modern GNOME/Ubuntu desktop environments
if command -v gio >/dev/null 2>&1; then
    gio set "$DESKTOP_DIR/Zoya.desktop" metadata::trusted true 2>/dev/null || true
fi

# 3. Add to system Applications Launcher Menu
echo "[+] Adding Zoya to system Application Launcher Menu..."
cp "$DESKTOP_DIR/Zoya.desktop" "$APPS_DIR/zoya.desktop"
chmod +x "$APPS_DIR/zoya.desktop"
if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$APPS_DIR" 2>/dev/null || true
fi

# 4. Set up Python Voice Shutdown Companion
echo "[+] Setting up background Python Companion..."
cat << 'EOF' > "$INSTALL_DIR/zoya_companion.py"
import time
import requests
import os
import platform

SERVER_URL = "__SERVER_URL__"
POLL_INTERVAL = 3

print("="*50)
print(" Zoya Python Companion is running in background!")
print(f" Connected to: {SERVER_URL}")
print("="*50)

def execute_command(cmd):
    system_name = platform.system().lower()
    print(f"\n[!] Executing Zoya system command: {cmd}")
    if cmd == "shutdown":
        if system_name == "windows":
            os.system("shutdown /s /t 10")
        else:
            os.system("sudo shutdown -h +1")
    elif cmd == "restart":
        if system_name == "windows":
            os.system("shutdown /r /t 10")
        else:
            os.system("sudo shutdown -r +1")
    elif cmd == "sleep":
        if system_name == "windows":
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        elif system_name == "darwin":
            os.system("pmset sleepnow")
        else:
            os.system("systemctl suspend")

while True:
    try:
        res = requests.get(f"{SERVER_URL}/api/commands/pending", timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data and data.get("command"):
                execute_command(data["command"])
    except Exception:
        pass
    time.sleep(POLL_INTERVAL)
EOF

sed -i "s|__SERVER_URL__|$APP_URL|g" "$INSTALL_DIR/zoya_companion.py"

# Check Python3 & requests
if command -v python3 >/dev/null 2>&1; then
    python3 -m pip install requests --quiet 2>/dev/null || pip3 install requests --quiet 2>/dev/null || true
fi

# Create companion quick-starter
cat << 'EOF' > "$INSTALL_DIR/start_companion.sh"
#!/bin/bash
python3 "$HOME/.zoya/zoya_companion.py"
EOF
chmod +x "$INSTALL_DIR/start_companion.sh"

echo "========================================================"
echo "    ✨ Setup Completed Successfully!                   "
echo "========================================================"
echo " [✓] 'Zoya.desktop' shortcut is now directly on your Desktop!"
echo " [✓] Zoya has been added to your OS Applications Menu."
echo " [✓] Python shutdown companion installed at ~/.zoya"
echo "========================================================"
