import time
import threading
from typing import Any, Optional, Dict

class MemoryTTLCache:
    """Thread-safe, lightweight in-memory cache with TTL and prefix invalidation."""
    def __init__(self, default_ttl_seconds: float = 3.0):
        self._default_ttl = default_ttl_seconds
        self._store: Dict[str, tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        now = time.monotonic()
        with self._lock:
            item = self._store.get(key)
            if item is None:
                return None
            expiry, value = item
            if now > expiry:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expiry = time.monotonic() + ttl
        with self._lock:
            # Prevent unbounded memory growth: cleanup expired if size exceeds 2000
            if len(self._store) > 2000:
                now = time.monotonic()
                self._store = {k: v for k, v in self._store.items() if v[0] > now}
            self._store[key] = (expiry, value)

    def invalidate(self, prefix: str) -> None:
        with self._lock:
            keys_to_del = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_del:
                self._store.pop(k, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

_global_cache = MemoryTTLCache(default_ttl_seconds=3.0)

def cache_get(key: str) -> Optional[Any]:
    return _global_cache.get(key)

def cache_set(key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
    _global_cache.set(key, value, ttl_seconds)

def cache_invalidate(prefix: str) -> None:
    _global_cache.invalidate(prefix)

def cache_clear() -> None:
    _global_cache.clear()
