import os
import re
import sqlite3

DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")

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
        # 2. Translate GROUP_CONCAT -> string_agg if needed
        # (Though we also created group_concat aggregate in PostgreSQL)
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
    if DATABASE_URL:
        try:
            import psycopg2
            raw_conn = psycopg2.connect(DATABASE_URL)
            return PgConnectionWrapper(raw_conn)
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
