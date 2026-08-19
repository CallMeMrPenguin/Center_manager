import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('test_formatter.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print('Tables:', tables)

# Check students
st_rows = [dict(r) for r in cursor.execute('SELECT id, full_name, grade, nickname FROM students LIMIT 15').fetchall()]
print('Students:', json.dumps(st_rows, ensure_ascii=False, indent=2))

# Check classes
cl_rows = [dict(r) for r in cursor.execute('SELECT id, class_name, grade FROM classes LIMIT 15').fetchall()]
print('Classes:', json.dumps(cl_rows, ensure_ascii=False, indent=2))

# Check dates in class_attendance_grades
dates = [r[0] for r in cursor.execute('SELECT DISTINCT date FROM class_attendance_grades ORDER BY date').fetchall()]
print('Attendance Dates:', dates)

# Check units in question_bank
qb_units = [r[0] for r in cursor.execute('SELECT DISTINCT grade, unit FROM question_bank ORDER BY grade, unit').fetchall()]
print('QB Grade & Units:', qb_units)
