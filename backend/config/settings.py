import os
import json
import socket
import uuid

# Base directory of the application (root folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CONFIG_FILE = os.path.join(BASE_DIR, "config.json")

DEFAULT_SETTINGS = {
    "files_dir": os.path.join(BASE_DIR, "workspace_files"),
    "machine_id": f"{socket.gethostname()}_{uuid.uuid4().hex[:6]}"
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
