import sys
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports

res = get_analytics_reports() # All classes
print("All classes session_records:", len(res.get("session_records", [])))
print("All classes rankings:", len(res.get("student_rankings", [])))
print("All classes analytics_summary std_dev:", res.get("analytics_summary", {}).get("std_dev"))

# Let's group session_records by class_id and run calculate_performance_analytics
from backend.database.db_manager import calculate_performance_analytics
class_rows_map = {}
for r in res.get("session_records", []):
    cid = r.get("class_id")
    if cid:
        class_rows_map.setdefault(cid, []).append(r)

for cid, c_rows in class_rows_map.items():
    s_analytics = calculate_performance_analytics(c_rows)
    print(f"Class id={cid} calculated std_dev: {s_analytics.get('std_dev')}")
