import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('test_formatter.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

# Check records for 2026-08-13
recs_13 = [dict(r) for r in cursor.execute("""
    SELECT ag.*, s.full_name, c.class_name, c.grade as class_grade, s.grade as student_grade 
    FROM class_attendance_grades ag
    JOIN students s ON ag.student_id = s.id
    JOIN classes c ON ag.class_id = c.id
    WHERE ag.date = '2026-08-13'
""").fetchall()]

print(f"Records on 2026-08-13 ({len(recs_13)}):")
print(json.dumps(recs_13, ensure_ascii=False, indent=2))

# Check student_scores
sc_rows = [dict(r) for r in cursor.execute("SELECT * FROM student_scores LIMIT 20").fetchall()]
print(f"Student scores ({len(sc_rows)}):", json.dumps(sc_rows, ensure_ascii=False, indent=2))
