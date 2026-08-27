import os
import sys

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

for p in [BACKEND_DIR, CUR_DIR]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Center Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
@app.get("/health")
def api_health():
    return {"status": "ok", "python": sys.version}

@app.get("/api/test-imports")
def test_imports():
    import traceback
    results = {}
    
    # 1. Database Connection
    try:
        from database.connection import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        results["database"] = "OK"
        conn.close()
    except Exception as e:
        results["database"] = f"FAIL: {e}\n{traceback.format_exc()}"

    # 2. Routers
    for r in ["center_manager", "seating", "skill_analytics", "assignments", "users", "system"]:
        try:
            mod = __import__(f"routers.{r}", fromlist=[r])
            results[r] = "OK"
        except Exception as e:
            results[r] = f"FAIL: {e}\n{traceback.format_exc()}"

    return results

