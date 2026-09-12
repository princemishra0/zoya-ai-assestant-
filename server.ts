import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  getAllMemories,
  addMemory,
  deleteMemory,
} from './server/memory-store';
import {
  buildZoyaSystemInstruction,
  zoyaFunctionDeclarations,
} from './server/zoya-prompt';

const PORT = 3000;
const app = express();
app.use(express.json({ limit: '10mb' }));

// REST APIs
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Zoya AI Assistant',
    owner: 'Prince Mishra',
    model: 'gemini-3.1-flash-live-preview',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

app.get('/api/memories', (req, res) => {
  res.json({
    memories: getAllMemories(),
    owner: 'Prince Mishra',
  });
});

app.post('/api/memories', (req, res) => {
  const { title, fact, category } = req.body;
  if (!title || !fact) {
    return res.status(400).json({ error: 'Title and fact are required' });
  }
  const memory = addMemory(title, fact, category);
  res.json({ success: true, memory });
});

app.delete('/api/memories/:id', (req, res) => {
  const success = deleteMemory(req.params.id);
  res.json({ success });
});

// Dynamic Desktop Launcher Download Endpoints
app.get('/api/launcher/desktop', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const appUrl = `${protocol}://${host}`;
  const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=Zoya AI Companion
Comment=Zoya AI Realtime Voice Companion & Assistant
Exec=sh -c "google-chrome --app=${appUrl} || chromium-browser --app=${appUrl} || chromium --app=${appUrl} || xdg-open ${appUrl}"
Icon=applications-multimedia
Terminal=false
StartupNotify=true
Categories=AudioVideo;Utility;Network;
Actions=NewWindow;

[Desktop Action NewWindow]
Name=Open in New Window
Exec=xdg-open ${appUrl}
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Zoya.desktop"');
  res.setHeader('Content-Type', 'application/x-desktop');
  res.send(desktopContent);
});

app.get('/api/launcher/windows', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const appUrl = `${protocol}://${host}`;
  const batContent = `@echo off
title Zoya AI Companion
echo ========================================================
echo   Starting Zoya AI Companion - Dedicated Desktop Mode
echo ========================================================
set URL=${appUrl}

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
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Launch_Zoya.bat"');
  res.setHeader('Content-Type', 'application/x-bat');
  res.send(batContent);
});

app.get('/api/launcher/windows-url', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const appUrl = `${protocol}://${host}`;
  const urlContent = `[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
[InternetShortcut]
IDList=
URL=${appUrl}
IconIndex=0
HotKey=0
IconFile=${appUrl}/favicon.ico
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Zoya.url"');
  res.setHeader('Content-Type', 'application/internet-shortcut');
  res.send(urlContent);
});

// Dynamic Setup Script Download Endpoints
app.get('/api/setup/linux', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const appUrl = `${protocol}://${host}`;
  const scriptContent = `#!/bin/bash
# ========================================================
#   Zoya AI Assistant - Linux Setup & Desktop Shortcut Installer
# ========================================================

set -e

APP_URL="${appUrl}"
INSTALL_DIR="$HOME/.zoya"

# Detect real Desktop directory
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
    print(f"\\n[!] Executing Zoya system command: {cmd}")
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
`;
  res.setHeader('Content-Disposition', 'attachment; filename="setup_zoya.sh"');
  res.setHeader('Content-Type', 'application/x-sh');
  res.send(scriptContent);
});

