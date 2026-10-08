"""
Security & Anti-Tampering Middleware.
Validates JWT/HMAC authorization tokens on all mutating HTTP methods (POST, PUT, DELETE, PATCH).
Prevents role elevation, DevTools payload tampering, and unauthorized grade/student mutations.
"""
import os
import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from services.auth_security import verify_access_token

PUBLIC_MUTATION_PATHS = {
    "/api/auth/login",
    "/api/auth/login/",
    "/api/users/login",
    "/api/users/login/",
    "/api/system/sync",
    "/api/system/sync/",
    "/api/sync/exchange",
    "/api/sync/trigger",
    "/api/sync/bidirectional",
    "/api/sync/config",
}

FORBIDDEN_STUDENT_PREFIXES = (
    "/api/classes",
    "/api/students",
    "/api/teachers",
    "/api/reports",
    "/api/users",
    "/api/seating",
)

SENSITIVE_READ_PREFIXES = (
    "/api/users",
    "/api/system/settings",
    "/api/sync/config",
)

SYNC_SECRET_KEY = os.environ.get("SYNC_SECRET_KEY", "cm_sync_secret_vps_center_manager_2026")

class SecurityGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path.rstrip("/")
        normalized_path = path if path.startswith("/api") else f"/api{path}"

        # 1. Allow pure CORS preflights and HEAD
        if request.method in ("OPTIONS", "HEAD"):
            return await call_next(request)

        # 2. Check sync authorization header
        req_sync_key = request.headers.get("X-Sync-Key") or request.headers.get("x-sync-key")
        is_authorized_sync = bool(req_sync_key and req_sync_key.strip() == SYNC_SECRET_KEY)

        # Extract Authorization token if present
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        token = None
        if auth_header and auth_header.strip().startswith("Bearer "):
            token = auth_header.strip()[7:].strip()

        # 3. Handle GET read requests
        if request.method == "GET":
            if not any(normalized_path.startswith(prefix) for prefix in SENSITIVE_READ_PREFIXES):
                return await call_next(request)

            if is_authorized_sync:
                return await call_next(request)

            app_mode = os.environ.get("APP_MODE", "local").lower()
            is_strict = os.environ.get("STRICT_AUTH", "false").lower() in ("true", "1")

            if token:
                try:
                    user_payload = verify_access_token(token)
                    role = str(user_payload.get("role") or "").strip()
                    if role in ("Học sinh", "student", "Student"):
                        return JSONResponse(
                            status_code=403,
                            content={"success": False, "detail": "Quyền truy cập bị từ chối đối với tài khoản học sinh."}
                        )
                    request.state.user = user_payload
                    return await call_next(request)
                except ValueError as ve:
                    if app_mode in ("web", "vps", "server") or is_strict:
                        return JSONResponse(status_code=401, content={"success": False, "detail": str(ve)})
                    return await call_next(request)

            if app_mode in ("web", "vps", "server") or is_strict:
                return JSONResponse(
                    status_code=401,
                    content={"success": False, "detail": "Yêu cầu đăng nhập xác thực tài khoản để truy cập dữ liệu này."}
                )
            return await call_next(request)

        # 2. Allow login & authenticated sync endpoints
        if (
            normalized_path in PUBLIC_MUTATION_PATHS
            or path in PUBLIC_MUTATION_PATHS
            or normalized_path.startswith("/api/sync")
        ):
            # For /api/sync/exchange on VPS, require either sync key or user token or local mode
            if normalized_path == "/api/sync/exchange" and os.environ.get("APP_MODE") in ("web", "vps", "server"):
                auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
                has_token = bool(auth_header and auth_header.strip().startswith("Bearer "))
                if not is_authorized_sync and not has_token:
                    return JSONResponse(
                        status_code=401,
                        content={"success": False, "detail": "Yêu cầu mã khóa bảo mật đồng bộ (X-Sync-Key) để trao đổi dữ liệu."}
                    )
            response = await call_next(request)
            return response

        if is_authorized_sync:
            return await call_next(request)

        # Extract Authorization header
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        token = None
        if auth_header and auth_header.strip().startswith("Bearer "):
            token = auth_header.strip()[7:].strip()

        # If token is provided, strictly verify signature and user role
        if token:
            try:
                user_payload = verify_access_token(token)
                role = str(user_payload.get("role") or "").strip()

                # Anti-tampering: Students cannot mutate classes, grades, or administrative data
                if role in ("Học sinh", "student", "Student"):
                    if any(normalized_path.startswith(prefix) for prefix in FORBIDDEN_STUDENT_PREFIXES):
                        return JSONResponse(
                            status_code=403,
                            content={
                                "success": False,
                                "detail": "Quyền truy cập bị từ chối: Tài khoản học sinh không được phép thay đổi điểm số hoặc dữ liệu hệ thống."
                            }
                        )

                # Attach validated user into request state
                request.state.user = user_payload
            except ValueError as ve:
                return JSONResponse(
                    status_code=401,
                    content={"success": False, "detail": str(ve)}
                )
        else:
            # If no token provided:
            app_mode = os.environ.get("APP_MODE", "local").lower()
            is_strict = os.environ.get("STRICT_AUTH", "false").lower() in ("true", "1")
            
            # On remote VPS/Web or in strict mode, reject any unauthenticated mutation
            if app_mode in ("web", "vps", "server") or is_strict:
                return JSONResponse(
                    status_code=401,
                    content={
                        "success": False,
                        "detail": "Yêu cầu đăng nhập xác thực tài khoản giáo vụ để thực hiện thao tác này."
                    }
                )

        response = await call_next(request)

        # In local desktop mode, automatically wake up sync worker after successful mutation
        if response.status_code < 400 and os.environ.get("APP_MODE") not in ("web", "vps", "server"):
            if not normalized_path.startswith("/api/sync"):
                try:
                    from services.sync_worker import trigger_instant_sync
                    trigger_instant_sync()
                except Exception:
                    pass

        return response

