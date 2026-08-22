import sqlite3, os, sys
sys.stdout.reconfigure(encoding='utf-8')

db = 'test_formatter.db'
conn = sqlite3.connect(db)
c = conn.cursor()

c.execute("SELECT class_id, student_id, date, status, check_1, check_2, homework FROM class_attendance_grades WHERE date='2026-08-20' LIMIT 5")
print("Aug 20 records:")
for r in c.fetchall():
    print(r)

c.execute("SELECT COUNT(*) FROM class_attendance_grades WHERE date='2026-08-22'")
print("Aug 22 count:", c.fetchone()[0])

c.execute("SELECT COUNT(*) FROM class_attendance_grades WHERE check_1 IS NOT NULL OR check_2 IS NOT NULL OR homework IS NOT NULL")
print("Records with at least one score:", c.fetchone()[0])

c.execute("SELECT DISTINCT class_id, date, COUNT(*) as cnt FROM class_attendance_grades GROUP BY class_id, date ORDER BY date DESC LIMIT 10")
print("Summary per class/date:")
for r in c.fetchall():
    print(r)
conn.close()