app.get('/api/setup/windows', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const appUrl = `${protocol}://${host}`;
  const batSetup = `@echo off
title Zoya AI Assistant - Windows Setup & Desktop Shortcut Installer
color 0b
echo ========================================================
echo     Zoya AI Assistant - Automated Windows Setup
echo ========================================================
echo.

set APP_URL=${appUrl}
set INSTALL_DIR=%USERPROFILE%\\.zoya
set DESKTOP_DIR=%USERPROFILE%\\Desktop

:: Create Zoya working directory
echo [*] Creating Zoya directory at %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Download Zoya icon
echo [*] Fetching Zoya App Icon...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%APP_URL%/favicon.ico' -OutFile '%INSTALL_DIR%\\zoya.ico' -TimeoutSec 5 } catch {}" 2>nul

:: 1. Create Windows Desktop .LNK Shortcut
echo [*] Creating Desktop Shortcut 'Zoya AI Companion.lnk'...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$WshShell = New-Object -ComObject WScript.Shell; " ^
    "$DesktopPath = [Environment]::GetFolderPath('Desktop'); " ^
    "$Shortcut = $WshShell.CreateShortcut($DesktopPath + '\\Zoya AI Companion.lnk'); " ^
    "if (Get-Command msedge -ErrorAction SilentlyContinue) { " ^
    "    $Shortcut.TargetPath = (Get-Command msedge).Source; " ^
    "    $Shortcut.Arguments = '--app=\"%APP_URL%\"'; " ^
    "} elseif (Get-Command chrome -ErrorAction SilentlyContinue) { " ^
    "    $Shortcut.TargetPath = (Get-Command chrome).Source; " ^
    "    $Shortcut.Arguments = '--app=\"%APP_URL%\"'; " ^
    "} else { " ^
    "    $Shortcut.TargetPath = '%APP_URL%'; " ^
    "} " ^
    "if (Test-Path '%INSTALL_DIR%\\zoya.ico') { $Shortcut.IconLocation = '%INSTALL_DIR%\\zoya.ico,0' }; " ^
    "$Shortcut.Description = 'Zoya AI Realtime Voice Companion & Assistant'; " ^
    "$Shortcut.WorkingDirectory = '%INSTALL_DIR%'; " ^
    "$Shortcut.Save();"

:: 2. Create Windows .URL Desktop Shortcut
echo [*] Creating Desktop Shortcut 'Zoya AI.url'...
(
echo [{000214A0-0000-0000-C000-000000000046}]
echo Prop3=19,11
echo [InternetShortcut]
echo IDList=
echo URL=%APP_URL%
echo IconIndex=0
echo IconFile=%INSTALL_DIR%\\zoya.ico
) > "%DESKTOP_DIR%\\Zoya AI.url"

:: 3. Create Desktop Batch Launcher
echo [*] Creating Desktop Launcher 'Zoya AI Assistant.bat'...
(
echo @echo off
echo title Zoya AI Companion
echo where msedge ^^>nul 2^^>^^&1
echo if %%%%ERRORLEVEL%%%% EQU 0 ^^(
echo     start "" msedge --app="%APP_URL%"
echo     exit /b
echo ^^)
echo where chrome ^^>nul 2^^>^^&1
echo if %%%%ERRORLEVEL%%%% EQU 0 ^^(
echo     start "" chrome --app="%APP_URL%"
echo     exit /b
echo ^^)
echo start "" "%APP_URL%"
echo exit /b
) > "%DESKTOP_DIR%\\Zoya AI Assistant.bat"

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
echo print("="*50^^)
echo print(" Zoya Companion is listening for system commands..."^^)
echo print("="*50^^)
echo.
echo def execute_command(cmd^^):
echo     system_name = platform.system(^^).lower(^^)
echo     print(f"\\n[!] Executing Zoya system command: {cmd}"^^)
echo     if cmd == "shutdown":
echo         os.system("shutdown /s /t 10"^^)
echo     elif cmd == "restart":
echo         os.system("shutdown /r /t 10"^^)
echo     elif cmd == "sleep":
echo         os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0"^^)
echo.
echo while True:
echo     try:
echo         res = requests.get(f"{SERVER_URL}/api/commands/pending", timeout=5^^)
echo         if res.status_code == 200:
echo             data = res.json(^^)
echo             if data and data.get("command"^^):
echo                 execute_command(data["command"]^^)
echo     except Exception:
echo         pass
echo     time.sleep(POLL_INTERVAL^^)
) > "%INSTALL_DIR%\\zoya_companion.py"

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
echo python "%INSTALL_DIR%\\zoya_companion.py"
echo pause
) > "%DESKTOP_DIR%\\Start Zoya Companion.bat"

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
    start "" "%DESKTOP_DIR%\\Zoya AI Companion.lnk" 2>nul || start "" "%DESKTOP_DIR%\\Zoya AI Assistant.bat"
)
exit /b
`;
  res.setHeader('Content-Disposition', 'attachment; filename="Setup_Zoya.bat"');
  res.setHeader('Content-Type', 'application/x-bat');
  res.send(batSetup);
});

// Lazy-initialized Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

interface LiveSessionHolder {
  id: string;
  session: any;
  active: boolean;
  sseResponse?: express.Response;
  clientWs?: WebSocket;
  currentMemories: any[];
  lastActive: number;
}

const activeSessions = new Map<string, LiveSessionHolder>();
const pendingSystemCommands: string[] = [];

function broadcastToSession(holder: LiveSessionHolder, payload: any) {
  const json = JSON.stringify(payload);
  if (holder.clientWs && holder.clientWs.readyState === WebSocket.OPEN) {
    try {
      holder.clientWs.send(json);
    } catch {}
  }
  if (holder.sseResponse && !holder.sseResponse.writableEnded) {
    try {
      holder.sseResponse.write(`data: ${json}\n\n`);
    } catch (e) {
      console.warn(`[Zoya] Failed writing to SSE for session ${holder.id}:`, e);
    }
  }
}

async function createGeminiLiveSession(sessionId: string, personality: any = 'zoya'): Promise<LiveSessionHolder> {
  const currentMemories = getAllMemories();
  const ai = getGeminiClient();

  const holder: LiveSessionHolder = {
    id: sessionId,
    session: null,
    active: true,
    currentMemories,
    lastActive: Date.now(),
  };

  const session = await ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Aoede' },
        },
      },
      systemInstruction: buildZoyaSystemInstruction(currentMemories, personality),
      tools: [{ functionDeclarations: zoyaFunctionDeclarations }],
    },
    callbacks: {
      onopen: () => {
        console.log(`[Zoya] Gemini Live connected for session ${sessionId}`);
        broadcastToSession(holder, { type: 'session_ready' });
      },
      onmessage: async (serverMsg: LiveServerMessage) => {
        if (!holder.active) return;
        holder.lastActive = Date.now();

        // 1. Audio streaming chunk
        const audioChunk =
          serverMsg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioChunk) {
          broadcastToSession(holder, { type: 'audio', data: audioChunk });
        }

        // 2. Interruption signal
        if (serverMsg.serverContent?.interrupted) {
          console.log(`[Zoya] User interrupted speech in session ${sessionId}`);
          broadcastToSession(holder, { type: 'interrupted' });
        }

        // 3. Tool Calls
        if (
          serverMsg.toolCall?.functionCalls &&
          serverMsg.toolCall.functionCalls.length > 0
        ) {
          const functionResponses = [];

          for (const call of serverMsg.toolCall.functionCalls) {
            const callId = call.id;
            const name = call.name;
            const args = (call.args || {}) as any;
            console.log(`[Zoya] Tool call in ${sessionId}: ${name}`, args);

            if (name === 'openWebsite') {
              let targetUrl = args.url || 'https://google.com';
              if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
              }
              const label = args.title || targetUrl;

              broadcastToSession(holder, {
                type: 'action',
                action: 'openWebsite',
                url: targetUrl,
                title: label,
                callId,
              });

              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    status: 'opened',
                    url: targetUrl,
                    title: label,
                    message: `Opened ${label} on Prince's browser screen.`,
                  },
                },
              });
            } else if (name === 'saveUserMemory') {
              const newMem = addMemory(args.title, args.fact, args.category);
              broadcastToSession(holder, {
                type: 'memory_added',
                memory: newMem,
                callId,
              });

              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    status: 'saved',
                    id: newMem.id,
                    title: newMem.title,
                    message: `Successfully locked memory: "${newMem.title}" - "${newMem.fact}"`,
                  },
                },
              });
            } else if (name === 'getSavedMemories') {
              let list = getAllMemories();
              if (args.category && args.category !== 'all') {
                const cat = args.category.toLowerCase();
                list = list.filter((m) => m.category === cat);
              }

              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    status: 'success',
                    count: list.length,
                    memories: list,
                  },
                },
              });
            } else if (name === 'deleteUserMemory') {
              const deleted = deleteMemory(args.identifier);
              broadcastToSession(holder, {
                type: 'memory_deleted',
                identifier: args.identifier,
                success: deleted,
              });

              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    status: deleted ? 'deleted' : 'not_found',
                    identifier: args.identifier,
                  },
                },
              });
            } else if (name === 'getCurrentTimeAndDate') {
              const now = new Date();
              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    date: now.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }),
                    time: now.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    }),
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  },
                },
              });
            } else if (name === 'executeSystemCommand') {
              const cmd = args.command;
              pendingSystemCommands.push(cmd);
              broadcastToSession(holder, {
                type: 'action',
                action: 'systemCommand',
                command: cmd,
                callId,
              });
              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: {
                    status: 'success',
                    message: `Sent ${cmd} command to Prince's local companion app.`,
                  },
                },
              });
            } else {
              functionResponses.push({
                id: callId,
                name: name,
                response: {
                  output: { error: `Function ${name} not recognized` },
                },
              });
            }
          }

          try {
            session.sendToolResponse({ functionResponses });
          } catch (err) {
            console.error('[Zoya] Failed to send tool responses:', err);
          }
        }
      },
      onclose: (e) => {
        console.log(`[Zoya] Gemini Live session closed for ${sessionId}:`, e?.reason);
        broadcastToSession(holder, { type: 'session_closed', reason: e?.reason });
        cleanupSession(sessionId);
      },
      onerror: (err) => {
        console.error(`[Zoya] Gemini Live session error for ${sessionId}:`, err);
        broadcastToSession(holder, {
          type: 'error',
          message: err?.message || 'Gemini Live encountered an error',
        });
      },
    },
  });

  holder.session = session;
  activeSessions.set(sessionId, holder);
  return holder;
}

