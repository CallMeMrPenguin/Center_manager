import os
from fastapi import APIRouter, HTTPException, Request, Header
from typing import Optional, Dict, Any
from services.http_sync import handle_sync_exchange

router = APIRouter(prefix="/api/sync", tags=["System Sync"])

@router.get("/status")
def api_get_sync_status():
    if os.environ.get("APP_MODE") in ("web", "vps", "server"):
        return {"status": "synced", "last_synced_at": "Trực tuyến (PostgreSQL Live)", "syncing": False}
    try:
        from services.sync_worker import get_sync_status
        return get_sync_status()
    except Exception as e:
        return {"status": "synced", "last_synced_at": None, "syncing": False, "error": str(e)}

@router.post("/trigger")
def api_trigger_sync():
    if os.environ.get("APP_MODE") in ("web", "vps", "server"):
        return {"success": True, "message": "Đang kết nối trực tiếp máy chủ PostgreSQL"}
    try:
        from services.sync_worker import trigger_instant_sync
        trigger_instant_sync()
        return {"success": True, "message": "Sync triggered"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/bidirectional")
def api_run_sync(force_full: bool = False):
    try:
        from services.sync_service import run_bidirectional_sync
        result = run_bidirectional_sync(force_full=force_full)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Sync failed"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/exchange")
async def api_sync_exchange(request: Request, x_sync_token: Optional[str] = Header(None)):
    try:
        body = await request.json()
        token = x_sync_token or request.headers.get("Authorization") or request.headers.get("authorization")
        result = handle_sync_exchange(body, token)
        if not result.get("success"):
            raise HTTPException(status_code=401 if "Unauthorized" in str(result.get("error")) else 500, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
