import os
import json
import socket
import uuid

# Base directory of the application (root folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

DEFAULT_SETTINGS = {
    "files_dir": os.path.join(BASE_DIR, "workspace_files"),
    "machine_id": f"{socket.gethostname()}_{uuid.uuid4().hex[:6]}",
    "grade_weights": {
        "check_1": 35.0,
        "check_2": 55.0,
        "homework": 10.0
    },
    "grade_types": [
        {"id": "check_1", "label": "Check 1", "weight": 35.0, "color": "#3b82f6"},
        {"id": "check_2", "label": "Check 2", "weight": 55.0, "color": "#a855f7"},
        {"id": "homework", "label": "BTVN", "weight": 10.0, "color": "#f59e0b"}
    ]
}

def load_settings():
    if not os.path.exists(CONFIG_FILE):
        save_settings(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            settings = json.load(f)
            # Ensure all default keys exist
            for key, val in DEFAULT_SETTINGS.items():
                if key not in settings:
                    settings[key] = val
                elif isinstance(val, dict) and isinstance(settings[key], dict):
                    for sub_k, sub_v in val.items():
                        if sub_k not in settings[key]:
                            settings[key][sub_k] = sub_v
            return settings
    except Exception:
        return DEFAULT_SETTINGS

def save_settings(settings):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving settings: {e}")
        return False

def get_setting(key):
    settings = load_settings()
    return settings.get(key, DEFAULT_SETTINGS.get(key))

def set_setting(key, value):
    settings = load_settings()
    settings[key] = value
    save_settings(settings)