function cleanupSession(sessionId: string) {
  const holder = activeSessions.get(sessionId);
  if (!holder) return;
  holder.active = false;
  if (holder.sseResponse && !holder.sseResponse.writableEnded) {
    try {
      holder.sseResponse.end();
    } catch {}
  }
  if (holder.clientWs && holder.clientWs.readyState === WebSocket.OPEN) {
    try {
      holder.clientWs.close();
    } catch {}
  }
  if (holder.session) {
    try {
      holder.session.close();
    } catch {}
  }
  activeSessions.delete(sessionId);
}

// REST & SSE Live Endpoints
app.post('/api/live/session', async (req, res) => {
  try {
    const { personality } = req.body || {};
    const sessionId = 'zoya_' + Math.random().toString(36).substring(2, 12);
    const holder = await createGeminiLiveSession(sessionId, personality || 'zoya');
    res.json({
      success: true,
      sessionId,
      memories: holder.currentMemories,
      owner: 'Prince Mishra',
    });
  } catch (err: any) {
    console.error('[Zoya] Failed to initialize live session:', err);
    res.status(500).json({
      success: false,
      error:
        err?.message ||
        'Could not initialize Gemini Live session. Verify GEMINI_API_KEY.',
    });
  }
});

app.get('/api/live/stream', (req, res) => {
  const sessionId = req.query.sessionId as string;
  const holder = activeSessions.get(sessionId);
  if (!holder) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  holder.sseResponse = res;
  holder.lastActive = Date.now();

  // Send initial data
  res.write(
    `data: ${JSON.stringify({
      type: 'init',
      memories: holder.currentMemories,
      owner: 'Prince Mishra',
    })}\n\n`
  );

  // If Gemini Live is connected, notify ready
  if (holder.session) {
    res.write(`data: ${JSON.stringify({ type: 'session_ready' })}\n\n`);
  }

  req.on('close', () => {
    console.log(`[Zoya] SSE client disconnected from session ${sessionId}`);
    if (holder.sseResponse === res) {
      delete holder.sseResponse;
    }
  });
});

