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
    """Holt's Double Exponential Smoothing for rich histories (20+ data points)."""
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing
        model = ExponentialSmoothing(vals, trend="add", seasonal=None)
        fitted = model.fit(optimized=True, disp=False)
        predicted_val = float(fitted.forecast(1).iloc[0])
        predicted = max(0.0, min(10.0, predicted_val))
        trend_series = fitted.trend
        if trend_series is not None and len(trend_series) > 0:
            slope = float(trend_series.iloc[-1])
        else:
            slope = (vals[-1] - vals[0]) / (len(vals) - 1)
        return slope, trunc_1_dec(predicted)
    except Exception:
        return _weighted_ols_predict(vals)

def smart_predict(vals: List[float]) -> Tuple[float, float]:
    """Dispatch to the appropriate prediction model based on data volume."""
    N = len(vals)
    if N < 5:
        return _ema_predict(vals)
    elif N < 20:
        return _weighted_ols_predict(vals)
    else:
        return _holtwinters_predict(vals)

def get_class_student_predictions(class_id: int) -> Dict[int, Dict[str, float]]:
    import json
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ag.student_id, ag.check_1, ag.check_2, ag.homework, ag.status, csess.test_config_json
            FROM class_attendance_grades ag
            LEFT JOIN class_sessions csess ON ag.class_id = csess.class_id AND ag.date = csess.date
            WHERE ag.class_id = ?
            ORDER BY ag.date ASC
        """, (class_id,))
        rows = [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()

    records_by_student: Dict[int, List[Dict[str, Any]]] = {}
    for r in rows:
        cfg_str = r.get("test_config_json")
        c1_skill = "vocab"
        c2_skill = "grammar"
        if cfg_str:
            try:
                cfg = json.loads(cfg_str)
                c1_skill = (cfg.get("check_1") or {}).get("skill") or "vocab"
                c2_skill = (cfg.get("check_2") or {}).get("skill") or "grammar"
            except Exception:
                pass
        r["check_1_skill"] = c1_skill
        r["check_2_skill"] = c2_skill

        sid = r["student_id"]
        if sid not in records_by_student:
            records_by_student[sid] = []
        records_by_student[sid].append(r)

    gw = get_grade_weights()
    w_c1 = gw.get("check_1", 0.55)
    w_c2 = gw.get("check_2", 0.35)
    w_hw = gw.get("homework", 0.10)
    predictions: Dict[int, Dict[str, float]] = {}
    
    for sid, recs in records_by_student.items():
        vocab_list, grammar_list, hw_list = [], [], []
        overall_session_scores = []
        for r in recs:
            status = r.get("status", "Có mặt")
            if status in ("Vắng mặt", "Nghỉ học"):
                continue
            c1 = float(r.get("check_1") or 0)
            c2 = float(r.get("check_2") or 0)
            hw = float(r.get("homework") or 0)
            c1_s = str(r.get("check_1_skill") or "vocab").lower().strip()
            c2_s = str(r.get("check_2_skill") or "grammar").lower().strip()

            session_vocab = []
            session_grammar = []

            if c1 > 0:
                if c1_s in ("grammar", "ngữ pháp"):
                    grammar_list.append(c1)
                    session_grammar.append(c1)
                else:
                    vocab_list.append(c1)
                    session_vocab.append(c1)

            if c2 > 0:
                if c2_s in ("vocab", "từ vựng"):
                    vocab_list.append(c2)
                    session_vocab.append(c2)
                else:
                    grammar_list.append(c2)
                    session_grammar.append(c2)

            if hw > 0:
                hw_list.append(hw)

            w_sum = 0.0
            w_tot = 0.0
            if hw > 0:
                w_sum += hw * w_hw
                w_tot += w_hw
            if session_vocab:
                avg_sess_vocab = sum(session_vocab) / len(session_vocab)
                w_sum += avg_sess_vocab * w_c1
                w_tot += w_c1
            if session_grammar:
                avg_sess_grammar = sum(session_grammar) / len(session_grammar)
                w_sum += avg_sess_grammar * w_c2
                w_tot += w_c2

            if w_tot > 0:
                overall_session_scores.append(w_sum / w_tot)

        c1_list = vocab_list
        c2_list = grammar_list

        weighted_sum = 0.0
        weight_total = 0.0
        if hw_list:
            weighted_sum += (sum(hw_list) / len(hw_list)) * w_hw
            weight_total += w_hw
        if c1_list:
            weighted_sum += (sum(c1_list) / len(c1_list)) * w_c1
            weight_total += w_c1
        if c2_list:
            weighted_sum += (sum(c2_list) / len(c2_list)) * w_c2
            weight_total += w_c2

        academic_10 = (weighted_sum / weight_total) if weight_total > 0 else (sum(overall_session_scores) / len(overall_session_scores) if overall_session_scores else 0.0)

        _N_overall = len(overall_session_scores)
        if _N_overall < 5:
            _model_name = "EMA"
        elif _N_overall < 20:
            _model_name = "Weighted OLS"
        else:
            _model_name = "Holt-Winters"

        def _smart_pred(vals_list: List[float]) -> float:
            if not vals_list:
                return trunc_1_dec(academic_10)
            _, pv = smart_predict(vals_list)
            return pv

        predictions[sid] = {
            "pred_c1": _smart_pred(c1_list),
            "pred_c2": _smart_pred(c2_list),
            "pred_hw": _smart_pred(hw_list),
            "pred_vocab": _smart_pred(c1_list),
            "pred_grammar": _smart_pred(c2_list),
            "predicted_next": _smart_pred(overall_session_scores),
            "prediction_model": _model_name,
        }

    return predictions
