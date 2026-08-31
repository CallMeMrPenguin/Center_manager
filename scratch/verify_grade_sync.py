import sys
import os
import json
import sqlite3
sys.path.append('backend')

from database.connection import DB_PATH, get_target_db_url, SUPABASE_DEFAULT_DB_URL
from database.crud_scores_attendance import upsert_class_attendance_grades, get_class_attendance_grades
from database.analytics_predictions import get_class_attendance_with_predictions
from services.sync_service import run_bidirectional_sync

print("--- 1. Testing Sync Before Edits ---")
res = run_bidirectional_sync(force_full=False)
print("Initial delta sync:", res)

print("\n--- 2. Upserting Test Scores for 2026-08-29 on Class 5 ---")
# Get current class 5 students on 2026-08-29
att = get_class_attendance_with_predictions(5, '2026-08-29')
records = att.get('records', [])
print(f"Total students in class 5: {len(records)}")

test_records = []
for idx, r in enumerate(records):
    # Set scores for students
    score_val = 7.0 + (idx % 3) * 1.0 # 7.0, 8.0, 9.0
    test_records.append({
        'student_id': r['student_id'],
        'student_name': r['student_name'],
        'status': 'Có mặt',
        'check_1': score_val,
        'check_2': score_val,
        'homework': score_val,
        'mock_test': None,
        'notes': 'Test sync persistence'
    })

upsert_class_attendance_grades(5, '2026-08-29', test_records)
print("Saved scores to SQLite successfully.")

print("\n--- 3. Running Sync to Push Local Scores to Cloud ---")
push_res = run_bidirectional_sync(force_full=False)
print("Push sync result:", json.dumps(push_res, indent=2))

print("\n--- 4. Running Second Delta Sync (Should be 0 push, 0 pull) ---")
delta_res = run_bidirectional_sync(force_full=False)
print("Second delta sync result:", json.dumps(delta_res, indent=2))

print("\n--- 5. Verifying Data in SQLite ---")
local_grades = get_class_attendance_grades(5, '2026-08-29')
print(f"Total rows in SQLite for 2026-08-29: {len(local_grades)}")
with_scores_local = [r for r in local_grades if r.get('check_1') is not None]
print(f"Rows with check_1 in SQLite: {len(with_scores_local)}")

print("\n--- 6. Verifying Data in Supabase Cloud ---")
import psycopg2
import psycopg2.extras
pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
pcur.execute("SELECT * FROM class_attendance_grades WHERE class_id = 5 AND date = '2026-08-29'")
cloud_grades = [dict(r) for r in pcur.fetchall()]
print(f"Total rows in Supabase for 2026-08-29: {len(cloud_grades)}")
with_scores_cloud = [r for r in cloud_grades if r.get('check_1') is not None]
print(f"Rows with check_1 in Supabase: {len(with_scores_cloud)}")

assert len(with_scores_local) == len(test_records), f"Expected {len(test_records)} in SQLite, got {len(with_scores_local)}"
assert len(with_scores_cloud) == len(test_records), f"Expected {len(test_records)} in Supabase, got {len(with_scores_cloud)}"
print("\n>>> ALL VERIFICATION CHECKS PASSED 100%! <<<")