app.post('/api/live/input', (req, res) => {
  const { sessionId, type, data } = req.body;
  const holder = activeSessions.get(sessionId);
  if (!holder || !holder.session) {
    return res.status(404).json({ error: 'Session not active' });
  }

  holder.lastActive = Date.now();

  if (type === 'audio' && data) {
    try {
      holder.session.sendRealtimeInput({
        audio: {
          data,
          mimeType: 'audio/pcm;rate=16000',
        },
      });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  } else if (type === 'video' && data) {
    try {
      holder.session.sendRealtimeInput({
        video: {
          data,
          mimeType: 'image/jpeg',
        },
      });
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.json({ ok: true });
});

app.post('/api/live/close', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) {
    cleanupSession(sessionId);
  }
  res.json({ ok: true });
});

// Endpoint for Python Companion app to poll commands
app.get('/api/commands/pending', (req, res) => {
  const command = pendingSystemCommands.shift();
  res.json({ command: command || null });
});

// Periodic inactive session garbage collection
setInterval(() => {
  const now = Date.now();
  for (const [id, holder] of activeSessions.entries()) {
    if (
      now - holder.lastActive > 180000 &&
      !holder.clientWs &&
      !holder.sseResponse
    ) {
      console.log(`[Zoya] Garbage-collecting inactive session: ${id}`);
      cleanupSession(id);
    }
  }
}, 60000);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', 'http://localhost:3000');
  const existingSessionId = url.searchParams.get('sessionId');

  let holder: LiveSessionHolder | undefined;
  if (existingSessionId && activeSessions.has(existingSessionId)) {
    holder = activeSessions.get(existingSessionId);
    if (holder) {
      holder.clientWs = clientWs;
      clientWs.send(
        JSON.stringify({
          type: 'init',
          memories: holder.currentMemories,
          owner: 'Prince Mishra',
        })
      );
      if (holder.session) {
        clientWs.send(JSON.stringify({ type: 'session_ready' }));
      }
    }
  } else {
    const sessionId = 'zoya_' + Math.random().toString(36).substring(2, 12);
    try {
      holder = await createGeminiLiveSession(sessionId);
      holder.clientWs = clientWs;
      clientWs.send(
        JSON.stringify({
          type: 'init',
          memories: holder.currentMemories,
          owner: 'Prince Mishra',
        })
      );
    } catch (err: any) {
      clientWs.send(JSON.stringify({ type: 'error', message: err?.message }));
      return;
    }
  }

  clientWs.on('message', (raw: any) => {
    if (!holder || !holder.session) return;
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'audio' && msg.data) {
        holder.session.sendRealtimeInput({
          audio: {
            data: msg.data,
            mimeType: 'audio/pcm;rate=16000',
          },
        });
      }
    } catch (err) {
      console.error('[Zoya] Error parsing WS message:', err);
    }
  });

  clientWs.on('close', () => {
    if (holder && holder.clientWs === clientWs) {
      delete holder.clientWs;
      setTimeout(() => {
        if (!holder?.clientWs && !holder?.sseResponse) {
          cleanupSession(holder?.id || '');
        }
      }, 15000);
    }
  });
});

// Vite middleware or static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zoya] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[Zoya] Server startup failed:', err);
});
