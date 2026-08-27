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

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
SUPABASE_SESSION_POOLER_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require"

def get_target_db_url() -> str:
    raw_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL") or SUPABASE_DEFAULT_DB_URL
    if raw_url and raw_url.startswith("postgres://"):
        raw_url = "postgresql://" + raw_url[len("postgres://"):]
    if raw_url and "sslmode=" not in raw_url and "supabase.co" in raw_url:
        raw_url += ("&" if "?" in raw_url else "?") + "sslmode=require"
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
        # 4. Translate SQLite AUTOINCREMENT -> BIGSERIAL PRIMARY KEY
        adapted = re.sub(
            r'INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT',
            'BIGSERIAL PRIMARY KEY',
            adapted,
            flags=re.IGNORECASE
        )
        # 5. Translate ALTER TABLE ... ADD COLUMN ... -> ADD COLUMN IF NOT EXISTS
        adapted = re.sub(
            r'ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)',
            r'ALTER TABLE \1 ADD COLUMN IF NOT EXISTS ',
            adapted,
            flags=re.IGNORECASE
        )
        # 6. Translate CAST(... AS INTEGER) for PostgreSQL safe cast
        adapted = re.sub(
            r'CAST\s*\(\s*([a-zA-Z0-9_\.]+)\s+AS\s+INTEGER\s*\)',
            r"COALESCE(NULLIF(regexp_replace(CAST(\1 AS TEXT), '[^0-9]', '', 'g'), '')::integer, 0)",
            adapted,
            flags=re.IGNORECASE
        )
        # 7. Translate SQLite datetime('now', '-N days') -> (NOW() - INTERVAL 'N days')
        adapted = re.sub(
            r"datetime\s*\(\s*'now'\s*,\s*'-(\d+)\s+days'\s*\)",
            r"(NOW() - INTERVAL '\1 days')",
            adapted,
            flags=re.IGNORECASE
        )
        adapted = re.sub(
            r"datetime\s*\(\s*'now'\s*\)",
            r"NOW()",
            adapted,
            flags=re.IGNORECASE
        )
        return adapted

    def execute(self, sql: str, params=None):
        adapted_sql = self._adapt_sql(sql)
        
        table_match = re.match(r'^\s*INSERT\s+INTO\s+([a-zA-Z0-9_\.]+)', adapted_sql, re.IGNORECASE)
        table_name = table_match.group(1).lower().split('.')[-1] if table_match else ""
        has_id_col = table_name not in {"app_settings", "role_permissions", "class_students", "friend_group_members", "conflict_group_members", "conflict_relationships", "trusted_swap_relationships", "trusted_swap_students"}

        if table_match and has_id_col and "RETURNING" not in adapted_sql.upper():
            adapted_sql_with_returning = f"{adapted_sql.rstrip().rstrip(';')} RETURNING id;"
            param_tuple = tuple(params) if isinstance(params, (list, tuple)) else params
            try:
                self._cursor.execute("SAVEPOINT insert_sp;")
                if params is None:
                    res = self._cursor.execute(adapted_sql_with_returning)
                else:
                    res = self._cursor.execute(adapted_sql_with_returning, param_tuple)
                try:
                    row = self._cursor.fetchone()
                    if row and "id" in row:
                        self._last_insert_id = row["id"]
                except Exception:
                    pass
                self._cursor.execute("RELEASE SAVEPOINT insert_sp;")
                return res
            except Exception:
                try:
                    self._cursor.execute("ROLLBACK TO SAVEPOINT insert_sp;")
                except Exception:
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

    def _row_to_dict(self, row):
        if row is None:
            return None
        if isinstance(row, dict):
            return row
        if hasattr(self._cursor, 'description') and self._cursor.description:
            col_names = [d[0] for d in self._cursor.description]
            return dict(zip(col_names, row))
        return row

    def fetchone(self):
        row = self._cursor.fetchone()
        return self._row_to_dict(row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        if not rows:
            return []
        if isinstance(rows[0], dict):
            return rows
        if hasattr(self._cursor, 'description') and self._cursor.description:
            col_names = [d[0] for d in self._cursor.description]
            return [dict(zip(col_names, r)) for r in rows]
        return rows

    def fetchmany(self, size=None):
        rows = self._cursor.fetchmany(size) if size is not None else self._cursor.fetchmany()
        if not rows:
            return []
        if isinstance(rows[0], dict):
            return rows
        if hasattr(self._cursor, 'description') and self._cursor.description:
            col_names = [d[0] for d in self._cursor.description]
            return [dict(zip(col_names, r)) for r in rows]
        return rows

    def close(self):
        return self._cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


import urllib.parse

def connect_pg8000(url: str):
    """Pure-Python PostgreSQL connection with zero compiled C binary dependencies."""
    import pg8000.dbapi
    parsed = urllib.parse.urlparse(url)
    user = urllib.parse.unquote(parsed.username or "postgres")
    pwd = urllib.parse.unquote(parsed.password or "")
    host = parsed.hostname
    port = parsed.port or 5432
    db = parsed.path.lstrip('/') or "postgres"
    return pg8000.dbapi.connect(
        user=user,
        host=host,
        port=port,
        password=pwd,
        database=db,
        ssl_context=True,
        timeout=10
    )


class PgConnectionWrapper:
    def __init__(self, raw_conn, pool=None, is_pg8000=False):
        self._conn = raw_conn
        self._pool = pool
        self._is_pg8000 = is_pg8000
        self._is_closed = False

    def cursor(self):
        try:
            if getattr(self._conn, 'closed', False):
                target_url = get_target_db_url()
                if self._is_pg8000:
                    self._conn = connect_pg8000(target_url)
                else:
                    import psycopg2
                    self._conn = psycopg2.connect(target_url, connect_timeout=10)
            elif not self._is_pg8000:
                import psycopg2.extensions
                tx_status = self._conn.get_transaction_status()
                if tx_status == psycopg2.extensions.TRANSACTION_STATUS_INERROR:
                    self._conn.rollback()
        except Exception:
            try:
                target_url = get_target_db_url()
                self._conn = connect_pg8000(target_url)
                self._is_pg8000 = True
            except Exception:
                pass

        if self._is_pg8000:
            raw_cur = self._conn.cursor()
        else:
            import psycopg2.extras
            raw_cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return PgCursorWrapper(raw_cur)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        if self._is_closed:
            return
        self._is_closed = True
        if self._pool:
            try:
                self._pool.putconn(self._conn)
            except Exception:
                pass
        else:
            try:
                self._conn.close()
            except Exception:
                pass

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
        # 1. On Vercel / serverless cloud, prefer pg8000 (100% pure Python, zero binary issues)
        try:
            raw_conn = connect_pg8000(target_url)
            return PgConnectionWrapper(raw_conn, is_pg8000=True)
        except Exception as e_pg8000:
            print("[DB Connection] pg8000 connection attempt note:", e_pg8000)

        # 2. Try psycopg2 if available locally
        try:
            import psycopg2
            raw_conn = psycopg2.connect(target_url, connect_timeout=10)
            return PgConnectionWrapper(raw_conn, is_pg8000=False)
        except Exception as e_psycopg:
            print("[DB Connection] psycopg2 connection failed:", e_psycopg)
            for fallback_url in [SUPABASE_DEFAULT_DB_URL, SUPABASE_SESSION_POOLER_URL]:
                if target_url != fallback_url:
                    try:
                        raw_conn = connect_pg8000(fallback_url)
                        return PgConnectionWrapper(raw_conn, is_pg8000=True)
                    except Exception:
                        pass
            if IS_VERCEL:
                raise e_pg8000

    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn
