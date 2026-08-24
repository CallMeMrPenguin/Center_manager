import sys
import os
import glob

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

print("=" * 60)
print("1. CHECKING FILE LINE COUNTS (Strict Max 500 lines)")
print("=" * 60)
db_files = glob.glob(os.path.join(backend_dir, "database", "*.py"))
all_passed = True
for f in sorted(db_files):
    if f.endswith(".backup.py"):
        continue
    with open(f, encoding="utf-8") as fp:
        lines = len(fp.readlines())
    status = "OK (<500)" if lines <= 500 else "VIOLATION (>500)"
    if lines > 500:
        all_passed = False
    print(f"  {os.path.basename(f):30s}: {lines:4d} lines -> {status}")

if all_passed:
    print("\n  [SUCCESS] All database files are strictly under 500 lines!")
else:
    print("\n  [FAIL] Some files exceed 500 lines limit!")

print("\n" + "=" * 60)
print("2. TESTING IMPORT OF ALL DATABASE FUNCTIONS VIA db_manager")
print("=" * 60)
try:
    import database.db_manager as db
    all_exports = getattr(db, "__all__", [])
    print(f"  Successfully imported db_manager with {len(all_exports)} exported symbols.")
    
    missing = [name for name in all_exports if not hasattr(db, name)]
    if missing:
        print(f"  [ERROR] Missing attributes in db_manager: {missing}")
    else:
        print("  [SUCCESS] All 101+ symbols exist in db_manager!")
except Exception as e:
    print(f"  [ERROR] Failed to import database.db_manager: {e}")

print("\n" + "=" * 60)
print("3. RUNNING TEST QUERIES & ANALYTICS")
print("=" * 60)
try:
    import database.db_manager as db
    conn = db.get_connection()
    print("  get_connection() -> OK")
    conn.close()
    
    db.init_db()
    print("  init_db() -> OK")
    
    classes = db.get_classes()
    print(f"  get_classes() -> {len(classes)} classes")
    
    students = db.get_students()
    print(f"  get_students() -> {len(students)} students")
    
    reports = db.get_analytics_reports()
    print(f"  get_analytics_reports() -> keys: {list(reports.keys())}")
    
    test_analytics = db.calculate_performance_analytics([])
    print(f"  calculate_performance_analytics([]) -> academic_score={test_analytics.get('academic_score')}, rating_label={test_analytics.get('rating_label')}")
    
    print("  [SUCCESS] All core analytics and database operations tested successfully!")
except Exception as e:
    print(f"  [ERROR] Database query test failed: {e}")
