import os
import sys

# Ensure backend directory is resolved in Vercel Serverless environment
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for p in [BACKEND_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

from backend.main import app
