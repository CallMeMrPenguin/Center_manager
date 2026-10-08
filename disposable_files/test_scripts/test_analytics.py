import sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, '.')
from backend.database.db_manager import get_analytics_reports

res = get_analytics_reports()
print('Rankings count:', len(res['student_rankings']))
print('Session records count:', len(res['session_records']))
print('All session records count:', len(res['all_session_records']))
print('Class analytics map keys:', list(res['class_analytics_map'].keys()))
for cid, stats in res['class_analytics_map'].items():
    print(f"Class {cid}: Academic={stats.get('academic_score')} - EMA={stats.get('ema_level')}")
print('First 3 rankings:', [{'name': r['full_name'], 'grade': r.get('student_grade'), 'class_id': r.get('class_id'), 'ema': r.get('ema_level')} for r in res['student_rankings'][:3]])
