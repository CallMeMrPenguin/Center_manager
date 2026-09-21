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
}

FORBIDDEN_STUDENT_PREFIXES = (
    "/api/classes",
    "/api/students",
    "/api/teachers",
    "/api/reports",
    "/api/users",
    "/api/seating",
)

class SecurityGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow all safe read-only methods (GET, OPTIONS, HEAD)
        if request.method in ("GET", "OPTIONS", "HEAD"):
            return await call_next(request)

        path = request.url.path.rstrip("/")
        normalized_path = path if path.startswith("/api") else f"/api{path}"

        # Allow login endpoints without auth token
        if normalized_path in PUBLIC_MUTATION_PATHS or path in PUBLIC_MUTATION_PATHS:
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

        return await call_next(request)
