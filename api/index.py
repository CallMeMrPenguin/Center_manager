import os
import sys

# Configure environment
os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

for p in [BACKEND_DIR, CUR_DIR]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Scope, Receive, Send

app = FastAPI(title="Center Manager API")
handler = app
application = app

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vercel URL prefix middleware to handle rewrites where /api might be stripped
class VercelApiPrefixMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path and not path.startswith("/api"):
                scope["path"] = f"/api{path}" if path.startswith("/") else f"/api/{path}"
                scope["raw_path"] = scope["path"].encode("utf-8")
        await self.app(scope, receive, send)

app.add_middleware(VercelApiPrefixMiddleware)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    err_tb = traceback.format_exc()
    print(f"[Vercel Unhandled Exception on {request.url.path}]: {exc}\n{err_tb}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": str(exc), "path": request.url.path}
    )

@app.get("/api/health")
@app.get("/health")
def api_health():
    return {"status": "ok", "python": sys.version}

@app.get("/api/test-imports")
def test_imports():
    import traceback
    results = {}
    try:
        from database.connection import get_connection
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        results["database"] = "OK"
        conn.close()
    except Exception as e:
        results["database"] = f"FAIL: {e}\n{traceback.format_exc()}"

    for r in ["system", "center_manager", "seating", "skill_analytics", "assignments", "users", "questions", "vocabulary", "documents"]:
        try:
            mod = __import__(f"routers.{r}", fromlist=[r])
            results[r] = "OK"
        except Exception as e:
            results[r] = f"FAIL: {e}\n{traceback.format_exc()}"

    return results

# Mount all routers
try:
    from routers import (
        system,
        center_manager,
        seating,
        skill_analytics,
        assignments,
        users,
        questions,
        vocabulary,
        documents
    )
    app.include_router(system.router)
    app.include_router(center_manager.router)
    app.include_router(seating.router)
    app.include_router(skill_analytics.router)
    app.include_router(assignments.router)
    app.include_router(users.router)
    app.include_router(questions.router)
    app.include_router(vocabulary.router)
    app.include_router(documents.router)
except Exception as e:
    import traceback
    _err_msg = traceback.format_exc()
    print("Error mounting routers in api/index.py:", _err_msg)
    @app.get("/api/{catchall:path}")
    def router_load_error(catchall: str):
        return JSONResponse(
            status_code=500,
            content={"error": "Router import failed", "detail": str(e), "traceback": _err_msg}
        )
