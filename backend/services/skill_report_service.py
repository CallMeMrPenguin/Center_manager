import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from services.skill_mastery_service import compute_skill_mastery_from_records, parse_test_config


def get_skill_breakdown_report(conn, class_id: Optional[int] = None, student_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Generates a full pedagogical skill & unit breakdown report,
    including skill stats, unit breakdown, student mastery heatmap, and skill-aware prediction.
    """
    # 1. Update mastery records first
    compute_skill_mastery_from_records(conn, class_id, student_id)

    cursor = conn.cursor()

    # 2. Fetch all mastery records for this scope
    query = """
        SELECT sm.*, s.full_name as student_name, s.nickname, c.class_name
        FROM skill_mastery sm
        JOIN students s ON sm.student_id = s.id
        JOIN classes c ON sm.class_id = c.id
        WHERE 1=1
    """
    params = []
    if class_id:
        query += " AND sm.class_id = ?"
        params.append(class_id)
    if student_id:
        query += " AND sm.student_id = ?"
        params.append(student_id)
    query += " ORDER BY sm.skill ASC, sm.unit_key ASC"

    cursor.execute(query, params)
    mastery_rows = [dict(r) for r in cursor.fetchall()]

    # 3. Compute overall Skill Stats
    vocab_scores = [r["ema_score"] for r in mastery_rows if r["skill"] == "vocab" and r.get("ema_score") is not None]
    grammar_scores = [r["ema_score"] for r in mastery_rows if r["skill"] == "grammar" and r.get("ema_score") is not None]
    mixed_scores = [r["ema_score"] for r in mastery_rows if r["skill"] not in ("vocab", "grammar") and r.get("ema_score") is not None]

    vocab_avg = round(sum(vocab_scores) / len(vocab_scores), 1) if vocab_scores else 0.0
    grammar_avg = round(sum(grammar_scores) / len(grammar_scores), 1) if grammar_scores else 0.0
    mixed_avg = round(sum(mixed_scores) / len(mixed_scores), 1) if mixed_scores else 0.0

    mastered_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "mastered")
    partial_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "partial")
    regressed_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "regressed")
    not_yet_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "not_yet")
    total_instances = len(mastery_rows)

    mastery_rate = round((mastered_cnt / total_instances * 100), 1) if total_instances > 0 else 0.0

    skill_stats = {
        "vocab_avg": vocab_avg,
        "grammar_avg": grammar_avg,
        "mixed_avg": mixed_avg,
        "mastered_count": mastered_cnt,
        "partial_count": partial_cnt,
        "regressed_count": regressed_cnt,
        "not_yet_count": not_yet_cnt,
        "total_instances": total_instances,
        "mastery_rate": mastery_rate
    }

    # 4. Group by Unit / Topic Breakdown
    unit_map: Dict[tuple, List[Dict[str, Any]]] = {}
    for r in mastery_rows:
        k = (r["skill"], r["unit_key"])
        unit_map.setdefault(k, []).append(r)

    unit_breakdown = []
    for (skill, ukey), items in unit_map.items():
        scores = [it["ema_score"] for it in items if it.get("ema_score") is not None]
        avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
        m_cnt = sum(1 for it in items if it["mastery_status"] == "mastered")
        p_cnt = sum(1 for it in items if it["mastery_status"] == "partial")
        r_cnt = sum(1 for it in items if it["mastery_status"] == "regressed")
        w_cnt = sum(1 for it in items if it["mastery_status"] == "not_yet")
        st_count = len(items)
        m_pct = round((m_cnt / st_count * 100), 1) if st_count > 0 else 0.0

        if m_pct >= 75:
            rec = "Lớp nắm vững tốt, sẵn sàng chuyển sang bài học tiếp theo."
        elif m_pct >= 50:
            rec = "Khá ổn định, nên giao thêm bài tập mở rộng cho nhóm dưới."
        elif r_cnt > 0:
            rec = "Phát hiện học sinh giảm sút phong độ, cần kiểm tra ôn tập lại."
        else:
            rec = "Tỷ lệ nắm vững còn thấp, khuyến nghị 1 buổi phụ đạo củng cố."

        unit_breakdown.append({
            "skill": skill,
            "unit_key": ukey,
            "avg_score": avg_score,
            "student_count": st_count,
            "mastered_count": m_cnt,
            "partial_count": p_cnt,
            "regressed_count": r_cnt,
            "weak_count": w_cnt,
            "mastery_pct": m_pct,
            "recommendation": rec
        })

    unit_breakdown.sort(key=lambda x: (x["skill"], -x["avg_score"]))

    # 5. Build Mastery Heatmap Matrix
    # Get distinct units
    unique_units = []
    seen_units = set()
    for ub in unit_breakdown:
        if ub["unit_key"] not in seen_units:
            seen_units.add(ub["unit_key"])
            unique_units.append({
                "unit_key": ub["unit_key"],
                "skill": ub["skill"],
                "avg_score": ub["avg_score"]
            })

    # Group students
    student_map: Dict[int, Dict[str, Any]] = {}
    for r in mastery_rows:
        sid = r["student_id"]
        if sid not in student_map:
            student_map[sid] = {
                "student_id": sid,
                "student_name": r["student_name"],
                "nickname": r.get("nickname") or "",
                "class_name": r.get("class_name") or "",
                "units": {}
            }
        student_map[sid]["units"][r["unit_key"]] = {
            "skill": r["skill"],
            "ema_score": r["ema_score"],
            "last_score": r.get("last_score"),
            "test_count": r["test_count"],
            "mastery_status": r["mastery_status"],
            "last_tested": r.get("last_tested")
        }

    heatmap_students = list(student_map.values())
    heatmap_students.sort(key=lambda s: s["student_name"])

    # 6. Skill-aware Prediction for Next Upcoming Session
    today_str = datetime.now().strftime("%Y-%m-%d")
    upcoming_query = """
        SELECT id, class_id, date, test_config_json, notes
        FROM class_sessions
        WHERE date >= ? AND test_config_json IS NOT NULL AND TRIM(test_config_json) != ''
    """
    up_params = [today_str]
    if class_id:
        upcoming_query += " AND class_id = ?"
        up_params.append(class_id)
    upcoming_query += " ORDER BY date ASC LIMIT 1"

    cursor.execute(upcoming_query, up_params)
    next_session_row = cursor.fetchone()

    skill_prediction = None
    if next_session_row:
        ns = dict(next_session_row)
        cfg = parse_test_config(ns.get("test_config_json"))
        if cfg:
            c1_cfg = cfg.get("check_1") or {}
            c2_cfg = cfg.get("check_2") or {}

            c1_units = c1_cfg.get("units") or ([c1_cfg.get("topic")] if c1_cfg.get("topic") else ["Chung"])
            c2_units = c2_cfg.get("units") or ([c2_cfg.get("topic") or c2_cfg.get("grammar_topic")] if (c2_cfg.get("topic") or c2_cfg.get("grammar_topic")) else ["Chung"])

            at_risk_students = []
            for st in heatmap_students:
                sid = st["student_id"]
                s_units = st.get("units", {})

                # Estimate c1 pred
                c1_matched = [s_units[u]["ema_score"] for u in c1_units if u in s_units]
                c1_pred = round(sum(c1_matched) / len(c1_matched), 1) if c1_matched else (vocab_avg if c1_cfg.get("skill") == "vocab" else 7.5)

                # Estimate c2 pred
                c2_matched = [s_units[u]["ema_score"] for u in c2_units if u in s_units]
                c2_pred = round(sum(c2_matched) / len(c2_matched), 1) if c2_matched else (grammar_avg if c2_cfg.get("skill") == "grammar" else 7.5)

                if c1_pred < 6.5 or c2_pred < 6.5:
                    at_risk_students.append({
                        "student_id": sid,
                        "student_name": st["student_name"],
                        "nickname": st["nickname"],
                        "pred_c1": c1_pred,
                        "pred_c2": c2_pred,
                        "reason": f"Dự báo điểm dưới 6.5 ({'Check 1' if c1_pred < 6.5 else ''} {'Check 2' if c2_pred < 6.5 else ''}) do lịch sử chưa nắm vững kiến thức bài này."
                    })

            skill_prediction = {
                "has_upcoming_config": True,
                "session_date": ns["date"],
                "check_1_info": {
                    "skill": c1_cfg.get("skill", "vocab"),
                    "units": c1_units,
                    "topic": c1_cfg.get("topic", "")
                },
                "check_2_info": {
                    "skill": c2_cfg.get("skill", "grammar"),
                    "units": c2_units,
                    "topic": c2_cfg.get("grammar_topic") or c2_cfg.get("topic", "")
                },
                "at_risk_students": at_risk_students,
                "summary": f"Buổi học tới ({ns['date']}) kiểm tra {', '.join(c1_units)} và {', '.join(c2_units)}. Có {len(at_risk_students)} học sinh có nguy cơ cần phụ đạo trước."
            }
        else:
            skill_prediction = {
                "has_upcoming_config": False,
                "summary": "Chưa có cấu hình bài kiểm tra cho buổi học tiếp theo."
            }
    else:
        skill_prediction = {
            "has_upcoming_config": False,
            "summary": "Chưa có lịch buổi học tiếp theo có cấu hình bài kiểm tra."
        }

    # 7. List of sessions that have test_config_json
    cursor.execute("""
        SELECT s.id, s.class_id, s.date, s.test_config_json, c.class_name
        FROM class_sessions s
        JOIN classes c ON s.class_id = c.id
        WHERE s.test_config_json IS NOT NULL AND TRIM(s.test_config_json) != ''
        ORDER BY s.date DESC
        LIMIT 30
    """)
    config_sessions = [dict(r) for r in cursor.fetchall()]
    for cs in config_sessions:
        cs["test_config"] = parse_test_config(cs.get("test_config_json"))

    return {
        "skill_stats": skill_stats,
        "unit_breakdown": unit_breakdown,
        "mastery_heatmap": {
            "units": unique_units,
            "students": heatmap_students
        },
        "skill_aware_prediction": skill_prediction,
        "configured_sessions": config_sessions
    }
