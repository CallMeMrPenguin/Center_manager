import sqlite3
import psycopg2
import psycopg2.extras
import sys
sys.path.append('backend')
from services.sync_service import FAST_SYNC_TABLES, HEAVY_STATIC_TABLES

sconn = sqlite3.connect('test_formatter.db')
scur = sconn.cursor()

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

for t in FAST_SYNC_TABLES + HEAVY_STATIC_TABLES:
    tbl = t["table"]
    scur.execute(f"PRAGMA table_info({tbl})")
    s_cols = [r[1] for r in scur.fetchall()]
    
    pcur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = %s", (tbl,))
    p_cols = [r["column_name"] for r in pcur.fetchall()]
    
    has_upd = "updated_at" in s_cols
    has_cre = "created_at" in s_cols
    print(f"{tbl:30} | SQLite cols: {len(s_cols)} | Postgres cols: {len(p_cols)} | updated_at: {has_upd} | created_at: {has_cre}")
