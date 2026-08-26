import os
import sys

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

# Add api/ and api/backend/ to sys.path so all imports resolve seamlessly
for p in [CUR_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

from backend.main import app

handler = app
