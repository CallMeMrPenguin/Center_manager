import os
import sys
import time
import threading
import urllib.request
import uvicorn

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

# Add backend directory to path so imports inside backend resolve correctly
sys.path.append(os.path.join(ROOT, "backend"))
sys.path.insert(0, ROOT)

def get_app_version() -> str:
    try:
        with open(os.path.join(ROOT, "VERSION"), "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return "?"

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

def main():
    version = get_app_version()

    # 1. Clean up any leftover server process holding port 8000
    kill_port_8000()

    # 2. Determine target URL (Vite DEV server or Built Backend)
    url = "http://localhost:8000"
    try:
        urllib.request.urlopen("http://localhost:5173", timeout=0.3)
        url = "http://localhost:5173"
        print("Vite development server detected. Running in DEV mode.")
    except Exception:
        print("Vite dev server not found. Running in PRODUCTION mode.")

    print("\n" + "=" * 55)
    print(f"  CENTER MANAGER v{version} IS RUNNING")
    print(f"  Web URL: {url} (or http://127.0.0.1:8000)")
    print("  Keep this terminal window open while using the app.")
    print("  Press Ctrl+C to stop the server.")
    print("=" * 55 + "\n")

    # 3. Start silent background update check (non-blocking)
    try:
        from updater import background_check_on_startup
        background_check_on_startup()
    except Exception:
        pass  # Never crash startup due to updater issues

    # 4. Run uvicorn FastAPI server
    backend_dir = os.path.join(ROOT, "backend")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=[backend_dir], log_level="warning")

if __name__ == "__main__":
    main()
