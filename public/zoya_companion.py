import time
import requests
import os
import platform

# Replace this with the actual URL of your Zoya App if running remotely
# Currently set to the AI Studio dev environment URL for your app
SERVER_URL = "https://ais-dev-kd6nzz4fwiajnbrwwa7pvx-789735568872.asia-southeast1.run.app"
POLL_INTERVAL = 3 # seconds

print("="*50)
print(" Zoya Python Companion App is Running!")
print(f" Connecting to: {SERVER_URL}")
print(" Waiting for system commands from Zoya...")
print("="*50)

def execute_command(cmd):
    system_name = platform.system().lower()
    print(f"\n[!] Received command from Zoya: {cmd}")
    
    if cmd == "shutdown":
        print("Shutting down the system in 10 seconds...")
        if system_name == "windows":
            os.system("shutdown /s /t 10")
        elif system_name == "linux" or system_name == "darwin":
            os.system("sudo shutdown -h +1") # shuts down in 1 minute
            
    elif cmd == "restart":
        print("Restarting the system in 10 seconds...")
        if system_name == "windows":
            os.system("shutdown /r /t 10")
        elif system_name == "linux" or system_name == "darwin":
            os.system("sudo shutdown -r +1")
            
    elif cmd == "sleep":
        print("Putting system to sleep...")
        if system_name == "windows":
            os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        elif system_name == "darwin": # macOS
            os.system("pmset sleepnow")
        elif system_name == "linux":
            os.system("systemctl suspend")
    else:
        print(f"Unknown command: {cmd}")

while True:
    try:
        response = requests.get(f"{SERVER_URL}/api/commands/pending", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data and data.get("command"):
                execute_command(data["command"])
    except requests.exceptions.RequestException:
        pass # Ignore connection errors and keep polling silently
        
    time.sleep(POLL_INTERVAL)
