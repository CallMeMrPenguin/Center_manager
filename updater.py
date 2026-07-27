"""
updater.py — Center Manager Auto-Update Engine
Checks GitHub Releases for newer versions, downloads and applies updates
while preserving user data (config, database, workspace files).
"""

import os
import sys
import json
import shutil
import zipfile
import tempfile
import threading
import time
import urllib.request
import urllib.error
from packaging.version import Version

GITHUB_REPO = "CallMeMrPenguin/Center_manager"
GITHUB_API_URL = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
ROOT = os.path.dirname(os.path.abspath(__file__))

# Files/folders to preserve during update (user data)
PRESERVE_PATHS = [
    "config.json",
    "workspace_files",
    "test_formatter.db",
    "avatars",
    "prompts.json",
    "unit_config.json",
    "exercise_config.json",
    "GG_Sheet_API.json",
]

# In-memory update state (shared across requests)
_update_state = {
    "checking": False,
    "applying": False,
    "has_update": False,
    "current_version": "unknown",
    "latest_version": None,
    "download_url": None,
    "error": None,
    "last_checked": None,
    "progress": None,   # e.g. "Downloading... 45%"
    "applied": False,
}


def get_current_version() -> str:
    """Read the VERSION file from the app root."""
    version_file = os.path.join(ROOT, "VERSION")
    try:
        with open(version_file, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return "0.0.0"


def get_update_state() -> dict:
    """Return a snapshot of the current update state."""
    state = dict(_update_state)
    state["current_version"] = get_current_version()
    return state


def check_for_update() -> dict:
    """
    Query GitHub Releases API (or fallback to Tags API) for latest version.
    Updates global _update_state and returns result dict.
    """
    global _update_state
    if _update_state["checking"]:
        return _update_state

    _update_state["checking"] = True
    _update_state["error"] = None

    tag = None
    source_zip = None

    # Try 1: GitHub Releases API
    try:
        req = urllib.request.Request(
            GITHUB_API_URL,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "CenterManagerApp/1.0",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        tag = data.get("tag_name", "").lstrip("v")
        zipball_url = data.get("zipball_url", "")
        assets = data.get("assets", [])
        source_zip = next(
            (a["browser_download_url"] for a in assets if a["name"].endswith(".zip")),
            zipball_url
        )
    except urllib.error.HTTPError as e:
        if e.code == 404:
            # Fallback 2: GitHub Tags API
            try:
                tags_url = f"https://api.github.com/repos/{GITHUB_REPO}/tags"
                req_tags = urllib.request.Request(
                    tags_url,
                    headers={
                        "Accept": "application/vnd.github+json",
                        "User-Agent": "CenterManagerApp/1.0",
                    }
                )
                with urllib.request.urlopen(req_tags, timeout=10) as resp_tags:
                    tags_data = json.loads(resp_tags.read().decode("utf-8"))
                if tags_data and isinstance(tags_data, list):
                    latest_tag_obj = tags_data[0]
                    raw_tag = latest_tag_obj.get("name", "")
                    tag = raw_tag.lstrip("v")
                    source_zip = f"https://github.com/{GITHUB_REPO}/archive/refs/tags/{raw_tag}.zip"
            except Exception as ex:
                _update_state["error"] = f"Tag check failed: {ex}"
        else:
            _update_state["error"] = str(e)
    except Exception as e:
        _update_state["error"] = str(e)

    current = get_current_version()
    has_update = False
    if tag:
        try:
            has_update = Version(tag) > Version(current)
        except Exception:
            has_update = tag != current

    _update_state.update({
        "checking": False,
        "has_update": has_update,
        "latest_version": tag if has_update else (tag or current),
        "download_url": source_zip if has_update else None,
        "last_checked": time.time(),
        "error": None if tag else _update_state.get("error"),
    })

    return dict(_update_state)


def apply_update(download_url: str = None) -> bool:
    """
    Download the release ZIP from GitHub, extract, and copy files
    over the current installation while preserving user data.
    Returns True on success.
    """
    global _update_state
    _update_state["applying"] = True
    _update_state["progress"] = "Đang chuẩn bị tải xuống..."
    _update_state["error"] = None

    url = download_url or _update_state.get("download_url")
    if not url:
        _update_state["error"] = "Không có URL tải xuống."
        _update_state["applying"] = False
        return False

    tmp_dir = tempfile.mkdtemp(prefix="cm_update_")
    zip_path = os.path.join(tmp_dir, "update.zip")

    try:
        # --- STEP 1: Download ---
        _update_state["progress"] = "Đang tải xuống bản cập nhật..."
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "CenterManagerApp/1.0"}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            total = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            chunk_size = 65536
            with open(zip_path, "wb") as f:
                while True:
                    chunk = resp.read(chunk_size)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total:
                        pct = int(downloaded * 100 / total)
                        _update_state["progress"] = f"Đang tải xuống... {pct}%"

        # --- STEP 2: Extract ---
        _update_state["progress"] = "Đang giải nén..."
        extract_dir = os.path.join(tmp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)

        # GitHub zipball has a top-level folder like "User-repo-abc123/"
        entries = os.listdir(extract_dir)
        if len(entries) == 1 and os.path.isdir(os.path.join(extract_dir, entries[0])):
            source_root = os.path.join(extract_dir, entries[0])
        else:
            source_root = extract_dir

        # --- STEP 3: Backup user data ---
        _update_state["progress"] = "Đang sao lưu dữ liệu người dùng..."
        backup_dir = os.path.join(tmp_dir, "user_backup")
        os.makedirs(backup_dir, exist_ok=True)
        for rel_path in PRESERVE_PATHS:
            src = os.path.join(ROOT, rel_path)
            dst = os.path.join(backup_dir, rel_path)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            elif os.path.isfile(src):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)

        # --- STEP 4: Copy new files (skip preserved user paths) ---
        _update_state["progress"] = "Đang cài đặt bản cập nhật..."
        _copy_update(source_root, ROOT, PRESERVE_PATHS)

        # --- STEP 5: Restore user data ---
        _update_state["progress"] = "Đang khôi phục dữ liệu người dùng..."
        for rel_path in PRESERVE_PATHS:
            src = os.path.join(backup_dir, rel_path)
            dst = os.path.join(ROOT, rel_path)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            elif os.path.isfile(src):
                shutil.copy2(src, dst)

        _update_state.update({
            "applying": False,
            "applied": True,
            "has_update": False,
            "progress": "Cập nhật hoàn tất! Đang khởi động lại...",
        })
        return True

    except Exception as e:
        _update_state.update({
            "applying": False,
            "error": f"Lỗi cập nhật: {e}",
            "progress": None,
        })
        return False
    finally:
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:
            pass


