import json
from typing import List, Dict, Any, Optional, Tuple
from database.connection import get_connection
from database.utils import trunc_1_dec, get_grade_weights

# ── Module-Level Tiered Prediction Engine ─────────────────────────────────────
def _ema_predict(vals: List[float]) -> Tuple[float, float]:
    """EMA predictor for very short histories (< 5 data points)."""
    N = len(vals)
    if N == 0:
        return 0.0, 0.0
    if N == 1:
        return 0.0, trunc_1_dec(vals[0])
    alpha = 0.5
    ema = vals[0]
    for v in vals[1:]:
        ema = alpha * v + (1 - alpha) * ema
    slope = (vals[-1] - vals[0]) / (N - 1)
    predicted = max(0.0, min(10.0, ema))
    return slope, trunc_1_dec(predicted)

def _weighted_ols_predict(vals: List[float]) -> Tuple[float, float]:
    """Weighted OLS for moderate histories (5-19 data points)."""
    N = len(vals)
    if N < 2:
        return _ema_predict(vals)
    x_vals = list(range(1, N + 1))
    weights = list(range(1, N + 1))  # session 1 -> weight 1, latest -> weight N
    w_total = float(sum(weights))
    mean_x = sum(w * x for w, x in zip(weights, x_vals)) / w_total
    mean_y = sum(w * y for w, y in zip(weights, vals)) / w_total
    num = sum(weights[i] * (x_vals[i] - mean_x) * (vals[i] - mean_y) for i in range(N))
    den = sum(weights[i] * (x_vals[i] - mean_x) ** 2 for i in range(N))
    slope = num / den if den != 0 else 0.0
    intercept = mean_y - slope * mean_x
    raw_pred = slope * (N + 1) + intercept
    predicted = max(0.0, min(10.0, raw_pred))
    return slope, trunc_1_dec(predicted)

def _holtwinters_predict(vals: List[float]) -> Tuple[float, float]:
    """Holt's Linear Trend Exponential Smoothing (ultra-fast pure Python 0.001ms)."""
    N = len(vals)
    if N < 2:
        return _ema_predict(vals)
    alpha = 0.35
    beta = 0.15
    level = vals[0]
    trend = vals[1] - vals[0] if N > 1 else 0.0
    for v in vals[1:]:
        last_level = level
        level = alpha * v + (1 - alpha) * (level + trend)
        trend = beta * (level - last_level) + (1 - beta) * trend
    raw_pred = level + trend
    predicted = max(0.0, min(10.0, raw_pred))
    return trend, trunc_1_dec(predicted)

def smart_predict(vals: List[float]) -> Tuple[float, float]:
    """Dispatch to the appropriate prediction model based on data volume."""
    N = len(vals)
    if N == 0:
        return 0.0, 0.0
    elif N < 5:
        return _ema_predict(vals)
    elif N < 20:
        return _weighted_ols_predict(vals)
    else:
        return _holtwinters_predict(vals)

