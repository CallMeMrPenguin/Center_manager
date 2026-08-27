import os
import sys

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

# Ensure BACKEND_DIR and CUR_DIR are at the front of sys.path
for p in [BACKEND_DIR, CUR_DIR]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

try:
    from backend.main import app
except Exception:
    from main import app

handler = app
