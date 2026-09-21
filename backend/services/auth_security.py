"""
Authentication & Token Security Service for Center Manager App.
Uses standard HMAC-SHA256 URL-safe tokens with expiration & integrity protection.
No third-party C-dependencies required.
"""
import os
import time
import json
import hmac
import hashlib
import base64
from typing import Dict, Any, Optional

SECRET_KEY = os.environ.get("AUTH_SECRET_KEY", "cm_secret_key_vps_center_manager_2026_secure").encode("utf-8")

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(user_data: Dict[str, Any], expires_in: int = 7 * 86400) -> str:
    """
    Creates a cryptographically signed HMAC-SHA256 token containing user claims and expiry.
    """
    now = int(time.time())
    payload = {
        "sub": user_data.get("username"),
        "username": user_data.get("username"),
        "user_id": user_data.get("id"),
        "display_name": user_data.get("display_name"),
        "role": user_data.get("role", "Giáo viên"),
        "iat": now,
        "exp": now + expires_in
    }
    payload_json = json.dumps(payload, separators=(',', ':'), ensure_ascii=False).encode("utf-8")
    payload_b64 = _b64url_encode(payload_json)
    
    signature = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _b64url_encode(signature)
    
    return f"{payload_b64}.{sig_b64}"

def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verifies the HMAC-SHA256 signature and expiry of the token.
    Raises ValueError on any invalid, expired, or tampered token.
    """
    if not token or "." not in token:
        raise ValueError("Token không đúng định dạng")
    
    parts = token.strip().split(".")
    if len(parts) != 2:
        raise ValueError("Token không hợp lệ")
    
    payload_b64, sig_b64 = parts[0], parts[1]
    
    expected_sig = hmac.new(SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
    expected_sig_b64 = _b64url_encode(expected_sig)
    
    # Constant-time comparison against timing attacks
    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        raise ValueError("Chữ ký token không hợp lệ hoặc đã bị can thiệp")
    
    try:
        payload_bytes = _b64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise ValueError("Không thể giải mã dữ liệu token")
    
    exp = payload.get("exp", 0)
    if int(time.time()) > exp:
        raise ValueError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại")
    
    return payload