def get_class_student_predictions(class_id: int, target_date: Optional[str] = None) -> Dict[int, Dict[str, Any]]:
    """Calculates granular smart predictions for each student in a class up to target_date."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ag.student_id, ag.check_1, ag.check_2, ag.homework, ag.mock_test, ag.status, ag.date, csess.test_config_json
            FROM class_attendance_grades ag
            LEFT JOIN class_sessions csess ON ag.class_id = csess.class_id AND ag.date = csess.date
            WHERE ag.class_id = ?
            ORDER BY ag.date ASC
        """, (class_id,))
        rows = [dict(r) for r in cursor.fetchall()]

        target_cfg: Dict[str, Any] = {}
        if target_date:
            cursor.execute("""
                SELECT test_config_json FROM class_sessions WHERE class_id = ? AND date = ?
            """, (class_id, target_date))
            t_row = cursor.fetchone()
            if t_row and t_row["test_config_json"]:
                try:
                    target_cfg = json.loads(t_row["test_config_json"]) or {}
                except Exception:
                    target_cfg = {}
    finally:
        conn.close()

    target_c1_obj = target_cfg.get("check_1") or {}
    target_c2_obj = target_cfg.get("check_2") or {}
    target_c1_skill = str(target_c1_obj.get("skill") or "vocab").lower().strip()
    target_c2_skill = str(target_c2_obj.get("skill") or "grammar").lower().strip()

    records_by_student: Dict[int, List[Dict[str, Any]]] = {}
    for r in rows:
        cfg_str = r.get("test_config_json")
        c1_skill = "vocab"
        c2_skill = "grammar"
        if cfg_str:
            try:
                cfg = json.loads(cfg_str)
                c1_info = cfg.get("check_1") or {}
                c2_info = cfg.get("check_2") or {}
                c1_skill = str(c1_info.get("skill") or "vocab").lower().strip()
                c2_skill = str(c2_info.get("skill") or "grammar").lower().strip()
            except Exception:
                pass
        r["c1_skill"] = c1_skill
        r["c2_skill"] = c2_skill

        sid = r["student_id"]
        if sid not in records_by_student:
            records_by_student[sid] = []
        records_by_student[sid].append(r)

    gw = get_grade_weights()
    w_c1 = gw.get("check_1", 0.55)
    w_c2 = gw.get("check_2", 0.35)
    w_hw = gw.get("homework", 0.10)
    w_mt = gw.get("mock_test", 0.0)

    predictions: Dict[int, Dict[str, Any]] = {}

    for sid, all_recs in records_by_student.items():
        # Select historical records before target_date if available
        if target_date:
            hist_recs = [r for r in all_recs if r.get("date", "") < target_date]
            if not hist_recs:
                hist_recs = [r for r in all_recs if r.get("date") != target_date]
        else:
            hist_recs = all_recs

        vocab_scores: List[float] = []
        grammar_scores: List[float] = []
        all_check_scores: List[float] = []
        hw_list: List[float] = []
        mt_list: List[float] = []
        overall_session_scores: List[float] = []

        for r in hist_recs:
            status = r.get("status", "Có mặt")
            if status in ("Vắng mặt", "Nghỉ học"):
                continue

            c1 = float(r.get("check_1")) if r.get("check_1") is not None and float(r.get("check_1") or 0) > 0 else None
            c2 = float(r.get("check_2")) if r.get("check_2") is not None and float(r.get("check_2") or 0) > 0 else None
            hw = float(r.get("homework")) if r.get("homework") is not None and float(r.get("homework") or 0) > 0 else None
            mt = float(r.get("mock_test")) if r.get("mock_test") is not None and float(r.get("mock_test") or 0) > 0 else None

            r_c1_skill = r.get("c1_skill", "vocab")
            r_c2_skill = r.get("c2_skill", "grammar")

            sess_vocab = []
            sess_grammar = []

            if c1 is not None:
                all_check_scores.append(c1)
                if r_c1_skill in ("grammar", "ngữ pháp"):
                    grammar_scores.append(c1)
                    sess_grammar.append(c1)
                else:
                    vocab_scores.append(c1)
                    sess_vocab.append(c1)

            if c2 is not None:
                all_check_scores.append(c2)
                if r_c2_skill in ("vocab", "từ vựng"):
                    vocab_scores.append(c2)
                    sess_vocab.append(c2)
                else:
                    grammar_scores.append(c2)
                    sess_grammar.append(c2)

            if hw is not None:
                hw_list.append(hw)

            if mt is not None:
                mt_list.append(mt)

            # Session weighted score
            w_sum = 0.0
            w_tot = 0.0
            if sess_vocab:
                avg_sv = sum(sess_vocab) / len(sess_vocab)
                w_sum += avg_sv * w_c1
                w_tot += w_c1
            elif c1 is not None and r_c1_skill not in ("grammar", "ngữ pháp"):
                w_sum += c1 * w_c1
                w_tot += w_c1

            if sess_grammar:
                avg_sg = sum(sess_grammar) / len(sess_grammar)
                w_sum += avg_sg * w_c2
                w_tot += w_c2
            elif c2 is not None and r_c2_skill not in ("vocab", "từ vựng"):
                w_sum += c2 * w_c2
                w_tot += w_c2

            if not sess_grammar and not sess_vocab:
                if c1 is not None:
                    w_sum += c1 * w_c1
                    w_tot += w_c1
                if c2 is not None:
                    w_sum += c2 * w_c2
                    w_tot += w_c2

            if hw is not None:
                w_sum += hw * w_hw
                w_tot += w_hw
            if mt is not None and w_mt > 0:
                w_sum += mt * w_mt
                w_tot += w_mt

            if w_tot > 0:
                overall_session_scores.append(w_sum / w_tot)

        _N_overall = len(overall_session_scores)
        if _N_overall < 5:
            _model_name = "EMA"
        elif _N_overall < 20:
            _model_name = "Weighted OLS"
        else:
            _model_name = "Holt-Winters"

        def _pred_opt(vals: List[float]) -> Optional[float]:
            if not vals:
                return None
            _, pv = smart_predict(vals)
            return trunc_1_dec(pv)

        # Predict based on configured skill type (entire vocab or grammar history, or both of same type)
        if target_c1_skill in ("grammar", "ngữ pháp"):
            pred_c1_val = _pred_opt(grammar_scores) or _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)
        elif target_c1_skill in ("vocab", "từ vựng"):
            pred_c1_val = _pred_opt(vocab_scores) or _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)
        else:
            pred_c1_val = _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)

        if target_c2_skill in ("vocab", "từ vựng"):
            pred_c2_val = _pred_opt(vocab_scores) or _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)
        elif target_c2_skill in ("grammar", "ngữ pháp"):
            pred_c2_val = _pred_opt(grammar_scores) or _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)
        else:
            pred_c2_val = _pred_opt(all_check_scores) or _pred_opt(overall_session_scores)

        pred_hw_val = _pred_opt(hw_list)
        pred_mt_val = _pred_opt(mt_list)
        pred_next_val = _pred_opt(overall_session_scores)

        predictions[sid] = {
            "pred_c1": pred_c1_val,
            "pred_c2": pred_c2_val,
            "pred_hw": pred_hw_val,
            "pred_mt": pred_mt_val,
            "pred_check_1": pred_c1_val,
            "pred_check_2": pred_c2_val,
            "pred_homework": pred_hw_val,
            "pred_mock_test": pred_mt_val,
            "predicted_next": pred_next_val,
            "prediction_model": _model_name,
        }

    return predictions

