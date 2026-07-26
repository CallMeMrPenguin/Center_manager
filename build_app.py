# -*- coding: utf-8 -*-
"""
CENTER MANAGER -- Portable Executable Builder Script
Bundles Python backend, FastAPI, SQLite, and React frontend into a 100% standalone
executable that runs on ANY Windows PC without needing Python, Node, or Git installed.
"""

import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))

def build_executable():
    print("=" * 60)
    print("Building Standalone Portable CenterManager.exe via PyInstaller...")
    print("=" * 60)
    
    # 1. Build frontend static production bundle
    frontend_dir = os.path.join(ROOT, "frontend")
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
    except Exception as e:
        print(f"Warning building frontend: {e}")
    
    # 2. Bundle backend, frontend static files, DB, and configs into standalone EXE folder
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--noconsole",
        "--name=CenterManager",
        f"--add-data={os.path.join(ROOT, 'backend')};backend",
        f"--add-data={os.path.join(ROOT, 'frontend', 'dist')};frontend/dist",
        f"--add-data={os.path.join(ROOT, 'unit_config.json')};.",
        f"--add-data={os.path.join(ROOT, 'exercise_config.json')};.",
        f"--add-data={os.path.join(ROOT, 'config.json')};.",
        f"--add-data={os.path.join(ROOT, 'prompts.json')};.",
        f"--add-data={os.path.join(ROOT, 'test_formatter.db')};.",
        os.path.join(ROOT, "main.py")
    ]
    
    res = subprocess.run(cmd, cwd=ROOT)
    if res.returncode == 0:
        print("Success! Standalone Portable CenterManager.exe created in dist/CenterManager/")
        create_desktop_shortcut()
    else:
        print(f"Build failed with exit code: {res.returncode}")

def create_desktop_shortcut():
    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    exe_path = os.path.join(ROOT, "dist", "CenterManager", "CenterManager.exe")
    shortcut_vbs = os.path.join(ROOT, "create_shortcut.vbs")
    
    shortcut_path = os.path.join(desktop, "Center Manager.lnk")
    
    vbs_content = f'''
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{exe_path}"
oLink.WorkingDirectory = "{os.path.dirname(exe_path)}"
oLink.Description = "Center Manager & Test Formatter Application"
oLink.Save
'''
    with open(shortcut_vbs, "w", encoding="utf-8") as f:
        f.write(vbs_content)
        
    try:
        subprocess.run(["cscript", "//Nologo", shortcut_vbs], check=True)
        print(f"Created Desktop Shortcut: {shortcut_path}")
        os.remove(shortcut_vbs)
    except Exception as e:
        print(f"Notice: Could not create desktop shortcut automatically: {e}")

if __name__ == "__main__":
    build_executable()
