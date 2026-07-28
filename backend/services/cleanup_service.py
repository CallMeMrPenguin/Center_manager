import os
import shutil
import subprocess

def send_to_trash(target_path: str):
    """
    Sends a file or directory to the OS Trash/Recycle Bin.
    Uses send2trash if available, falls back to Windows PowerShell Recycle Bin API,
    and falls back to shutil.rmtree if necessary.
    """
    if not os.path.exists(target_path):
        return
    abs_path = os.path.abspath(target_path)
    
    # 1. Try python send2trash package
    try:
        import send2trash
        send2trash.send2trash(abs_path)
        return
    except Exception:
        pass

    # 2. Try Windows PowerShell Recycle Bin API
    try:
        if os.path.isdir(abs_path):
            ps_cmd = f'powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(\'{abs_path}\', \'OnlyErrorDialogs\', \'SendToRecycleBin\')"'
        else:
            ps_cmd = f'powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(\'{abs_path}\', \'OnlyErrorDialogs\', \'SendToRecycleBin\')"'
        res = subprocess.run(ps_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if res.returncode == 0 and not os.path.exists(abs_path):
            return
    except Exception:
        pass

    # 3. Fallback to standard deletion
    if os.path.isdir(abs_path):
        shutil.rmtree(abs_path, ignore_errors=True)
    elif os.path.isfile(abs_path):
        try:
            os.remove(abs_path)
        except Exception:
            pass

def cleanup_temp_folders(root_dir: str = None):
    """
    Finds all temporary folders across the application, sends them to the Trash bin,
    and recreates fresh, empty replacement temp folders upon application startup.
    """
    if not root_dir:
        # Resolve center manager root directory
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(cur_dir))

    print("[Startup Cleanup] Processing temporary folders...")

    temp_dirs = [
        os.path.join(root_dir, "temp"),
        os.path.join(root_dir, "backend", "temp"),
        os.path.join(root_dir, "backend", "temp_pdf_previews"),
        os.path.join(root_dir, "TEST_FORMATTER", "temp"),
        os.path.join(root_dir, "TEST_FORMATTER", "temp_pdf_previews"),
    ]

    for d in temp_dirs:
        if os.path.exists(d):
            print(f"[Startup Cleanup] Sending temp folder to Recycle Bin: {d}")
            send_to_trash(d)
        os.makedirs(d, exist_ok=True)

    # Clean leftover temporary files inside files directories
    files_dirs = [
        os.path.join(root_dir, "backend", "files"),
        os.path.join(root_dir, "files"),
    ]
    for fdir in files_dirs:
        if os.path.exists(fdir):
            for fname in os.listdir(fdir):
                if fname.startswith("temp_") or fname.startswith("tmp_"):
                    fpath = os.path.join(fdir, fname)
                    print(f"[Startup Cleanup] Sending temp file to Recycle Bin: {fpath}")
                    send_to_trash(fpath)
