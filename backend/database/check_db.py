import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

db = 'test_formatter.db'
conn = sqlite3.connect(db)
c = conn.cursor()

c.execute("PRAGMA table_info(class_attendance_grades)")
print("=== class_attendance_grades schema ===")
for r in c.fetchall():
    print(r)
conn.close()
