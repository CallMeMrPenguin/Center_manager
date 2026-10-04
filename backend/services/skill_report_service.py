import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from services.skill_mastery_service import (
    compute_skill_mastery_from_records,
    parse_test_config,
    trunc_1_dec
)


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
        SELECT sm.*, s.full_name as student_name, s.nickname, c.class_name, c.grade
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

    # 3. Compute overall Skill Stats with strict 1-decimal truncation
    vocab_scores = [r["ema_score"] for r in mastery_rows if r["skill"] == "vocab" and r.get("ema_score") is not None]
    grammar_scores = [r["ema_score"] for r in mastery_rows if r["skill"] == "grammar" and r.get("ema_score") is not None]
    mixed_scores = [r["ema_score"] for r in mastery_rows if r["skill"] not in ("vocab", "grammar") and r.get("ema_score") is not None]

    vocab_avg = trunc_1_dec(sum(vocab_scores) / len(vocab_scores)) if vocab_scores else 0.0
    grammar_avg = trunc_1_dec(sum(grammar_scores) / len(grammar_scores)) if grammar_scores else 0.0
    mixed_avg = trunc_1_dec(sum(mixed_scores) / len(mixed_scores)) if mixed_scores else 0.0

    mastered_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "mastered")
    partial_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "partial")
    regressed_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "regressed")
    not_yet_cnt = sum(1 for r in mastery_rows if r["mastery_status"] == "not_yet")
    total_instances = len(mastery_rows)

    mastery_rate = trunc_1_dec((mastered_cnt / total_instances * 100)) if total_instances > 0 else 0.0

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

    # 4. Group by Unit / Topic Breakdown (Disambiguate if multiple grades/classes present)
    distinct_grades = set(r.get("grade") or "" for r in mastery_rows if r.get("grade"))
    has_multiple_grades = len(distinct_grades) > 1 and not class_id

    unit_map: Dict[tuple, List[Dict[str, Any]]] = {}
    for r in mastery_rows:
        grade_str = str(r.get("grade") or "")
        clean_grade = "K" + "".join(filter(str.isdigit, grade_str)) if any(c.isdigit() for c in grade_str) else grade_str
        display_ukey = f"[{clean_grade}] {r['unit_key']}" if (has_multiple_grades and clean_grade) else r["unit_key"]

        k = (r["skill"], display_ukey)
        unit_map.setdefault(k, []).append({**r, "_display_unit_key": display_ukey})

    # Build unit name and grammar map from session test configs and unit_config
    session_topics: Dict[str, str] = {}
    session_grammar_topics: Dict[str, str] = {}
    try:
        cursor.execute("SELECT class_id, test_config_json FROM class_sessions WHERE test_config_json IS NOT NULL")
        for sc_cid, sc_tc in cursor.fetchall():
            tc_data = parse_test_config(sc_tc)
            if not tc_data:
                continue
            for chk in ["check_1", "check_2"]:
                c_item = tc_data.get(chk) or {}
                c_skill = str(c_item.get("skill") or "").strip()
                top = str(c_item.get("topic") or "").strip()
                gt = str(c_item.get("grammar_topic") or "").strip()
                for u in c_item.get("units") or []:
                    u_clean = str(u).strip()
                    if not u_clean:
                        continue
                    if top:
                        session_topics[f"{sc_cid}_{u_clean}"] = top
                        if u_clean not in session_topics:
                            session_topics[u_clean] = top
                    if gt:
                        session_grammar_topics[f"{sc_cid}_{u_clean}"] = gt
                        if u_clean not in session_grammar_topics:
                            session_grammar_topics[u_clean] = gt
                    elif c_skill == "grammar" and top:
                        session_grammar_topics[f"{sc_cid}_{u_clean}"] = top
                        if u_clean not in session_grammar_topics:
                            session_grammar_topics[u_clean] = top
    except Exception:
        pass

    try:
        from config.unit_config import load_unit_config
        unit_cfg_all = load_unit_config()
    except Exception:
        unit_cfg_all = {}

    import re
    def resolve_unit_name(u_key: str, cl_id: Optional[int] = None, gr_str: Optional[str] = None) -> str:
        clean_u = re.sub(r'\[K?\d+\]\s*', '', str(u_key)).strip()
        if cl_id and f"{cl_id}_{clean_u}" in session_topics:
            return session_topics[f"{cl_id}_{clean_u}"]
        if clean_u in session_topics:
            return session_topics[clean_u]
        g_match = re.search(r'\[K?(\d+)\]', str(u_key))
        g_val = g_match.group(1) if g_match else (re.search(r'(\d+)', str(gr_str)).group(1) if gr_str and re.search(r'(\d+)', str(gr_str)) else "6")
        u_match = re.search(r'(?:Unit|Bài)\s*(\d+)', clean_u, re.IGNORECASE)
        if u_match and g_val in unit_cfg_all:
            u_num = u_match.group(1)
            if u_num in unit_cfg_all[g_val]:
                entry = unit_cfg_all[g_val][u_num]
                return entry.get("name", "") if isinstance(entry, dict) else str(entry)
        return ""

    def resolve_unit_grammar(u_key: str, cl_id: Optional[int] = None, gr_str: Optional[str] = None) -> str:
        clean_u = re.sub(r'\[K?\d+\]\s*', '', str(u_key)).strip()
        if cl_id and f"{cl_id}_{clean_u}" in session_grammar_topics:
            return session_grammar_topics[f"{cl_id}_{clean_u}"]
        if clean_u in session_grammar_topics:
            return session_grammar_topics[clean_u]
        g_match = re.search(r'\[K?(\d+)\]', str(u_key))
        g_val = g_match.group(1) if g_match else (re.search(r'(\d+)', str(gr_str)).group(1) if gr_str and re.search(r'(\d+)', str(gr_str)) else "6")
        u_match = re.search(r'(?:Unit|Bài)\s*(\d+)', clean_u, re.IGNORECASE)
        if u_match and g_val in unit_cfg_all:
            u_num = u_match.group(1)
            if u_num in unit_cfg_all[g_val]:
                entry = unit_cfg_all[g_val][u_num]
                if isinstance(entry, dict):
                    return entry.get("grammar", "")
        return ""

    unit_breakdown = []
    for (skill, ukey), items in unit_map.items():
        scores = [it["ema_score"] for it in items if it.get("ema_score") is not None]
        avg_score = trunc_1_dec(sum(scores) / len(scores)) if scores else 0.0
        m_cnt = sum(1 for it in items if it["mastery_status"] == "mastered")
        p_cnt = sum(1 for it in items if it["mastery_status"] == "partial")
        r_cnt = sum(1 for it in items if it["mastery_status"] == "regressed")
        w_cnt = sum(1 for it in items if it["mastery_status"] == "not_yet")
        st_count = len(items)
        m_pct = trunc_1_dec((m_cnt / st_count * 100)) if st_count > 0 else 0.0

        item_grade = items[0].get("grade") if items else None
        item_cid = items[0].get("class_id") if items else None
        u_name = resolve_unit_name(ukey, cl_id=class_id or item_cid, gr_str=item_grade)
        u_grammar = resolve_unit_grammar(ukey, cl_id=class_id or item_cid, gr_str=item_grade)

        name_display = u_grammar if (skill == "grammar" and u_grammar) else (u_name or ukey)
        skill_label = "Ngữ pháp" if skill == "grammar" else "Từ vựng"

        if m_pct >= 75.0 or (avg_score >= 8.0 and w_cnt == 0):
            rec = f"Lớp làm chủ {skill_label} '{name_display}' rất tốt (TB {avg_score}, {m_pct}% nắm vững). Sẵn sàng chuyển giao bài học mới."
        elif avg_score < 5.0 or w_cnt >= max(3, int(st_count * 0.4)):
            if skill == "grammar":
                rec = f"Hổng cấu trúc diện rộng ({w_cnt}/{st_count} HS < 5đ, TB {avg_score}). Cần 1 buổi giảng lại quy tắc cốt lõi của '{name_display}' và luyện bài tập nhận biết."
            else:
                rec = f"Quên từ vựng nhiều ({w_cnt}/{st_count} HS < 5đ, TB {avg_score}). Nên tổ chức 15 phút flashcard đầu giờ và giao mini-test phản xạ từ vựng '{name_display}'."
        elif r_cnt > 0:
            rec = f"Phát hiện {r_cnt} HS từng đạt nhưng bị giảm sút ({w_cnt} HS cần kèm). Nên áp dụng bài tập xoắn ốc (spiral review) để ôn tập củng cố lại '{name_display}'."
        elif m_cnt >= 2 and w_cnt >= 2:
            rec = f"Lớp phân hóa mạnh ({m_cnt} HS đạt giỏi nhưng {w_cnt} HS dưới 5đ). Khuyến nghị chia đôi bạn kèm nhau hoặc giao bài tập phân hóa theo mức độ cho '{name_display}'."
        elif avg_score < 6.5 or w_cnt > 0:
            if skill == "grammar":
                rec = f"Khá nhiều học sinh vấp lỗi khi làm bài tập vận dụng ({w_cnt} HS cần phụ đạo, TB {avg_score}). Dành 10-15 phút chữa các bẫy đề điển hình của '{name_display}'."
            else:
                rec = f"Tốc độ phản xạ từ vựng chưa đồng đều ({w_cnt} HS cần phụ đạo, TB {avg_score}). Tăng cường bài tập điền từ theo ngữ cảnh câu thực tế cho '{name_display}'."
        elif m_pct >= 50.0 or avg_score >= 6.5:
            rec = f"Đa số học sinh tiếp thu khá ổn ({m_cnt + p_cnt}/{st_count} HS đạt, TB {avg_score}). Giao bài tập mở rộng cho nhóm trên và bổ trợ nhanh cho {w_cnt} em còn yếu."
        else:
            rec = f"Tỷ lệ nắm vững đạt {m_pct}% (TB {avg_score}). Khuyến nghị 1 buổi ôn tập củng cố trọng tâm '{name_display}' cho {w_cnt} học sinh nhóm dưới."

        unit_breakdown.append({
            "skill": skill,
            "unit_key": ukey,
            "unit_name": u_name,
            "grammar_topic": u_grammar,
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
    unique_units = []
    seen_units = set()
    for ub in unit_breakdown:
        k = (ub["unit_key"], ub["skill"])
        if k not in seen_units:
            seen_units.add(k)
            unique_units.append({
                "unit_key": ub["unit_key"],
                "unit_name": ub.get("unit_name", ""),
                "grammar_topic": ub.get("grammar_topic", ""),
                "skill": ub["skill"],
                "unit_id": f"{ub['unit_key']}__{ub['skill']}",
                "avg_score": ub["avg_score"],
                "mastery_pct": ub.get("mastery_pct", 0.0),
                "mastered_count": ub.get("mastered_count", 0),
                "student_count": ub.get("student_count", 0)
            })

    student_map: Dict[int, Dict[str, Any]] = {}
    for r in mastery_rows:
        sid = r["student_id"]
        grade_str = str(r.get("grade") or "")
        clean_grade = "K" + "".join(filter(str.isdigit, grade_str)) if any(c.isdigit() for c in grade_str) else grade_str
        display_ukey = f"[{clean_grade}] {r['unit_key']}" if (has_multiple_grades and clean_grade) else r["unit_key"]
        unit_id = f"{display_ukey}__{r['skill']}"

        if sid not in student_map:
            student_map[sid] = {
                "student_id": sid,
                "student_name": r["student_name"],
                "nickname": r.get("nickname") or "",
                "class_name": r.get("class_name") or "",
                "grade": r.get("grade") or "",
                "units": {}
            }
        
        u_name = resolve_unit_name(display_ukey, cl_id=r.get("class_id"), gr_str=r.get("grade"))
        u_grammar = resolve_unit_grammar(display_ukey, cl_id=r.get("class_id"), gr_str=r.get("grade"))
        unit_data = {
            "unit_key": display_ukey,
            "unit_name": u_name,
            "grammar_topic": u_grammar,
            "skill": r["skill"],
            "ema_score": r["ema_score"],
            "last_score": r.get("last_score"),
            "test_count": r["test_count"],
            "mastery_status": r["mastery_status"],
            "last_tested": r.get("last_tested")
        }
        student_map[sid]["units"][unit_id] = unit_data
        if display_ukey not in student_map[sid]["units"]:
            student_map[sid]["units"][display_ukey] = unit_data

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

            c1_skill = c1_cfg.get("skill") or "vocab"
            c2_skill = c2_cfg.get("skill") or "grammar"
            c1_units = c1_cfg.get("units") or ([c1_cfg.get("topic")] if c1_cfg.get("topic") else ["Chung"])
            c2_units = c2_cfg.get("units") or ([c2_cfg.get("topic") or c2_cfg.get("grammar_topic")] if (c2_cfg.get("topic") or c2_cfg.get("grammar_topic")) else ["Chung"])

            at_risk_students = []
            all_student_preds = []

            for st in heatmap_students:
                sid = st["student_id"]
                s_units = st.get("units", {})

                # Estimate c1 pred with multi-tier fallback
                c1_matched = []
                for u in c1_units:
                    k1 = f"{u}__{c1_skill}"
                    if k1 in s_units and s_units[k1].get("ema_score") is not None:
                        c1_matched.append(s_units[k1]["ema_score"])
                    elif u in s_units and s_units[u].get("ema_score") is not None and s_units[u].get("skill") == c1_skill:
                        c1_matched.append(s_units[u]["ema_score"])
                if c1_matched:
                    c1_pred = trunc_1_dec(sum(c1_matched) / len(c1_matched))
                else:
                    st_vocab = [v["ema_score"] for v in s_units.values() if v.get("skill") == c1_skill and v.get("ema_score") is not None]
                    if st_vocab:
                        c1_pred = trunc_1_dec(sum(st_vocab) / len(st_vocab))
                    elif vocab_avg > 0:
                        c1_pred = vocab_avg
                    else:
                        c1_pred = 7.0

                # Estimate c2 pred with multi-tier fallback
                c2_matched = []
                for u in c2_units:
                    k2 = f"{u}__{c2_skill}"
                    if k2 in s_units and s_units[k2].get("ema_score") is not None:
                        c2_matched.append(s_units[k2]["ema_score"])
                    elif u in s_units and s_units[u].get("ema_score") is not None and s_units[u].get("skill") == c2_skill:
                        c2_matched.append(s_units[u]["ema_score"])
                if c2_matched:
                    c2_pred = trunc_1_dec(sum(c2_matched) / len(c2_matched))
                else:
                    st_grammar = [v["ema_score"] for v in s_units.values() if v.get("skill") == c2_skill and v.get("ema_score") is not None]
                    if st_grammar:
                        c2_pred = trunc_1_dec(sum(st_grammar) / len(st_grammar))
                    elif grammar_avg > 0:
                        c2_pred = grammar_avg
                    else:
                        c2_pred = 7.0

                all_student_preds.append({
                    "student_id": sid,
                    "pred_c1": c1_pred,
                    "pred_c2": c2_pred,
                })

                if c1_pred < 6.5 or c2_pred < 6.5:
                    at_risk_students.append({
                        "student_id": sid,
                        "student_name": st["student_name"],
                        "nickname": st["nickname"],
                        "pred_c1": c1_pred,
                        "pred_c2": c2_pred,
                        "reason": f"Dự báo điểm dưới 6.5 ({'Check 1' if c1_pred < 6.5 else ''} {'Check 2' if c2_pred < 6.5 else ''}) do lịch sử chưa nắm vững kiến thức bài này."
                    })

            # Compute class-wide prediction summary metrics
            tot_st = len(all_student_preds)
            ready_cnt = sum(1 for p in all_student_preds if p["pred_c1"] >= 6.5 and p["pred_c2"] >= 6.5)
            mastered_cnt = sum(1 for p in all_student_preds if p["pred_c1"] >= 8.0 and p["pred_c2"] >= 8.0)
            avg_c1_pred = trunc_1_dec(sum(p["pred_c1"] for p in all_student_preds) / tot_st) if tot_st > 0 else 0.0
            avg_c2_pred = trunc_1_dec(sum(p["pred_c2"] for p in all_student_preds) / tot_st) if tot_st > 0 else 0.0
            readiness_rate = trunc_1_dec(ready_cnt / tot_st * 100) if tot_st > 0 else 0.0

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
                "class_overview": {
                    "total_students": tot_st,
                    "ready_count": ready_cnt,
                    "mastered_count": mastered_cnt,
                    "at_risk_count": len(at_risk_students),
                    "avg_c1_pred": avg_c1_pred,
                    "avg_c2_pred": avg_c2_pred,
                    "readiness_rate": readiness_rate
                },
                "at_risk_students": at_risk_students,
                "summary": f"Buổi học tới ({ns['date']}) kiểm tra {', '.join(c1_units)} và {', '.join(c2_units)}. Tỷ lệ sẵn sàng cả lớp: {readiness_rate}%. Có {len(at_risk_students)} học sinh có nguy cơ cần phụ đạo trước."
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
