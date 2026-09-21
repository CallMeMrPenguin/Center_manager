import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

# Ensure we can import from backend subdirectories
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.settings import load_settings, get_setting, BASE_DIR
from database.db_manager import init_db

# App Mode (web/vps = remote PostgreSQL server mode, local = desktop SQLite suite)
APP_MODE = os.environ.get("APP_MODE", "local")

# Core Routers
from routers import (
    system,
    center_manager,
    seating,
    skill_analytics,
    assignments,
    users
)

# Initialize SQLite Database only in local desktop mode
if APP_MODE != "web":
    try:
        init_db()
    except Exception as e:
        print("Local init_db notice:", e)

app = FastAPI(title="Center Manager & Test Formatter API")

from middlewares.security_middleware import SecurityGuardMiddleware

# Configure CORS (Supports mobile, LAN, and remote web domains seamlessly)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Anti-tampering & authentication security guard
app.add_middleware(SecurityGuardMiddleware)

from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    err_tb = traceback.format_exc()
    print(f"[Unhandled Exception on {request.url.path}]: {exc}\n{err_tb}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "detail": str(exc), "path": request.url.path}
    )

# Mount Core Routers (Always available on both Web and Local)
app.include_router(system.router)
app.include_router(center_manager.router)
app.include_router(seating.router)
app.include_router(skill_analytics.router)
app.include_router(assignments.router)
app.include_router(users.router)

# Mount Local-Only Routers & Background Tasks (Only active in local desktop mode)
if APP_MODE != "web":
    try:
        from routers import questions, vocabulary, documents
        app.include_router(questions.router)
        app.include_router(vocabulary.router)
        app.include_router(documents.router)
    except Exception as e:
        print("Notice on importing local desktop routers:", e)
    try:
        import threading
        from services.cleanup_service import cleanup_temp_folders
        threading.Thread(target=cleanup_temp_folders, args=(BASE_DIR,), daemon=True).start()

        from services.sync_worker import start_sync_worker
        start_sync_worker()

        FILES_DIR = get_setting("files_dir")
        os.makedirs(FILES_DIR, exist_ok=True)

        pdf_preview_dir = os.path.join(BASE_DIR, "backend", "temp_pdf_previews")
        os.makedirs(pdf_preview_dir, exist_ok=True)
        app.mount("/pdf-previews", StaticFiles(directory=pdf_preview_dir), name="pdf-previews")
    except Exception as e:
        print("Notice on mounting local folders:", e)


# Static Frontend Serving for React (Only active in standalone local desktop server mode)
if APP_MODE != "web":
    frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
    frontend_assets = os.path.join(frontend_dist, "assets")
    if os.path.exists(frontend_assets):
        app.mount("/assets", StaticFiles(directory=frontend_assets), name="assets")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def serve_frontend(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        target_file = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(target_file) and os.path.isfile(target_file):
            return FileResponse(target_file)
            
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            settings = load_settings()
            theme = settings.get("theme", {})
            opacity = theme.get("opacity", 0.08)
            if opacity is None or float(opacity) < 0.05:
                opacity = 0.08
            blur = theme.get("blur", 24)
            border_opacity = theme.get("borderOpacity", 0.15)
            saturate = theme.get("saturate", 180)
            bg_image = theme.get("bgImage", "none")
            if not bg_image or bg_image == 'none' or str(bg_image).startswith('data:'):
                bg_image = "none"

            with open(index_file, "r", encoding="utf-8") as f:
                html_content = f.read()

            bg_css = "none" if bg_image == "none" else f"url('{bg_image}')"
            theme_style = f"""
            <style>
                :root {{
                    --glass-bg-opacity: {opacity};
                    --glass-blur: {blur}px;
                    --glass-border-opacity: {border_opacity};
                    --glass-saturate: {saturate}%;
                    --bg-image: {bg_css};
                }}
            </style>
            """
            html_content = html_content.replace("</head>", f"{theme_style}</head>")
            return HTMLResponse(content=html_content)
            
        return HTMLResponse(
            content="""
            <html>
                <body style="font-family:sans-serif;background:#090b14;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;">
                    <h2>Frontend is ready...</h2>
                    <p style="color:#94a3b8;">Đang tải lại giao diện...</p>
                    <script>setTimeout(() => location.reload(), 1500);</script>
                </body>
            </html>
            """,
            status_code=200
        )
