import sys
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports

# Test when class_id = 2 is requested
res = get_analytics_reports(class_id=2)
print("When class_id=2 requested:")
print("  analytics_summary std_dev:", res.get("analytics_summary", {}).get("std_dev"))
print("  class_analytics_map keys:", list(res.get("class_analytics_map", {}).keys()))
for cid, c_sum in res.get("class_analytics_map", {}).items():
    print(f"  class_id={cid} in map std_dev: {c_sum.get('std_dev')}")
