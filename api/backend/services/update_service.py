import os
import sys
import urllib.request
import urllib.parse
import json
import zipfile
import io

APP_VERSION = "4.0.0"

def get_current_version():
    return APP_VERSION

def check_update(admin_ip_or_url):
    """
    Checks the admin server for updates.
    Returns (has_update: bool, latest_version: str, error_msg: str)
    """
    if not admin_ip_or_url:
        return False, None, "Admin server URL chưa được cấu hình."
        
    # Normalize URL
    url = admin_ip_or_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"http://{url}"
    if not url.endswith("/"):
        url = f"{url}"
        
    try:
        req = urllib.request.Request(f"{url}/api/update/check", method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            latest_version = res_data.get("version")
            if latest_version and latest_version != APP_VERSION:
                # Simple version check (can be string comparison or packaging.version)
                return True, latest_version, None
            return False, latest_version, None
    except Exception as e:
        return False, None, f"Không thể kết nối tới Admin server: {str(e)}"

def download_and_apply_update(admin_ip_or_url):
    """
    Downloads update.zip and runs apply_update batch script.
    """
    url = admin_ip_or_url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"http://{url}"
        
    try:
        download_url = f"{url}/api/update/download"
        with urllib.request.urlopen(download_url, timeout=30) as response:
            zip_bytes = response.read()
            
        # Apply update
        import subprocess
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        temp_zip = os.path.join(root_dir, "update_temp.zip")
        
        with open(temp_zip, "wb") as f:
            f.write(zip_bytes)
            
        bat_path = os.path.join(root_dir, "apply_update.bat")
        python_exe = sys.executable
        main_py_path = os.path.join(root_dir, "main.py")
        
        # Batch script template: waits 2 seconds, extracts, deletes temp zip, restarts, deletes itself
        bat_content = f"""@echo off
timeout /t 2 /nobreak > nul
"{python_exe}" -c "import zipfile; zipfile.ZipFile(r'{temp_zip}').extractall(r'{root_dir}')"
del "{temp_zip}"
start "" "{python_exe}" "{main_py_path}"
del "%~f0"
"""
        with open(bat_path, "w", encoding="utf-8") as f:
            f.write(bat_content)
            
        subprocess.Popen(["cmd.exe", "/c", bat_path], shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)
        os._exit(0)
    except Exception as e:
        return False, str(e)

def create_update_zip():
    """
    Zips center manager files excluding db, config, git, and python cache.
    """
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    memory_file = io.BytesIO()
    
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(root_dir):
            # Prune directories we don't want to crawl/zip
            dirs[:] = [d for d in dirs if d not in ('__pycache__', '.git', 'node_modules', 'dist', 'avatars')]
            
            for file in files:
                if file in ('center_manager.db', 'config.json', 'update.zip', 'GG_Sheet_API.json') or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                zip_file.write(file_path, rel_path)
                
    memory_file.seek(0)
    return memory_file.getvalue()
