import os
import requests
from typing import Optional, Dict, Any

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://jttlekzqveygejvyhfqn.supabase.co").rstrip("/")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()

# Fallback default if not set in environment yet
if not SERVICE_ROLE_KEY:
    SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dGxla3pxdmV5Z2VqdnloZnFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzcwNDkyOCwiZXhwIjoyMTAzMjgwOTI4fQ.HdcJb7_8Fcwsk6qHVXss3Sqv_uMTti7O9t1VIxUQoIM"

def get_auth_headers() -> Dict[str, str]:
    return {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }

def format_user_email(username_or_email: str) -> str:
    """Standardizes username into valid email format for Supabase Auth."""
    clean = username_or_email.strip()
    if "@" not in clean:
        return f"{clean}@center.local"
    return clean

def sync_create_supabase_user(username: str, password: str, display_name: str, role: str) -> Optional[str]:
    """
    Creates or updates a user in Supabase auth.users via Admin API.
    Auto-confirms email so user can immediately sign in.
    """
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        return None

    email = format_user_email(username)
    endpoint = f"{SUPABASE_URL}/auth/v1/admin/users"

    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "display_name": display_name or username,
            "username": username,
            "role": role
        }
    }

    try:
        res = requests.post(endpoint, headers=get_auth_headers(), json=payload, timeout=6)
        if res.status_code in (200, 201):
            user_data = res.json()
            return user_data.get("id")
        elif res.status_code == 422:
            # User might already exist, update password and metadata instead
            sync_update_supabase_user(username, password=password, display_name=display_name, role=role)
            return None
    except Exception as e:
        print(f"[Supabase Auth] Create user error: {e}")
    return None

def sync_update_supabase_user(username: str, password: Optional[str] = None, display_name: Optional[str] = None, role: Optional[str] = None):
    """
    Updates an existing user's password or metadata in Supabase auth.users.
    """
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        return

    email = format_user_email(username)
    admin_endpoint = f"{SUPABASE_URL}/auth/v1/admin/users"

    try:
        # Search for user by email
        res = requests.get(f"{admin_endpoint}?per_page=1000", headers=get_auth_headers(), timeout=6)
        if res.status_code == 200:
            users_list = res.json().get("users", [])
            target = next((u for u in users_list if u.get("email") == email), None)
            if target:
                uid = target["id"]
                update_payload: Dict[str, Any] = {}
                if password and password.strip():
                    update_payload["password"] = password.strip()
                
                metadata = target.get("user_metadata", {})
                if display_name:
                    metadata["display_name"] = display_name
                if role:
                    metadata["role"] = role
                update_payload["user_metadata"] = metadata

                if update_payload:
                    requests.put(f"{admin_endpoint}/{uid}", headers=get_auth_headers(), json=update_payload, timeout=6)
    except Exception as e:
        print(f"[Supabase Auth] Update user error: {e}")

def sync_delete_supabase_user(username: str):
    """
    Deletes a user from Supabase auth.users.
    """
    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        return

    email = format_user_email(username)
    admin_endpoint = f"{SUPABASE_URL}/auth/v1/admin/users"

    try:
        res = requests.get(f"{admin_endpoint}?per_page=1000", headers=get_auth_headers(), timeout=6)
        if res.status_code == 200:
            users_list = res.json().get("users", [])
            target = next((u for u in users_list if u.get("email") == email), None)
            if target:
                uid = target["id"]
                requests.delete(f"{admin_endpoint}/{uid}", headers=get_auth_headers(), timeout=6)
    except Exception as e:
        print(f"[Supabase Auth] Delete user error: {e}")
