import os
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")

# Local SQLite Database Path
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "test_formatter.db"
)

def get_connection():
    if DATABASE_URL:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
            return conn
        except Exception as e:
            print("[DB Connection] PostgreSQL connection error, falling back to SQLite:", e)

    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA cache_size = -64000;")
        conn.execute("PRAGMA foreign_keys = ON;")
    except Exception:
        pass
    return conn
