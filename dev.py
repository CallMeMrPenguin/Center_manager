# -*- coding: utf-8 -*-
"""
DEV LAUNCHER -- Center Manager App
Starts both servers with hot-reload:
  FastAPI backend  -> http://127.0.0.1:8000  (reloads on .py changes)
  Vite dev server  -> http://localhost:5173   (HMR on .tsx/.ts/.css changes)

Usage: python dev.py
Then open: http://localhost:5173 in any browser.
"""

import subprocess
import sys
import os
import signal
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT, "frontend")
PYTHON = sys.executable

processes = []

def start_backend():
    print("Starting FastAPI backend on http://local.centermanager.edu:8000 (0.0.0.0:8000) ...")
    proc = subprocess.Popen(
        [
            PYTHON, "-m", "uvicorn",
            "backend.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--reload-dir", os.path.join(ROOT, "backend"),
            "--log-level", "info",
        ],
        cwd=ROOT,
    )
    processes.append(proc)
    return proc

def start_frontend():
    print("Starting Vite dev server on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
    )
    processes.append(proc)
    return proc

def shutdown(signum=None, frame=None):
    print("\nShutting down dev servers...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    time.sleep(0.5)
    for p in processes:
        try:
            p.kill()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

if __name__ == "__main__":
    print("=" * 55)
    print("  CENTER MANAGER -- Development Mode")
    print("=" * 55)
    print("  Backend:  http://127.0.0.1:8000")
    print("  Frontend: http://localhost:5173  <-- open in browser")
    print("  Press Ctrl+C to stop both servers")
    print("=" * 55)

    backend = start_backend()
    time.sleep(1.5)
    frontend = start_frontend()

    while True:
        time.sleep(1)
        if backend.poll() is not None:
            print("Backend process exited unexpectedly.")
            shutdown()
        if frontend.poll() is not None:
            print("Frontend process exited unexpectedly.")
            shutdown()