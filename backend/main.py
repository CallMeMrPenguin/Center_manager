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

from routers import (
    system,
    questions,
    vocabulary,
    documents,
    center_manager,
    seating
)

# Initialize App & Database
init_db()
app = FastAPI(title="Center Manager & Test Formatter API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(system.router)
app.include_router(questions.router)
app.include_router(vocabulary.router)
app.include_router(documents.router)
app.include_router(center_manager.router)
app.include_router(seating.router)

# Directories Initialization
FILES_DIR = get_setting("files_dir")
os.makedirs(FILES_DIR, exist_ok=True)

pdf_preview_dir = os.path.join(BASE_DIR, "backend", "temp_pdf_previews")
os.makedirs(pdf_preview_dir, exist_ok=True)
app.mount("/pdf-previews", StaticFiles(directory=pdf_preview_dir), name="pdf-previews")

# Static Frontend Serving for React
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

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
            bg_image = theme.get("bgImage", "")
            if bg_image == 'none' or not bg_image or str(bg_image).startswith('data:'):
                bg_image = "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/f0733c36-a64b-4f7c-b06c-3c679f8ddbc1_3840w.webp"

            with open(index_file, "r", encoding="utf-8") as f:
                html_content = f.read()

            theme_style = f"""
            <style>
                :root {{
                    --glass-bg-opacity: {opacity};
                    --glass-blur: {blur}px;
                    --glass-border-opacity: {border_opacity};
                    --glass-saturate: {saturate}%;
                    --bg-image: url('{bg_image}');
                }}
            </style>
            """
            html_content = html_content.replace("</head>", f"{theme_style}</head>")
            return HTMLResponse(content=html_content)
        raise HTTPException(status_code=404, detail="Index file not found")
else:
    @app.get("/")
    def root_offline_warning():
        return {"message": "FastAPI is running. Frontend has not been built yet. Run 'npm run build' inside frontend/ to compile React UI."}
