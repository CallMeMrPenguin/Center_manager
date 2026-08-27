import os
import sys
import traceback

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

for p in [BACKEND_DIR, CUR_DIR]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

_import_error = None
try:
    try:
        from backend.main import app
    except Exception:
        from main import app
except Exception:
    _import_error = traceback.format_exc()
    from fastapi import FastAPI
    app = FastAPI()

    @app.get("/{full_path:path}")
    def fallback_error(full_path: str):
        return {
            "error": "Backend Import Failed",
            "traceback": _import_error,
            "sys_path": sys.path,
            "cur_dir_files": os.listdir(CUR_DIR) if os.path.exists(CUR_DIR) else [],
            "backend_dir_files": os.listdir(BACKEND_DIR) if os.path.exists(BACKEND_DIR) else []
        }

handler = app
