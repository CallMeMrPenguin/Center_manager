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

def open_browser(url: str):
    """Waits for backend to respond, then opens default browser."""
    time.sleep(1.2)
    try:
        if sys.platform == "win32":
            os.system(f'start {url}')
        else:
            import webbrowser
            webbrowser.open(url)
    except Exception:
        pass

def main():
    # 0. Ensure hosts file entry for local.centermanager.edu
    ensure_hosts_entry()

    # Clean up any leftover server process holding port 8000
    kill_port_8000()

    # Check background mode flag
    is_background = "--background" in sys.argv or "--silent" in sys.argv

    # 1. Determine if Vite dev server is running (Development Mode)
    url = "http://localhost:8000"
    
    try:
        urllib.request.urlopen("http://localhost:5173", timeout=0.3)
        url = "http://localhost:5173"
        print("Vite development server detected. Running in DEV mode.")
    except Exception:
        print("Vite dev server not found. Running in PRODUCTION mode.")

    if not is_background:
        # Open browser in a delayed background thread if not running in silent background mode
        threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    print("\n" + "="*55)
    print("  CENTER MANAGER & TEST FORMATTER IS RUNNING")
    print(f"  Web URL: {url} (or http://127.0.0.1:8000)")
    if is_background:
        print("  Running in BACKGROUND MODE (silent execution).")
    else:
        print("  Keep this window open while using the app.")
    print("  Press Ctrl+C to stop the server.")
    print("="*55 + "\n")

    # 3. Run uvicorn FastAPI server on host 0.0.0.0 to accept local.centermanager.edu and 127.0.0.1
    # Enabled reload=True so backend automatically reloads when python files are modified.
    backend_dir = os.path.join(ROOT, "backend")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[backend_dir], log_level="warning")

if __name__ == "__main__":
    main()
