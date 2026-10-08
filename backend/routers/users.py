import time
from fastapi import APIRouter, HTTPException, Request
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from database.crud_users import (
    get_users,
    create_user,
    update_user,
    delete_user,
    authenticate_user,
    get_role_permissions,
    save_role_permissions,
    change_user_password,
    get_roles_list,
    create_role,
    delete_role,
)

router = APIRouter(prefix="/api", tags=["Users & Permissions"])

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    display_name: str
    username: str
    password: str
    role: Optional[str] = "Giáo viên"
    status: Optional[str] = "Hoạt động"

class UserUpdate(BaseModel):
    display_name: str
    username: str
    password: Optional[str] = None
    role: Optional[str] = "Giáo viên"
    status: Optional[str] = "Hoạt động"

class RolePermissionsBatch(BaseModel):
    permissions: List[Dict[str, Any]]

class ChangePasswordRequest(BaseModel):
    username: str
    old_password: Optional[str] = ""
    new_password: str
    confirm_password: str
    is_admin: Optional[bool] = False

class RoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = ""

from services.auth_security import create_access_token

# In-memory sliding window rate limiter against brute-force password attacks
_FAILED_LOGINS: Dict[str, List[float]] = {}
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300  # 5 minutes

def _check_rate_limit(key: str):
    now = time.time()
    attempts = _FAILED_LOGINS.get(key, [])
    valid_attempts = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]
    _FAILED_LOGINS[key] = valid_attempts
    if len(valid_attempts) >= MAX_LOGIN_ATTEMPTS:
        remaining = int(LOCKOUT_WINDOW_SECONDS - (now - valid_attempts[0]))
        raise HTTPException(
            status_code=429,
            detail=f"Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau {max(1, remaining)} giây."
        )

def _record_login_failure(key: str):
    now = time.time()
    attempts = _FAILED_LOGINS.get(key, [])
    attempts.append(now)
    _FAILED_LOGINS[key] = [t for t in attempts if now - t < LOCKOUT_WINDOW_SECONDS]

def _clear_login_failures(key: str):
    _FAILED_LOGINS.pop(key, None)

# --- Auth Endpoints ---
@router.post("/auth/login")
@router.post("/auth/login/")
@router.post("/users/login")
@router.post("/users/login/")
def login(payload: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{payload.username.strip().lower()}"
    _check_rate_limit(rate_key)
    try:
        user = authenticate_user(payload.username, payload.password)
        _clear_login_failures(rate_key)
        token = create_access_token(user)
        return {"success": True, "user": user, "token": token}
    except ValueError as ve:
        _record_login_failure(rate_key)
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
        _record_login_failure(rate_key)
        raise HTTPException(status_code=500, detail=f"Lỗi đăng nhập hệ thống: {e}")

# --- Users Endpoints ---
@router.get("/users")
def list_users():
    try:
        return get_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users")
def add_user(payload: UserCreate):
    try:
        user_id = create_user(payload.model_dump())
        return {"success": True, "id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{user_id}")
def edit_user(user_id: int, payload: UserUpdate):
    try:
        update_user(user_id, payload.model_dump())
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{user_id}")
def remove_user(user_id: int):
    try:
        delete_user(user_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/sync-students")
def sync_students():
    try:
        from database.crud_users import sync_student_accounts
        return sync_student_accounts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/sync-staff")
def sync_staff():
    try:
        from database.crud_users import sync_staff_accounts
        return sync_staff_accounts()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/change-password")
def api_change_password(payload: ChangePasswordRequest):
    try:
        change_user_password(
            username=payload.username,
            old_password=payload.old_password or "",
            new_password=payload.new_password,
            confirm_password=payload.confirm_password,
            is_admin=payload.is_admin or False,
        )
        return {"success": True, "message": "Đổi mật khẩu thành công"}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Roles Endpoints ---
@router.get("/roles")
def list_roles():
    try:
        return get_roles_list()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/roles")
def add_role(payload: RoleCreate):
    try:
        rid = create_role(payload.role_name, payload.description or "")
        return {"success": True, "id": rid}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/roles/{role_name}")
def remove_role(role_name: str):
    try:
        delete_role(role_name)
        return {"success": True}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Role Permissions Endpoints ---
@router.get("/roles/permissions")
def list_role_permissions():
    try:
        return get_role_permissions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/roles/permissions")
def update_role_permissions(payload: RolePermissionsBatch):
    try:
        save_role_permissions(payload.permissions)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
