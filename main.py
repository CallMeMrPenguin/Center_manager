import os
# CRITICAL: Must be set BEFORE 'import webview' loads the WebView2 DLL.
# Without this, Vietnamese IME (Unikey, EVKey, etc.) will not work in the app window.
os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = ' '.join([
    '--enable-features=msEdgeIMEComposition',
    '--disable-features=RendererCodeIntegrity',
    '--lang=vi',
])

import sys
import threading
import time
import urllib.request
import uvicorn
import webview

ROOT = os.path.dirname(os.path.abspath(__file__))

# Add backend directory to path so imports inside backend resolve correctly
sys.path.append(os.path.join(ROOT, "backend"))

def kill_port_8000():
    """Kills any process currently occupying port 8000 (e.g. leftover zombie server)."""
    try:
        import socket
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', 8000)) == 0:
                print("Port 8000 is occupied by an old process. Cleaning up...")
                import subprocess
                subprocess.run(
                    'powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue).OwningProcess -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue"',
                    shell=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                time.sleep(0.5)
    except Exception:
        pass

def ensure_hosts_entry():
    """Checks and attempts to add 127.0.0.1 local.centermanager.edu to Windows hosts file."""
    if sys.platform != "win32":
        return
    hosts_path = r"C:\Windows\System32\drivers\etc\hosts"
    entry = "127.0.0.1 local.centermanager.edu\n"
    try:
        if os.path.exists(hosts_path):
            with open(hosts_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            if "local.centermanager.edu" not in content:
                print("Adding local.centermanager.edu to hosts file...")
                with open(hosts_path, "a", encoding="utf-8") as f:
                    f.write(f"\n# Center Manager local domain\n{entry}")
    except Exception as e:
        print(f"Notice: Could not write to hosts file automatically: {e}")
        print("To enable http://local.centermanager.edu:8000 without port errors, run terminal as Administrator or add '127.0.0.1 local.centermanager.edu' to C:\\Windows\\System32\\drivers\\etc\\hosts")

def open_native_app_window(url: str):
    """Launches application in a clean standalone Desktop App Window (--app mode)."""
    time.sleep(1.0)
    if sys.platform == "win32":
        app_cmds = [
            ["msedge", f"--app={url}"],
            [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", f"--app={url}"],
            [r"C:\Program Files\Microsoft\Edge\Application\msedge.exe", f"--app={url}"],
            ["chrome", f"--app={url}"],
            [r"C:\Program Files\Google\Chrome\Application\chrome.exe", f"--app={url}"]
        ]
        for cmd in app_cmds:
            try:
                proc = subprocess.Popen(cmd)
                if proc.poll() is None or proc.returncode is None:
                    return
            except Exception:
                continue
    try:
        import webbrowser
        webbrowser.open(url)
    except Exception:
        pass

def run_backend():
    backend_dir = os.path.join(ROOT, "backend")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, log_level="warning")

def main():
    # 0. Clean up any leftover server process holding port 8000
    kill_port_8000()

    # Always target local production backend server URL
    url = "http://127.0.0.1:8000"

    is_server_only = "--background" in sys.argv or "--server" in sys.argv

    # 1. Start FastAPI backend in a background daemon thread
    server_thread = threading.Thread(target=run_backend, daemon=True)
    server_thread.start()

    if not is_server_only:
        # 2. Open Standalone Desktop Application Window
        open_native_app_window(url)

    # Keep main thread alive
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
