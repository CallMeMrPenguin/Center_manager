import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Scope, Receive, Send

CUR_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CUR_DIR, "backend")

for p in [BACKEND_DIR, CUR_DIR]:
    if p and p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

# Top-level ASGI App instances (detected by @vercel/python AST scanner)
app = FastAPI(title="Center Manager API")
handler = app
application = app

# ASGI Prefix Normalizer for Vercel Serverless
class VercelApiPrefixMiddleware:
    def __init__(self, asgi_app: ASGIApp):
        self.asgi_app = asgi_app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path and not path.startswith("/api"):
                scope["path"] = f"/api{path}" if path.startswith("/") else f"/api/{path}"
                scope["raw_path"] = scope["path"].encode("utf-8")
        await self.asgi_app(scope, receive, send)

app.add_middleware(VercelApiPrefixMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    err_tb = traceback.format_exc()
    print(f"[Unhandled Exception on {request.url.path}]: {exc}\n{err_tb}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": str(exc), "path": request.url.path}
    )

# Core Routers
from routers import (
    system,
    center_manager,
    seating,
    skill_analytics,
    assignments,
    users
)

app.include_router(system.router)
app.include_router(center_manager.router)
app.include_router(seating.router)
app.include_router(skill_analytics.router)
app.include_router(assignments.router)
app.include_router(users.router)

@app.get("/api/health")
@app.get("/health")
def api_health():
    return {
        "status": "healthy",
        "python": sys.version,
        "mode": os.environ.get("APP_MODE")
    }
