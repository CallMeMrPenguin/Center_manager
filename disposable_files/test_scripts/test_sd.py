import sys
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports, get_classes

classes = get_classes()
for c in classes:
    res = get_analytics_reports(class_id=c['id'])
    summary = res.get('analytics_summary', {})
    print(f"Class {c['class_name']} (id={c['id']}) std_dev={summary.get('std_dev')}")
    print(f"  records count: {len(res.get('session_records', []))}")
