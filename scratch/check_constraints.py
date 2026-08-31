import sqlite3
import psycopg2
import psycopg2.extras
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('test_formatter.db')
conn.row_factory = sqlite3.Row
scur = conn.cursor()

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

# Check constraints on class_attendance_grades in Supabase
pcur.execute("""
    SELECT tc.constraint_type, tc.constraint_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'class_attendance_grades'
""")
print("Constraints in Supabase for class_attendance_grades:")
for r in pcur.fetchall():
    print(dict(r))

# Check sqlite constraints
scur.execute("PRAGMA index_list(class_attendance_grades)")
print("\nIndexes in SQLite for class_attendance_grades:")
for r in scur.fetchall():
    print(dict(r))
