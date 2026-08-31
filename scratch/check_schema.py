import sqlite3
import psycopg2
import psycopg2.extras
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('test_formatter.db')
cur = conn.cursor()
cur.execute("PRAGMA table_info(class_attendance_grades)")
print("SQLite class_attendance_grades columns:")
for col in cur.fetchall():
    print(col)

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
pcur.execute("""
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'class_attendance_grades'
""")
print("\nSupabase class_attendance_grades columns:")
for col in pcur.fetchall():
    print(col)
