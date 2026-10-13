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

PUBLIC_PATHS = {
    "/api/auth/login",
    "/api/auth/login/",
    "/api/users/login",
    "/api/users/login/",
    "/api/system/version",
    "/api/system/version/",
    "/api/users/heartbeat",
    "/api/users/heartbeat/",
    "/api/system/sync",
    "/api/system/sync/",
    "/api/sync/exchange",
    "/api/sync/exchange/",
    "/api/sync/trigger",
    "/api/sync/trigger/",
    "/api/sync/bidirectional",
    "/api/sync/bidirectional/",
}

FORBIDDEN_STUDENT_PREFIXES = (
    "/api/classes",
    "/api/students",
    "/api/teachers",
    "/api/reports",
    "/api/users",
    "/api/seating",
)

STUDENT_READ_RESTRICTED = (
    "/api/users",
    "/api/teachers",
    "/api/reports",
)

class SecurityGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("OPTIONS", "HEAD"):
            return await call_next(request)

        path = request.url.path.rstrip("/")
        normalized_path = path if path.startswith("/api") else f"/api{path}"

        # Allow non-API or public endpoints without auth token
        if not path.startswith("/api") or normalized_path in PUBLIC_PATHS or path in PUBLIC_PATHS:
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
                role = str(user_payload.get("role") or "").strip().lower()

                # Anti-tampering: Students cannot mutate classes, grades, or administrative data
                if role in ("học sinh", "student"):
                    if request.method in ("POST", "PUT", "DELETE", "PATCH"):
                        if any(normalized_path.startswith(prefix) for prefix in FORBIDDEN_STUDENT_PREFIXES):
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "success": False,
                                    "detail": "Quyền truy cập bị từ chối: Tài khoản học sinh không được phép thay đổi điểm số hoặc dữ liệu hệ thống."
                                }
                            )
                    elif request.method == "GET":
                        if any(normalized_path.startswith(prefix) for prefix in STUDENT_READ_RESTRICTED):
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "success": False,
                                    "detail": "Quyền truy cập bị từ chối: Tài khoản học sinh không có quyền xem thông tin này."
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

            # Check if this endpoint strictly requires auth even on desktop
            if normalized_path == "/api/users" or normalized_path.startswith("/api/users/"):
                return JSONResponse(
                    status_code=401,
                    content={"success": False, "detail": "Yêu cầu đăng nhập xác thực tài khoản để xem danh sách tài khoản."}
                )

            # On remote VPS/Web or in strict mode, reject unauthenticated access to protected API routes
            if app_mode in ("web", "vps", "server") or is_strict:
                return JSONResponse(
                    status_code=401,
                    content={
                        "success": False,
                        "detail": "Yêu cầu đăng nhập xác thực tài khoản giáo vụ để thực hiện thao tác này."
                    }
                )

        return await call_next(request)
