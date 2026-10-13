import os
import shutil
import datetime
import zipfile

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(root, "backups", f"pre_remediation_backup_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)
    print(f"Target backup directory: {backup_dir}")

    # 1. Backup SQLite databases
    db_paths = [
        os.path.join(root, "data", "test_formatter.db"),
        os.path.join(root, "backend", "center_manager.db"),
    ]
    for db_p in db_paths:
        if os.path.exists(db_p):
            dst = os.path.join(backup_dir, os.path.basename(db_p))
            shutil.copy2(db_p, dst)
            print(f"Copied DB: {db_p} -> {dst}")

    # 2. Archive backend directory
    backend_zip = os.path.join(backup_dir, "backend_src.zip")
    with zipfile.ZipFile(backend_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for folder, _, files in os.walk(os.path.join(root, "backend")):
            for f in files:
                full_path = os.path.join(folder, f)
                rel_path = os.path.relpath(full_path, root)
                z.write(full_path, rel_path)
    print(f"Archived backend to {backend_zip}")

    # 3. Archive frontend/src directory
    frontend_zip = os.path.join(backup_dir, "frontend_src.zip")
    with zipfile.ZipFile(frontend_zip, "w", zipfile.ZIP_DEFLATED) as z:
        for folder, _, files in os.walk(os.path.join(root, "frontend", "src")):
            for f in files:
                full_path = os.path.join(folder, f)
                rel_path = os.path.relpath(full_path, root)
                z.write(full_path, rel_path)
    print(f"Archived frontend/src to {frontend_zip}")

    print("Pre-remediation backup completed successfully!")

if __name__ == "__main__":
    main()
