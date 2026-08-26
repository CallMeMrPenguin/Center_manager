import time
import threading
from typing import Dict, Any
from datetime import datetime
from services.sync_service import run_bidirectional_sync

_sync_trigger = threading.Event()
_worker_thread = None
_lock = threading.Lock()

_sync_state: Dict[str, Any] = {
    "status": "synced",  # 'synced' | 'syncing' | 'offline'
    "last_synced_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "last_error": None,
    "syncing": False,
    "pushed_count": 0,
    "pulled_count": 0,
}

def trigger_instant_sync():
    """Wakes up the background sync worker immediately (0ms latency)."""
    _sync_trigger.set()

def get_sync_status() -> Dict[str, Any]:
    """Returns the current real-time sync state."""
    with _lock:
        return dict(_sync_state)

def _worker_loop():
    """Background worker that executes near-instant delta syncs."""
    # Run initial sync on boot after short 2s warmup
    time.sleep(2)
    _sync_trigger.set()

    while True:
        # Wait until triggered or timeout for periodic 30s heartbeat
        _sync_trigger.wait(timeout=30.0)
        _sync_trigger.clear()

        with _lock:
            _sync_state["syncing"] = True
            _sync_state["status"] = "syncing"

        try:
            res = run_bidirectional_sync(force_full=False)
            with _lock:
                if res.get("success"):
                    _sync_state["status"] = "synced"
                    _sync_state["last_synced_at"] = res.get("synced_at")
                    _sync_state["last_error"] = None
                    _sync_state["pushed_count"] += res.get("pushed_records", 0)
                    _sync_state["pulled_count"] += res.get("pulled_records", 0)
                else:
                    _sync_state["status"] = "offline"
                    _sync_state["last_error"] = res.get("error")
        except Exception as e:
            with _lock:
                _sync_state["status"] = "offline"
                _sync_state["last_error"] = str(e)
        finally:
            with _lock:
                _sync_state["syncing"] = False

def start_sync_worker():
    """Starts the background sync worker daemon if not already running."""
    global _worker_thread
    if _worker_thread is None or not _worker_thread.is_alive():
        _worker_thread = threading.Thread(target=_worker_loop, daemon=True, name="SyncWorkerDaemon")
        _worker_thread.start()
