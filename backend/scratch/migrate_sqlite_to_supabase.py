"""
Center Manager — SQLite to Supabase One-Click Data Migration Script
Usage:
    python backend/scratch/migrate_sqlite_to_supabase.py

Requirements:
    pip install psycopg2-binary
"""

import os
import sys
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor

# 1. Paths & Environment
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "test_formatter.db")
DATABASE_URL = os.environ.get("DATABASE_URL") or "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"

TABLES_TO_MIGRATE = [
    "students",
    "teachers_cm",
    "classes",
    "class_students",
    "class_schedule_weekly",
    "class_sessions",
    "class_seating",
    "courses",
    "student_scores",
    "class_attendance_grades",
    "friend_groups",
    "friend_group_members",
    "conflict_relationships",
    "trusted_swap_relationships",
    "conflict_groups",
    "conflict_group_members",
    "trusted_swap_students",
    "custom_time_phases",
    "assignments",
    "assignment_submissions",
    "app_users",
    "role_permissions"
]

def migrate():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    if not DATABASE_URL:
        print("[-] ERROR: DATABASE_URL environment variable is missing.")
        return

    if not os.path.exists(SQLITE_DB_PATH):
        print(f"[-] ERROR: SQLite database not found at {SQLITE_DB_PATH}")
        return

    print(f"[+] Connecting to SQLite: {SQLITE_DB_PATH}")
    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    print("[+] Connecting to Supabase PostgreSQL...")
    try:
        pg_conn = psycopg2.connect(DATABASE_URL)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"[-] Failed to connect to Supabase: {e}")
        return

    # Cache valid foreign keys
    try:
        pg_cur.execute("SELECT id FROM classes")
        valid_class_ids = set(r[0] for r in pg_cur.fetchall())
    except Exception:
        valid_class_ids = set()

    try:
        pg_cur.execute("SELECT id FROM students")
        valid_student_ids = set(r[0] for r in pg_cur.fetchall())
    except Exception:
        valid_student_ids = set()

    print("[+] Starting data migration...\n")

    for table in TABLES_TO_MIGRATE:
        try:
            # Check if table exists in SQLite
            sqlite_cur.execute(f"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{table}'")
            if sqlite_cur.fetchone()[0] == 0:
                print(f"  [~] Skipping '{table}' (not found in SQLite)")
                continue

            sqlite_cur.execute(f"SELECT * FROM {table}")
            rows = sqlite_cur.fetchall()
            if not rows:
                print(f"  [~] Table '{table}': 0 rows (empty)")
                continue

            columns = [desc[0] for desc in sqlite_cur.description]
            col_names = ", ".join(columns)
            placeholders = ", ".join(["%s"] * len(columns))

            insert_query = f"""
                INSERT INTO public.{table} ({col_names})
                VALUES ({placeholders})
                ON CONFLICT DO NOTHING
            """

            migrated_count = 0
            for r in rows:
                if 'class_id' in columns and valid_class_ids and r['class_id'] not in valid_class_ids:
                    continue
                if 'student_id' in columns and valid_student_ids and r['student_id'] not in valid_student_ids:
                    continue

                values = [r[col] for col in columns]
                try:
                    pg_cur.execute(insert_query, values)
                    migrated_count += 1
                except Exception:
                    pass

            pg_conn.commit()

            # Refresh cached IDs after classes / students migration
            if table == "classes":
                pg_cur.execute("SELECT id FROM classes")
                valid_class_ids = set(r[0] for r in pg_cur.fetchall())
            elif table == "students":
                pg_cur.execute("SELECT id FROM students")
                valid_student_ids = set(r[0] for r in pg_cur.fetchall())

            print(f"  [+] Migrated '{table}': {migrated_count} rows")

            # Update PostgreSQL sequence to prevent primary key collision
            if "id" in columns:
                try:
                    seq_query = f"SELECT setval(pg_get_serial_sequence('public.{table}', 'id'), COALESCE(MAX(id), 1)) FROM public.{table};"
                    pg_cur.execute(seq_query)
                    pg_conn.commit()
                except Exception:
                    pass

        except Exception as e:
            pg_conn.rollback()
            print(f"  [X] Error migrating '{table}': {e}")

    sqlite_conn.close()
    pg_conn.close()
    print("\n[+] Migration completed successfully!")

if __name__ == "__main__":
    migrate()
