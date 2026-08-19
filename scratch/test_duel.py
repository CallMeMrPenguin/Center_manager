import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports, get_classes

res = get_analytics_reports()
classes = get_classes()
rankings = res['student_rankings']
sessions = res['all_session_records']
class_map = res['class_analytics_map']

print("Classes:", [{'id': c['id'], 'name': c['class_name']} for c in classes])
print("Total rankings:", len(rankings))
for c in classes:
    c_students = [s for s in rankings if s.get('class_id') == c['id']]
    c_sessions = [r for r in sessions if r.get('class_id') == c['id']]
    print(f"Class {c['id']} ({c['class_name']}): {len(c_students)} students, {len(c_sessions)} session records, analytics={class_map.get(str(c['id'])) is not None}")
