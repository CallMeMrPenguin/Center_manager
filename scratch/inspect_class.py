import sys
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports

for cid in [5, 2]:
    res = get_analytics_reports(class_id=cid)
    summary = res.get('analytics_summary', {})
    print(f"\n--- Class id={cid} ---")
    print("summary std_dev:", summary.get("std_dev"))
    print("summary std_dev_c1:", summary.get("std_dev_c1"))
    print("summary std_dev_c2:", summary.get("std_dev_c2"))
    print("summary std_dev_hw:", summary.get("std_dev_hw"))
    print("prediction_model:", summary.get("prediction_model"))