def _copy_update(src_dir: str, dst_dir: str, skip_relatives: list):
    """Recursively copy files from src_dir to dst_dir, skipping preserved paths."""
    skip_abs = {os.path.normpath(os.path.join(dst_dir, p)) for p in skip_relatives}
    for item in os.listdir(src_dir):
        # Skip hidden/build artifacts that shouldn't be deployed
        if item in ("__pycache__", ".git", ".github", "node_modules", ".venv", "venv"):
            continue
        s = os.path.join(src_dir, item)
        d = os.path.join(dst_dir, item)
        if os.path.normpath(d) in skip_abs:
            continue
        if os.path.isdir(s):
            os.makedirs(d, exist_ok=True)
            _copy_update(s, d, [
                os.path.relpath(os.path.join(dst_dir, p), dst_dir)
                for p in skip_relatives
            ])
        else:
            try:
                shutil.copy2(s, d)
            except Exception:
                pass


def schedule_restart(delay_seconds: float = 3.0):
    """Restart main.py after a short delay (called after update applied)."""
    def _do_restart():
        time.sleep(delay_seconds)
        python = sys.executable
        args = [python] + sys.argv
        try:
            import subprocess
            subprocess.Popen(args, cwd=ROOT)
        except Exception:
            pass
        os._exit(0)

    t = threading.Thread(target=_do_restart, daemon=True)
    t.start()


def background_check_on_startup():
    """Silently check for updates in background thread on server startup."""
    def _check():
        time.sleep(5)   # Wait for server to fully start first
        check_for_update()
        if _update_state["has_update"]:
            print(f"\n[Updater] 🔔 Có bản cập nhật mới: v{_update_state['latest_version']}")
            print("  → Mở Cài Đặt → Cập Nhật để cài đặt.\n")

    t = threading.Thread(target=_check, daemon=True)
    t.start()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Center Manager Updater")
    parser.add_argument("--check", action="store_true", help="Check for updates")
    args = parser.parse_args()
    if args.check:
        print(f"Current version: {get_current_version()}")
        result = check_for_update()
        if result.get("has_update"):
            print(f"Update available: v{result['latest_version']}")
            print(f"Download: {result['download_url']}")
        elif result.get("error"):
            print(f"Error: {result['error']}")
        else:
            print("Already up to date.")
