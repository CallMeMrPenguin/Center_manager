import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('test_formatter.db')
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Check specific records for 29
cur.execute("SELECT * FROM class_attendance_grades WHERE date = '2026-08-29'")
sample = [dict(r) for r in cur.fetchall()]
print('RECORDS FOR 2026-08-29 in SQLite:')
for r in sample:
    print(r)

# Check Supabase as well
try:
    import psycopg2
    import psycopg2.extras
    SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
    pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
    pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    pcur.execute("SELECT * FROM class_attendance_grades WHERE date = '2026-08-29'")
    cloud_sample = [dict(r) for r in pcur.fetchall()]
    print('\nRECORDS FOR 2026-08-29 in Supabase PostgreSQL:')
    for r in cloud_sample:
        print(r)
except Exception as e:
    print("Supabase check error:", e)
