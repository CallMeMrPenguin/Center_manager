"""
FastAPI Security Guard & RBAC Dependencies.
Protects sensitive mutation endpoints from script injection, unauthorized access,
and unauthorized role elevation.
"""
from fastapi import Request, HTTPException, status
from typing import Dict, Any, Optional
from services.auth_security import verify_access_token

STAFF_ROLES = {"Quản trị viên", "Giáo viên", "Trợ giảng", "Kế toán", "admin", "teacher", "staff"}

def extract_bearer_token(request: Request) -> Optional[str]:
    """Extracts bearer token from Authorization header or cookie/query."""
    auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
    if auth_header and auth_header.strip().startswith("Bearer "):
        return auth_header.strip()[7:].strip()
    return None

def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Mandatory authentication dependency.
    Raises 401 Unauthorized if missing, expired or tampered token.
    """
    token = extract_bearer_token(request)
    if not token:
        # Check if running in local desktop offline dev mode without auth headers
        # but if client sends request, we enforce valid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc chưa được xác thực hoặc token không hợp lệ. Vui lòng đăng nhập lại."
        )
    try:
        user_payload = verify_access_token(token)
        return user_payload
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )

def require_staff_or_admin(request: Request) -> Dict[str, Any]:
    """
    RBAC dependency ensuring only teachers, assistants, or administrators
    can perform state-mutating actions (saving grades, editing classes/students).
    Students are strictly forbidden (403 Forbidden).
    """
    token = extract_bearer_token(request)
    # If no token is provided:
    if not token:
        # In desktop app single-user mode, fallback check or enforce login:
        # To avoid breaking existing desktop sessions if user hasn't logged in yet,
        # we check client header 'X-Client-App': 'CenterManagerDesktop' or require login.
        # However, to meet the user's explicit rule against devtools/scripts tampering:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu xác thực tài khoản giáo vụ/quản trị viên trước khi thực hiện."
        )

    try:
        user = verify_access_token(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    user_role = str(user.get("role") or "").strip()
    if user_role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tài khoản vai trò '{user_role}' không có quyền chỉnh sửa dữ liệu hoặc chấm điểm."
        )

    return user
