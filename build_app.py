# -*- coding: utf-8 -*-
"""
CENTER MANAGER -- Executable Builder Script
Compiles launcher.py into a lightweight silent standalone CenterManager.exe (no CMD window) using PyInstaller
and creates a Desktop shortcut for the user.
"""

import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))

def build_executable():
    print("=" * 60)
    print("Building CenterManager.exe silent launcher via PyInstaller...")
    print("=" * 60)
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--noconfirm",
        "--onedir",
        "--noconsole",
        "--name=CenterManager",
        os.path.join(ROOT, "launcher.py")
    ]
    
    res = subprocess.run(cmd, cwd=ROOT)
    if res.returncode == 0:
        print("Success! CenterManager.exe built silently inside dist/CenterManager/")
        create_desktop_shortcut()
    else:
        print(f"Build failed with exit code: {res.returncode}")

def create_desktop_shortcut():
    desktop = os.path.join(os.path.expanduser("~"), "Desktop")
    exe_path = os.path.join(ROOT, "dist", "CenterManager", "CenterManager.exe")
    shortcut_vbs = os.path.join(ROOT, "create_shortcut.vbs")
    
    if not os.path.exists(exe_path):
        exe_path = os.path.join(ROOT, "launcher.py")

    shortcut_path = os.path.join(desktop, "Center Manager.lnk")
    
    vbs_content = f'''
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{exe_path}"
oLink.WorkingDirectory = "{ROOT}"
oLink.Description = "Center Manager & Test Formatter App"
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
