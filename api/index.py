import os
import sys
import traceback

# Ensure backend directory is resolved in Vercel Serverless environment
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for p in [BACKEND_DIR, ROOT_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ["APP_MODE"] = "web"
os.environ["VERCEL"] = "1"

try:
    from backend.main import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    app = FastAPI(title="Error Fallback App")
    startup_error = traceback.format_exc()
    print("[Vercel Startup Error]:", startup_error)

    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"])
    def catch_all_err(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "FastAPI Startup Failed on Vercel",
                "detail": str(e),
                "traceback": startup_error
            }
        )
