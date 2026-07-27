"""
build_installer.py — Center Manager Windows Installer Builder
=============================================================
Builds a Windows .exe installer using NSIS (via pynsist).

Prerequisites:
    pip install pynsist
    NSIS must be installed: https://nsis.sourceforge.io/Download
    (pynsist downloads NSIS automatically on first run)

Usage:
    python installer/build_installer.py
"""

import os
import sys
import subprocess
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTALLER_DIR = os.path.join(ROOT, "installer")
FRONTEND_DIR = os.path.join(ROOT, "frontend")
DIST_DIR = os.path.join(FRONTEND_DIR, "dist")
VERSION_FILE = os.path.join(ROOT, "VERSION")
PYTHON = sys.executable


def read_version() -> str:
    try:
        with open(VERSION_FILE, "r") as f:
            return f.read().strip()
    except Exception:
        return "1.0.0"


def check_prerequisites():
    print("[1/5] Checking prerequisites...")
    try:
        import nsist  # pynsist
        print("  ✓ pynsist is installed")
    except ImportError:
        print("  ✗ pynsist not found. Installing...")
        subprocess.check_call([PYTHON, "-m", "pip", "install", "pynsist"])
        print("  ✓ pynsist installed")


def build_frontend():
    print("[2/5] Building React frontend...")
    if not os.path.exists(os.path.join(FRONTEND_DIR, "package.json")):
        print("  ✗ frontend/package.json not found!")
        sys.exit(1)

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    result = subprocess.run([npm_cmd, "run", "build"], cwd=FRONTEND_DIR)
    if result.returncode != 0:
        print("  ✗ Frontend build failed!")
        sys.exit(1)
    print(f"  ✓ Frontend built → {DIST_DIR}")


def generate_installer_cfg(version: str):
    print("[3/5] Generating installer.cfg with version...")
    cfg_path = os.path.join(INSTALLER_DIR, "installer.cfg")

    # Read the template and inject the version
    with open(cfg_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace the version line
    lines = content.splitlines()
    new_lines = []
    for line in lines:
        if line.startswith("version="):
            new_lines.append(f"version={version}")
        else:
            new_lines.append(line)

    with open(cfg_path, "w", encoding="utf-8") as f:
        f.write("\n".join(new_lines))

    print(f"  ✓ installer.cfg updated for v{version}")
    return cfg_path


def run_pynsist(cfg_path: str, version: str):
    print("[4/5] Running pynsist to build installer...")
    result = subprocess.run(
        [PYTHON, "-m", "nsist", cfg_path],
        cwd=ROOT
    )
    if result.returncode != 0:
        print("  ✗ pynsist build failed!")
        sys.exit(1)

    # The output is at build/nsis/
    build_dir = os.path.join(ROOT, "build", "nsis")
    installers = [f for f in os.listdir(build_dir) if f.endswith(".exe")] if os.path.exists(build_dir) else []

    if installers:
        out_path = os.path.join(build_dir, installers[0])
        final_name = f"CenterManagerSetup_v{version}.exe"
        final_path = os.path.join(INSTALLER_DIR, final_name)
        shutil.copy2(out_path, final_path)
        print(f"  ✓ Installer created: installer/{final_name}")
        return final_path
    else:
        print("  ✗ Could not find output .exe in build/nsis/")
        return None


def print_summary(installer_path, version):
    print("\n" + "=" * 55)
    print(f"  ✅ BUILD COMPLETE — Center Manager v{version}")
    if installer_path:
        size_mb = os.path.getsize(installer_path) / (1024 * 1024)
        print(f"  📦 Installer: {os.path.basename(installer_path)}")
        print(f"  📏 Size: {size_mb:.1f} MB")
    print("=" * 55)
    print("\nNext steps:")
    print("  1. Test the installer on a clean Windows machine")
    print("  2. Upload to GitHub → Create a Release tagged v" + version)
    print("  3. Attach the .exe to the release")
    print("  4. Existing installs will auto-detect the update!\n")


if __name__ == "__main__":
    version = read_version()
    print(f"\n🔨 Building Center Manager v{version} Windows Installer\n")

    check_prerequisites()
    build_frontend()
    cfg_path = generate_installer_cfg(version)
    installer_path = run_pynsist(cfg_path, version)
    print_summary(installer_path, version)
