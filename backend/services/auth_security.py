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
import secrets
from typing import Dict, Any, Optional

try:
    from config.settings import BASE_DIR
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def _load_or_create_secret() -> bytes:
    env_key = os.environ.get("AUTH_SECRET_KEY", "").strip()
    if env_key:
        return env_key.encode("utf-8")
    
    secret_file = os.path.join(BASE_DIR, ".auth_secret")
    try:
        if os.path.exists(secret_file):
            with open(secret_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    return content.encode("utf-8")
        
        # Generate persistent machine-specific 256-bit secure key
        generated = secrets.token_hex(32)
        with open(secret_file, "w", encoding="utf-8") as f:
            f.write(generated)
        return generated.encode("utf-8")
    except Exception:
        return b"cm_sec_key_persistent_2026_default_fallback"

SECRET_KEY = _load_or_create_secret()

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
