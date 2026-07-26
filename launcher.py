# -*- coding: utf-8 -*-
"""
CENTER MANAGER -- Silent Auto-Updating Desktop Launcher
Runs completely silently in the background without any command prompt window popping up.
"""

import os
import sys
import subprocess
import shutil
import threading

# Find root directory properly whether running as python script or frozen PyInstaller exe
if getattr(sys, 'frozen', False):
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(sys.executable)))
else:
    ROOT = os.path.dirname(os.path.abspath(__file__))

NO_WINDOW = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0

def find_system_python():
    """Finds the system pythonw / py / python binary on Windows to avoid PyInstaller recursive execution."""
    for py_bin in ["pythonw.exe", "pythonw", "py.exe", "py", "python.exe", "python"]:
        found = shutil.which(py_bin)
        if found:
            return found
    return sys.executable

def check_git_updates_silent():
    """Background update checker - completely silent, runs in background thread."""
    try:
        fetch_res = subprocess.run(
            ["git", "fetch", "origin", "main"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=10,
            creationflags=NO_WINDOW
        )
        if fetch_res.returncode != 0:
            return

        status_res = subprocess.run(
            ["git", "status", "-uno"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5,
            creationflags=NO_WINDOW
        )
        
        if "behind" in status_res.stdout or "different" in status_res.stdout:
            pull_res = subprocess.run(
                ["git", "pull", "origin", "main"],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30,
                creationflags=NO_WINDOW
            )
            if pull_res.returncode == 0:
                ensure_frontend_build_silent()
    except Exception:
        pass

def ensure_frontend_build_silent():
    """Builds static assets silently if missing."""
    dist_dir = os.path.join(ROOT, "frontend", "dist")
    index_html = os.path.join(dist_dir, "index.html")
    
    if not os.path.exists(index_html):
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        try:
            subprocess.run(
                [npm_cmd, "run", "build"],
                cwd=os.path.join(ROOT, "frontend"),
                capture_output=True,
                creationflags=NO_WINDOW
            )
        except Exception:
            pass

def main():
    # 1. Start background update check in a separate silent thread
    threading.Thread(target=check_git_updates_silent, daemon=True).start()
    
    # 2. Build frontend if completely missing
    dist_dir = os.path.join(ROOT, "frontend", "dist")
    if not os.path.exists(os.path.join(dist_dir, "index.html")):
        ensure_frontend_build_silent()
        
    # 3. Launch main.py using system Python binary
    py_bin = find_system_python()
    main_script = os.path.join(ROOT, "main.py")
    
    subprocess.Popen(
        [py_bin, main_script],
        cwd=ROOT,
        creationflags=NO_WINDOW
    )

if __name__ == "__main__":
    main()
