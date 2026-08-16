import sys
sys.path.insert(0, '.')
from backend.database.db_manager import get_connection, calculate_performance_analytics

def test_full_analytics(class_id=None, student_id=None):
    conn = get_connection()
    cursor = conn.cursor()

    # Always fetch all rows for student enrichment and class analytics
    cursor.execute("""
        SELECT ag.*, s.full_name as student_name, s.nickname, c.class_name
        FROM class_attendance_grades ag
        JOIN students s ON ag.student_id = s.id
        JOIN classes c ON ag.class_id = c.id
        JOIN class_students cs ON ag.student_id = cs.student_id AND ag.class_id = cs.class_id
        ORDER BY ag.date ASC
    """)
    all_rows = [dict(r) for r in cursor.fetchall()]

    filtered_rows = [
        r for r in all_rows 
        if (not class_id or r.get("class_id") == class_id) and 
           (not student_id or r.get("student_id") == student_id)
    ]

    rank_query = """
        SELECT 
            s.id as student_id,
            s.full_name,
            s.nickname,
            c.id as class_id,
            c.class_name,
            COUNT(ag.id) as total_sessions,
            SUM(CASE WHEN ag.status = 'Có mặt' THEN 1 ELSE 0 END) as present_count,
            AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END) as avg_check_1,
            AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END) as avg_check_2,
            AVG(CASE WHEN ag.homework > 0 THEN ag.homework END) as avg_homework
        FROM students s
        JOIN class_students cs ON s.id = cs.student_id
        JOIN classes c ON cs.class_id = c.id
        LEFT JOIN class_attendance_grades ag ON s.id = ag.student_id AND c.id = ag.class_id
        GROUP BY s.id, c.id
        ORDER BY (
            COALESCE(AVG(CASE WHEN ag.check_1 > 0 THEN ag.check_1 END), 0) + 
            COALESCE(AVG(CASE WHEN ag.check_2 > 0 THEN ag.check_2 END), 0) + 
            COALESCE(AVG(CASE WHEN ag.homework > 0 THEN ag.homework END), 0)
        ) DESC
    """
    cursor.execute(rank_query)
    raw_rankings = [dict(r) for r in cursor.fetchall()]
    conn.close()

    student_rows_map = {}
    for r in all_rows:
        sid = r.get("student_id")
        if sid is not None:
            student_rows_map.setdefault(sid, []).append(r)

    enriched_rankings = []
    for sr in raw_rankings:
        sid = sr.get("student_id")
        s_rows = student_rows_map.get(sid, [])
        if s_rows:
            s_analytics = calculate_performance_analytics(s_rows)
            sr["ema_level"] = s_analytics.get("ema_level", 0.0)
            sr["trend_slope"] = s_analytics.get("trend_slope", 0.0)
            sr["trend_label"] = s_analytics.get("trend_label", "Ổn định")
            sr["performance_index"] = s_analytics.get("performance_index", 0.0)
            sr["consistency_score"] = s_analytics.get("consistency_score", 100.0)
            sr["rating_label"] = s_analytics.get("rating_label", "Tốt")
            sr["predicted_next"] = s_analytics.get("predicted_next", 0.0)
            sr["std_dev"] = s_analytics.get("std_dev", 0.0)
        else:
            sr["ema_level"] = 0.0
            sr["trend_slope"] = 0.0
            sr["trend_label"] = "Chưa có dữ liệu"
            sr["performance_index"] = 0.0
            sr["consistency_score"] = 100.0
            sr["rating_label"] = "Chưa có dữ liệu"
            sr["predicted_next"] = 0.0
            sr["std_dev"] = 0.0
        enriched_rankings.append(sr)

    class_rows_map = {}
    for r in all_rows:
        cid = r.get("class_id")
        if cid is not None:
            class_rows_map.setdefault(cid, []).append(r)

    class_analytics_map = {}
    for cid_k, c_rows in class_rows_map.items():
        class_analytics_map[str(cid_k)] = calculate_performance_analytics(c_rows)

    analytics_summary = calculate_performance_analytics(filtered_rows)

    return {
        "session_records": filtered_rows,
        "student_rankings": enriched_rankings,
        "analytics_summary": analytics_summary,
        "class_analytics_map": class_analytics_map
    }

res = test_full_analytics(class_id=2) # When user selects Kid 9.1 (id=2)
print("Filtered session_records count (Kid 9.1):", len(res["session_records"]))
print("All student_rankings count:", len(res["student_rankings"]))
k81_students = [s for s in res["student_rankings"] if s["class_id"] == 5]
k91_students = [s for s in res["student_rankings"] if s["class_id"] == 2]
print(f"Kid 8.1 student count: {len(k81_students)}, Kid 9.1 student count: {len(k91_students)}")
print("Kid 9.1 analytics_summary std_dev:", res["analytics_summary"]["std_dev"])
print("Kid 8.1 in class_analytics_map std_dev:", res["class_analytics_map"]["5"]["std_dev"])
print("Kid 9.1 in class_analytics_map std_dev:", res["class_analytics_map"]["2"]["std_dev"])
