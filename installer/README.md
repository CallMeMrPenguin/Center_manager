# 📦 Center Manager — Installer & Update Guide

## Building the Windows Installer

### Prerequisites
1. **NSIS** must be installed: https://nsis.sourceforge.io/Download
2. **pynsist** Python package (auto-installed by build script):
   ```
   pip install pynsist
   ```

### How to Build
```bash
# Option 1 — Double-click
installer\build_release.bat

# Option 2 — Command line
python installer\build_installer.py
```

Output: `installer\CenterManagerSetup_v1.0.0.exe`

The installer bundles:
- Python 3.13 runtime (no Python needed on target PC)
- All backend packages (FastAPI, uvicorn, python-docx, etc.)
- Pre-built React frontend (frontend/dist/)
- App files, configs, and updater

---

## Publishing a Release (For Developer)

1. **Bump the version** in `VERSION` file:
   ```
   1.0.1
   ```
2. **Build the installer**:
   ```
   python installer\build_installer.py
   ```
3. **Commit and push**:
   ```
   git add . && git commit -m "release: v1.0.1" && git push origin main
   ```
4. **Create a GitHub Release**:
   - Go to https://github.com/CallMeMrPenguin/Center_manager/releases/new
   - Tag: `v1.0.1`
   - Title: `Center Manager v1.0.1`
   - Attach: `installer/CenterManagerSetup_v1.0.1.exe`
   - Publish release

All installed copies will detect this new version on next startup!

---

## How Auto-Update Works

1. **On every startup**, `main.py` spawns a background thread that silently queries:
   ```
   https://api.github.com/repos/CallMeMrPenguin/Center_manager/releases/latest
   ```

2. If the tag version > current `VERSION`, it sets `has_update = True` and logs to console:
   ```
   [Updater] 🔔 Có bản cập nhật mới: v1.0.1
     → Mở Cài Đặt → Cập Nhật để cài đặt.
   ```

3. **In Settings → Cập Nhật Ứng Dụng**:
   - The current version badge is shown
   - If update available: blue "Cài Đặt Ngay" button appears
   - "Kiểm Tra Cập Nhật" button forces a manual re-check

4. **When "Cài Đặt Ngay" is clicked**:
   - Downloads GitHub source ZIP
   - Backs up user data (config.json, workspace_files/, *.db, etc.)
   - Extracts new files over installation directory
   - Restores user data
   - Server restarts automatically after 3 seconds

---

## What Gets Preserved During Update
- `config.json` — App settings
- `workspace_files/` — All uploaded/compiled documents
- `test_formatter.db` — Question bank database
- `avatars/` — User avatar images
- `prompts.json` — AI prompts
- `unit_config.json` — Unit configuration
- `exercise_config.json` — Exercise configuration
- `GG_Sheet_API.json` — Google Sheets API credentials

---

## Troubleshooting

**Update check fails (network error)**
→ The app is offline or GitHub is unreachable. Try again later.

**Update fails mid-way**
→ User data is backed up before any files are overwritten. Manual re-download of installer is the fallback.

**NSIS not found during build**
→ Download from https://nsis.sourceforge.io and install. pynsist looks for it in `C:\Program Files\NSIS\`.
