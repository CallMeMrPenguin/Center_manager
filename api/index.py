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

app = FastAPI(title="Center Manager API")
handler = app
application = app

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

@app.get("/api/health")
@app.get("/health")
def api_health():
    return {"status": "ok", "python": sys.version}

# Import and mount routers safely
try:
    from routers import system, center_manager, seating, skill_analytics, assignments, users
    app.include_router(system.router)
    app.include_router(center_manager.router)
    app.include_router(seating.router)
    app.include_router(skill_analytics.router)
    app.include_router(assignments.router)
    app.include_router(users.router)
except Exception as e:
    import traceback
    _err_msg = traceback.format_exc()
    @app.get("/api/{catchall:path}")
    def router_load_error(catchall: str):
        return JSONResponse(
            status_code=500,
            content={"error": "Router import failed", "detail": str(e), "traceback": _err_msg}
        )
