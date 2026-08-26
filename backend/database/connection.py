import os
import re
import sqlite3

IS_VERCEL = bool(
    os.environ.get("VERCEL")
    or os.environ.get("VERCEL_ENV")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("LAMBDA_TASK_ROOT")
    or os.environ.get("APP_MODE") == "web"
)

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
SUPABASE_SESSION_POOLER_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

def get_target_db_url() -> str:
    raw_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not raw_url and IS_VERCEL:
        raw_url = SUPABASE_DEFAULT_DB_URL
    if raw_url and raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]
    return raw_url

DATABASE_URL = get_target_db_url()

# Local SQLite Database Path
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "test_formatter.db"
)

class PgCursorWrapper:
    def __init__(self, raw_cursor):
        self._cursor = raw_cursor
        self._last_insert_id = None

    def _adapt_sql(self, sql: str) -> str:
        if not sql:
            return sql
        # 1. Translate parameter placeholder '?' -> '%s'
        adapted = sql.replace("?", "%s")
        # 2. Translate GROUP_CONCAT to STRING_AGG for PostgreSQL
        adapted = re.sub(
            r'GROUP_CONCAT\s*\(\s*DISTINCT\s+([^,\)]+)(?:,\s*[\'"][^\'"]*[\'"])?\s*\)',
            r"STRING_AGG(DISTINCT \1, ', ')",
            adapted,
            flags=re.IGNORECASE
        )
        adapted = re.sub(
            r'GROUP_CONCAT\s*\(\s*([^,\)]+)(?:,\s*[\'"][^\'"]*[\'"])?\s*\)',
            r"STRING_AGG(\1, ', ')",
            adapted,
            flags=re.IGNORECASE
        )
        # 3. Translate SQLite printf('%04d', id) -> LPAD(CAST(id AS TEXT), 4, '0')
        adapted = re.sub(
            r"printf\s*\(\s*'%0(\d+)d'\s*,\s*([^\)]+)\)",
            r"LPAD(CAST(\2 AS TEXT), \1, '0')",
            adapted,
            flags=re.IGNORECASE
        )
        return adapted

    def execute(self, sql: str, params=None):
        adapted_sql = self._adapt_sql(sql)
        
        # If it is an INSERT statement and doesn't have RETURNING id, append RETURNING id
        is_insert = bool(re.match(r'^\s*INSERT\s+INTO\s+', adapted_sql, re.IGNORECASE))
        if is_insert and "RETURNING" not in adapted_sql.upper():
            adapted_sql_with_returning = f"{adapted_sql.rstrip().rstrip(';')} RETURNING id;"
            try:
                if params is None:
                    res = self._cursor.execute(adapted_sql_with_returning)
                else:
                    res = self._cursor.execute(adapted_sql_with_returning, tuple(params) if isinstance(params, (list, tuple)) else params)
                try:
                    row = self._cursor.fetchone()
                    if row and "id" in row:
                        self._last_insert_id = row["id"]
                except Exception:
                    pass
                return res
            except Exception:
                # If table doesn't have 'id' column or RETURNING failed, fallback to standard execute
                pass

        if params is None:
            return self._cursor.execute(adapted_sql)
        else:
            return self._cursor.execute(adapted_sql, tuple(params) if isinstance(params, (list, tuple)) else params)

    def executemany(self, sql: str, seq_of_params):
        adapted_sql = self._adapt_sql(sql)
        return self._cursor.executemany(adapted_sql, seq_of_params)

    @property
    def lastrowid(self):
        return self._last_insert_id or getattr(self._cursor, 'lastrowid', None)

    @property
    def description(self):
        return self._cursor.description

    @property
    def rowcount(self):
        return self._cursor.rowcount

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def fetchmany(self, size=None):
        return self._cursor.fetchmany(size) if size is not None else self._cursor.fetchmany()

    def close(self):
        return self._cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class PgConnectionWrapper:
    def __init__(self, raw_conn):
        self._conn = raw_conn

    def cursor(self):
        import psycopg2.extras
        raw_cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return PgCursorWrapper(raw_cur)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()

    def execute(self, sql, params=None):
        cur = self.cursor()
        return cur.execute(sql, params)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()


def get_connection():
    target_url = get_target_db_url()
    if target_url:
        try:
            import psycopg2
            raw_conn = psycopg2.connect(target_url, connect_timeout=10)
            return PgConnectionWrapper(raw_conn)
        except Exception as e:
            print("[DB Connection] Primary PostgreSQL connection failed:", e)
            for fallback_url in [SUPABASE_DEFAULT_DB_URL, SUPABASE_SESSION_POOLER_URL]:
                if target_url != fallback_url:
                    try:
                        raw_conn = psycopg2.connect(fallback_url, connect_timeout=10)
                        return PgConnectionWrapper(raw_conn)
                    except Exception as e2:
                        print("[DB Connection] Fallback DB URL failed:", e2)
            if IS_VERCEL:
                raise e

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