def get_class_attendance_with_predictions(class_id: int, date_str: str) -> Dict[str, Any]:
    """Retrieves class attendance rows enriched with student score predictions."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                s.id as student_id,
                s.full_name as student_name,
                s.nickname,
                ag.id as id,
                COALESCE(ag.status, 'Có mặt') as status,
                ag.check_1,
                ag.check_2,
                ag.homework,
                ag.mock_test,
                COALESCE(ag.notes, '') as notes,
                COALESCE(ag.date, ?) as date
            FROM class_students cs
            JOIN students s ON cs.student_id = s.id
            LEFT JOIN class_attendance_grades ag ON ag.class_id = cs.class_id AND ag.student_id = s.id AND ag.date = ?
            WHERE cs.class_id = ? AND (s.status IS NULL OR s.status NOT IN ('Đã nghỉ', 'Nghỉ', 'Nghỉ học', 'Tạm nghỉ'))
            ORDER BY s.full_name ASC
        """, (date_str, date_str, class_id))
        rows = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()

    preds = get_class_student_predictions(class_id, target_date=date_str)
    for r in rows:
        sid = r["student_id"]
        p = preds.get(sid, {})
        r["pred_check_1"] = p.get("pred_check_1")
        r["pred_check_2"] = p.get("pred_check_2")
        r["pred_homework"] = p.get("pred_homework")
        r["pred_mock_test"] = p.get("pred_mock_test")
        r["predicted_next"] = p.get("predicted_next")
        r["prediction_model"] = p.get("prediction_model")

    return {"date": date_str, "records": rows}
