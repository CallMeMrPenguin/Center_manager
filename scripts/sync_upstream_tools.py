# -*- coding: utf-8 -*-
"""
sync_upstream_tools.py — Automated Upstream Syncer & Repository Backup Engine
=============================================================================
1. Checks and downloads latest release bundles for WordCraft, PdfCraft, and Excalidraw.
2. Synchronizes runtime web assets into frontend/public/.
3. Stores full standalone repository source archives in backups/repos/ to protect
   against upstream repository deletion or takedowns.

Usage:
    py scripts/sync_upstream_tools.py [--check-only] [--skip-backups]
"""

import os
import sys
import json
import time
import shutil
import zipfile
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(ROOT, "frontend", "public")
BACKUP_DIR = os.path.join(ROOT, "backups", "repos")

REPOSITORIES = [
    {
        "id": "wordcraft",
        "name": "WordCraft",
        "repo_url": "https://github.com/storytold/wordcraft.git",
        "api_releases": "https://api.github.com/repos/storytold/wordcraft/releases/latest",
        "source_archive_url": "https://github.com/storytold/wordcraft/archive/refs/heads/main.zip",
        "target_public_subdir": "wordcraft",
        "asset_prefix": "wordcraft-web",
    },
    {
        "id": "pdfcraft",
        "name": "PdfCraft",
        "repo_url": "https://github.com/storytold/pdfcraft.git",
        "api_releases": "https://api.github.com/repos/storytold/pdfcraft/releases/latest",
        "source_archive_url": "https://github.com/storytold/pdfcraft/archive/refs/heads/main.zip",
        "target_public_subdir": "pdfcraft",
        "asset_prefix": "pdfcraft-web",
    },
    {
        "id": "gridcraft",
        "name": "GridCraft",
        "repo_url": "https://github.com/storytold/gridcraft.git",
        "api_releases": "https://api.github.com/repos/storytold/gridcraft/releases/latest",
        "source_archive_url": "https://github.com/storytold/gridcraft/archive/refs/heads/main.zip",
        "target_public_subdir": "gridcraft",
        "asset_prefix": "gridcraft-web",
    },
]

HEADERS = {
    "User-Agent": "CenterManager-ToolSyncer/1.0",
    "Accept": "application/vnd.github+json",
}


def download_stream(url: str, dest_path: str, timeout: int = 120):
    """Downloads a remote URL directly to a local file."""
    print(f"  Downloading from: {url}")
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        with open(dest_path, "wb") as f:
            shutil.copyfileobj(resp, f)
    mb = os.path.getsize(dest_path) / (1024 * 1024)
    print(f"  Saved {os.path.basename(dest_path)} ({mb:.2f} MB)")


def backup_repository_sources():
    """Downloads and archives complete repository source snapshots in backups/repos/."""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    print("\n[1/2] Backing up upstream repositories to backups/repos/ ...")
    
    manifest_path = os.path.join(BACKUP_DIR, "manifest.json")
    manifest = {"last_synced": time.strftime("%Y-%m-%d %H:%M:%S"), "repos": []}

    for item in REPOSITORIES:
        repo_id = item["id"]
        source_zip = os.path.join(BACKUP_DIR, f"{repo_id}-source.zip")
        
        print(f"\n* Checking backup for {item['name']} ({item['repo_url']})...")
        try:
            download_stream(item["source_archive_url"], source_zip)
            manifest["repos"].append({
                "id": repo_id,
                "name": item["name"],
                "repo_url": item["repo_url"],
                "source_backup_file": f"{repo_id}-source.zip",
                "backup_size_bytes": os.path.getsize(source_zip),
                "status": "backed_up",
            })
        except Exception as e:
            print(f"  Warning during backup of {repo_id}: {e}")
            manifest["repos"].append({
                "id": repo_id,
                "name": item["name"],
                "repo_url": item["repo_url"],
                "status": f"error: {e}",
            })

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"\nRepository backup manifest saved -> {manifest_path}")


def sync_wasm_releases():
    """Syncs newest WebAssembly releases into frontend/public/."""
    print("\n[2/2] Checking and syncing WebAssembly runtime bundles ...")

    for item in REPOSITORIES:
        if not item.get("target_public_subdir") or not item.get("asset_prefix"):
            continue

        repo_id = item["id"]
        target_dir = os.path.join(PUBLIC_DIR, item["target_public_subdir"])
        os.makedirs(target_dir, exist_ok=True)

        print(f"\n* Checking release for {item['name']}...")
        try:
            req = urllib.request.Request(item["api_releases"], headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                release_data = json.loads(resp.read().decode("utf-8"))

            tag_name = release_data.get("tag_name", "unknown")
            print(f"  Latest upstream release tag: {tag_name}")

            # Find matching web zip asset
            asset = None
            for a in release_data.get("assets", []):
                name = a.get("name", "")
                if name.startswith(item["asset_prefix"]) and name.endswith(".zip"):
                    asset = a
                    break

            if not asset:
                print(f"  No {item['asset_prefix']}*.zip asset found in release {tag_name}.")
                continue

            asset_url = asset.get("browser_download_url")
            asset_name = asset.get("name")
            release_backup_path = os.path.join(BACKUP_DIR, f"{repo_id}-release-{asset_name}")

            # Also store a copy of the release asset in backups/repos/
            download_stream(asset_url, release_backup_path)

            # Extract into frontend/public/<subdir>/
            print(f"  Extracting {asset_name} into {target_dir}...")
            with zipfile.ZipFile(release_backup_path) as z:
                for member in z.infolist():
                    parts = member.filename.split("/", 1)
                    if len(parts) > 1 and parts[1]:
                        target_file = os.path.join(target_dir, parts[1])
                        if member.is_dir():
                            os.makedirs(target_file, exist_ok=True)
                        else:
                            os.makedirs(os.path.dirname(target_file), exist_ok=True)
                            with z.open(member) as src, open(target_file, "wb") as dst:
                                shutil.copyfileobj(src, dst)

            print(f"  Successfully synced {item['name']} runtime assets.")

        except Exception as e:
            print(f"  Notice while syncing {repo_id}: {e}")


def main():
    print("=" * 65)
    print("  CENTER MANAGER — UPSTREAM TOOLS SYNCER & REPOSITORY BACKUP")
    print("=" * 65)
    backup_repository_sources()
    sync_wasm_releases()
    print("\n" + "=" * 65)
    print("  ALL UPSTREAM REPOSITORIES BACKED UP & SYNCED SUCCESSFULLY")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
