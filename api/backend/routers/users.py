from fastapi import APIRouter, HTTPException
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

# --- Auth Endpoints ---
@router.post("/auth/login")
@router.post("/auth/login/")
@router.post("/users/login")
@router.post("/users/login/")
def login(payload: LoginRequest):
    try:
        user = authenticate_user(payload.username, payload.password)
        return {"success": True, "user": user}
    except ValueError as ve:
        raise HTTPException(status_code=401, detail=str(ve))
    except Exception as e:
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
