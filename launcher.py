# -*- coding: utf-8 -*-
"""
CENTER MANAGER -- Lightweight Auto-Updating Desktop Launcher
Automatically pulls latest updates from Git, builds static assets if needed,
and launches the Center Manager application.
"""

import os
import sys
import subprocess
import time
import urllib.request
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))

def log(msg):
    print(f"[CenterManager Launcher] {msg}")

def check_git_updates():
    log("Checking for latest updates from GitHub...")
    try:
        fetch_res = subprocess.run(
            ["git", "fetch", "origin", "main"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=10
        )
        if fetch_res.returncode != 0:
            log("Git fetch skipped or offline mode. Continuing with current version.")
            return False

        status_res = subprocess.run(
            ["git", "status", "-uno"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if "behind" in status_res.stdout or "different" in status_res.stdout:
            log("🚀 New update detected on GitHub! Pulling latest code...")
            pull_res = subprocess.run(
                ["git", "pull", "origin", "main"],
                cwd=ROOT,
                capture_output=True,
                text=True,
                timeout=30
            )
            if pull_res.returncode == 0:
                log("✨ App updated successfully to latest commit!")
                return True
            else:
                log(f"Git pull warning: {pull_res.stderr}")
        else:
            log("✅ App is already at the latest version.")
    except Exception as e:
        log(f"Network/Offline mode: {e}")
    return False

def ensure_frontend_build():
    dist_dir = os.path.join(ROOT, "frontend", "dist")
    index_html = os.path.join(dist_dir, "index.html")
    
    if not os.path.exists(index_html):
        log("Building frontend static assets (npm run build)...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=os.path.join(ROOT, "frontend"), check=True)
            log("Frontend built successfully!")
        except Exception as e:
            log(f"Warning: Could not build frontend: {e}")

def launch_app():
    log("Launching Center Manager application...")
    main_script = os.path.join(ROOT, "main.py")
    python_cmd = sys.executable
    
    # Launch main.py
    proc = subprocess.Popen([python_cmd, main_script], cwd=ROOT)
    log("Server running. Enjoy Center Manager!")
    return proc

def main():
    print("=" * 60)
    print("    CENTER MANAGER APP -- LIGHTWEIGHT AUTO-UPDATER")
    print("=" * 60)
    
    # 1. Pull updates from GitHub
    updated = check_git_updates()
    
    # 2. Build frontend if needed
    if updated or not os.path.exists(os.path.join(ROOT, "frontend", "dist", "index.html")):
        ensure_frontend_build()
        
    # 3. Launch App
    proc = launch_app()
    
    try:
        proc.wait()
    except KeyboardInterrupt:
        proc.terminate()

if __name__ == "__main__":
    main()
