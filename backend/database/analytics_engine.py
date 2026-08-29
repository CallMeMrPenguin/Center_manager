import math
from typing import List, Dict, Any, Optional
from database.utils import trunc_1_dec, get_grade_weights
from database.analytics_predictions import smart_predict

def calculate_performance_analytics(session_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    gw = get_grade_weights()
    w_c1 = gw.get("check_1", 0.55)
    w_c2 = gw.get("check_2", 0.35)
    w_hw = gw.get("homework", 0.10)

    if not session_records:
        return {
            "academic_score": 0.0,
            "trend_slope": 0.0,
            "trend_label": "Chưa có dữ liệu",
            "consistency_score": 100.0,
            "std_dev": 0.0,
            "std_dev_c1": 0.0,
            "std_dev_c2": 0.0,
            "std_dev_hw": 0.0,
            "consistency_label": "Chưa có dữ liệu",
            "ema_level": 0.0,
            "ema_score": 0.0,
            "ema_c1": 0.0,
            "ema_c2": 0.0,
            "ema_hw": 0.0,
            "ema_vocab": 0.0,
            "ema_grammar": 0.0,
            "att_pct": 100.0,
            "attendance_pct": 100.0,
            "performance_index": 0.0,
            "rating_label": "Chưa có dữ liệu",
            "predicted_next": 0.0,
            "pred_overall": 0.0,
            "pred_c1": 0.0,
            "pred_c2": 0.0,
            "pred_hw": 0.0,
            "pred_vocab": 0.0,
            "pred_grammar": 0.0,
            "avg_vocab": 0.0,
            "avg_grammar": 0.0,
            "model_used": "None",
            "prediction_model": "None",
            "fitted_c1": [],
            "fitted_c2": [],
            "fitted_hw": [],
            "recommendations": ["Chưa có dữ liệu buổi học để phân tích."]
        }

    vocab_list, grammar_list, hw_list = [], [], []
    overall_session_scores = []
    present_count = 0

    for r in session_records:
        status = r.get("status", "Có mặt")
        if status in ("Vắng mặt", "Nghỉ học"):
            continue

        present_count += 1
        c1 = float(r.get("check_1") or 0)
        c2 = float(r.get("check_2") or 0)
        hw = float(r.get("homework") or 0)
        c1_skill = str(r.get("check_1_skill") or "vocab").lower().strip()
        c2_skill = str(r.get("check_2_skill") or "grammar").lower().strip()

        session_vocab = []
        session_grammar = []

        if c1 > 0:
            if c1_skill in ("grammar", "ngữ pháp"):
                grammar_list.append(c1)
                session_grammar.append(c1)
            else:
                vocab_list.append(c1)
                session_vocab.append(c1)

        if c2 > 0:
            if c2_skill in ("vocab", "từ vựng"):
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

    if not overall_session_scores:
        overall_session_scores = [0.0]

    weighted_sum = 0.0
    weight_total = 0.0

    if hw_list:
        avg_hw = sum(hw_list) / len(hw_list)
        weighted_sum += avg_hw * w_hw
        weight_total += w_hw
    else:
        avg_hw = 0.0

    if c1_list:
        avg_c1 = sum(c1_list) / len(c1_list)
        weighted_sum += avg_c1 * w_c1
        weight_total += w_c1
    else:
        avg_c1 = 0.0

    if c2_list:
        avg_c2 = sum(c2_list) / len(c2_list)
        weighted_sum += avg_c2 * w_c2
        weight_total += w_c2
    else:
        avg_c2 = 0.0

    if weight_total > 0:
        academic_10 = weighted_sum / weight_total
    else:
        academic_10 = sum(overall_session_scores) / len(overall_session_scores) if overall_session_scores else 0.0

    academic_score = academic_10 * 10.0

    valid_overall = [x for x in overall_session_scores if x > 0]
    slope_overall, pred_overall = smart_predict(valid_overall) if valid_overall else (0.0, 0.0)
    slope_c1, pred_c1 = smart_predict(c1_list) if c1_list else (0.0, 0.0)
    slope_c2, pred_c2 = smart_predict(c2_list) if c2_list else (0.0, 0.0)
    slope_hw, pred_hw = smart_predict(hw_list) if hw_list else (0.0, 0.0)

    _N = len(valid_overall)
    if _N < 5:
        prediction_model = "EMA"
    elif _N < 20:
        prediction_model = "Weighted OLS"
    else:
        prediction_model = "Holt-Winters"

    def _fitted_ema(vals: List[float]) -> List[float]:
        if not vals:
            return []
        alpha = 0.5
        fitted: List[float] = []
        ema_v = vals[0]
        for v in vals:
            ema_v = alpha * v + (1 - alpha) * ema_v
            fitted.append(trunc_1_dec(max(0.0, min(10.0, ema_v))))
        return fitted

    def _fitted_wols(vals: List[float]) -> List[float]:
        N = len(vals)
        if N < 2:
            return vals[:]
        x_vals = list(range(1, N + 1))
        weights = [0.85 ** (N - 1 - i) for i in range(N)]
        sum_w = sum(weights)
        mean_x = sum(w * x for w, x in zip(weights, x_vals)) / sum_w
        mean_y = sum(w * y for w, y in zip(weights, vals)) / sum_w
        num = sum(weights[i] * (x_vals[i] - mean_x) * (vals[i] - mean_y) for i in range(N))
        den = sum(weights[i] * (x_vals[i] - mean_x) ** 2 for i in range(N))
        slope = num / den if den != 0 else 0.0
        intercept = mean_y - slope * mean_x
        return [trunc_1_dec(max(0.0, min(10.0, slope * x + intercept))) for x in x_vals]

    def _fitted_holtwinters(vals: List[float]) -> List[float]:
        N = len(vals)
        if N < 2:
            return _fitted_ema(vals)
        alpha = 0.35
        beta = 0.15
        level = vals[0]
        trend = vals[1] - vals[0] if N > 1 else 0.0
        fitted = [trunc_1_dec(vals[0])]
        for v in vals[1:]:
            last_level = level
            level = alpha * v + (1 - alpha) * (level + trend)
            trend = beta * (level - last_level) + (1 - beta) * trend
            fitted.append(trunc_1_dec(max(0.0, min(10.0, level + trend))))
        return fitted

    def get_fitted_values(vals: List[float]) -> List[float]:
        N = len(vals)
        if N < 5:
            return _fitted_ema(vals)
        elif N < 20:
            return _fitted_wols(vals)
        else:
            return _fitted_holtwinters(vals)

    fitted_c1 = get_fitted_values(c1_list) if c1_list else []
    fitted_c2 = get_fitted_values(c2_list) if c2_list else []
    fitted_hw = get_fitted_values(hw_list) if hw_list else []

    if slope_overall > 0.3:
        trend_label = "Tăng trưởng mạnh ↗"
    elif slope_overall >= 0.1:
        trend_label = "Đang cải thiện"
    elif slope_overall >= -0.1:
        trend_label = "Ổn định"
    elif slope_overall >= -0.3:
        trend_label = "Giảm nhẹ"
    else:
        trend_label = "Suy giảm nhanh"

    trend_score = max(0.0, min(100.0, 50.0 + (slope_overall * 25.0)))

    def _calc_sd(vals: List[float], fitted_vals: Optional[List[float]] = None) -> float:
        if len(vals) < 2:
            return 0.0
        if fitted_vals and len(fitted_vals) == len(vals):
            v = sum((actual - fitted) ** 2 for actual, fitted in zip(vals, fitted_vals)) / len(vals)
        else:
            m = sum(vals) / len(vals)
            v = sum((x - m) ** 2 for x in vals) / len(vals)
        return math.sqrt(v)

    std_dev_c1 = _calc_sd(c1_list, fitted_c1)
    std_dev_c2 = _calc_sd(c2_list, fitted_c2)
    std_dev_hw = _calc_sd(hw_list, fitted_hw)

    sd_w_sum = 0.0
    sd_w_total = 0.0
    if hw_list:
        sd_w_sum += std_dev_hw * w_hw
        sd_w_total += w_hw
    if c1_list:
        sd_w_sum += std_dev_c1 * w_c1
        sd_w_total += w_c1
    if c2_list:
        sd_w_sum += std_dev_c2 * w_c2
        sd_w_total += w_c2

    std_dev = (sd_w_sum / sd_w_total) if sd_w_total > 0 else 0.0
    consistency_score = max(0.0, min(100.0, 100.0 - (std_dev * 15.0)))

    if std_dev < 0.5:
        consistency_label = "Rất ổn định"
    elif std_dev <= 1.0:
        consistency_label = "Ổn định"
    elif std_dev <= 2.2:
        consistency_label = "Biến động"
    elif std_dev <= 3.8:
        consistency_label = "Biến động mạnh"
    else:
        consistency_label = "Phân hóa cực lớn"

    def _calc_ema(vals: List[float]) -> float:
        if not vals:
            return 0.0
        e = vals[0]
        alpha = 0.5
        for v in vals[1:]:
            e = alpha * v + (1 - alpha) * e
        return e

    ema_c1 = _calc_ema(c1_list)
    ema_c2 = _calc_ema(c2_list)
    ema_hw = _calc_ema(hw_list)

    ema_w_sum = 0.0
    ema_w_tot = 0.0
    if hw_list:
        ema_w_sum += ema_hw * w_hw
        ema_w_tot += w_hw
    if c1_list:
        ema_w_sum += ema_c1 * w_c1
        ema_w_tot += w_c1
    if c2_list:
        ema_w_sum += ema_c2 * w_c2
        ema_w_tot += w_c2

    ema = (ema_w_sum / ema_w_tot) if ema_w_tot > 0 else (valid_overall[0] if valid_overall else 0.0)
    ema_score = max(0.0, min(100.0, ema * 10.0))

    total_rec_count = len(session_records)
    att_pct = (present_count / total_rec_count * 100) if total_rec_count > 0 else 100.0

    performance_index = (ema_score * 0.40) + (trend_score * 0.25) + (consistency_score * 0.15) + (academic_score * 0.10) + (att_pct * 0.10)
    performance_index = max(0.0, min(100.0, performance_index))

    if performance_index >= 90:
        rating_label = "Xuất Sắc"
    elif performance_index >= 80:
        rating_label = "Giỏi / Rất Tốt"
    elif performance_index >= 65:
        rating_label = "Khá"
    elif performance_index >= 50:
        rating_label = "Trung Bình"
    elif performance_index >= 35:
        rating_label = "Yếu (Hổng Kiến Thức)"
    else:
        rating_label = "Kém (Cần Phụ Đạo)"

    recs = []
    if slope_overall < -0.1:
        recs.append("Cảnh báo: Xu hướng điểm số đang giảm sút, cần giáo viên trao đổi trực tiếp.")
    if hw_list and avg_hw < 7.0:
        recs.append("Khuyên dùng: Cho học sinh luyện tập thêm bài tập về nhà để củng cố kiến thức căn bản.")
    if att_pct < 85:
        recs.append(f"Cảnh báo: Tỷ lệ vắng mặt cao ({att_pct:.0f}%), ảnh hưởng đến khả năng tiếp thu.")

    if std_dev >= 4.0:
        recs.append(f"Cảnh báo phân cực cực độ: Lớp học có sự chênh lệch trình độ rất lớn (SD = {std_dev:.1f}). Cần khẩn cấp chia nhóm phụ đạo riêng biệt hoặc áp dụng bài tập phân hóa.")
    elif std_dev >= 2.2:
        recs.append(f"Cảnh báo phân hóa mạnh: Khoảng cách học lực trong lớp khá cao (SD = {std_dev:.1f}). Giáo viên nên giao bài mở rộng cho nhóm giỏi và bài củng cố cho nhóm dưới.")
    elif std_dev >= 1.2:
        recs.append(f"Khuyên dùng: Điểm số có sự trồi sụt so với xu hướng (SD = {std_dev:.1f}), cần theo dõi sát sao từng buổi học.")
    elif slope_overall > 0.2:
        recs.append("Khen ngợi: Đang có sự tiến bộ vượt bậc và duy trì phong độ rất tốt!")

    if not recs:
        recs.append("Đánh giá: Duy trì phong độ tốt. Tiếp tục phát huy trong các kỳ tới.")
    recs.append(f"Dự đoán buổi tới: Từ Vựng ({pred_c1:.1f}), Ngữ Pháp ({pred_c2:.1f}), Homework ({pred_hw:.1f}).")

    return {
        "academic_score": trunc_1_dec(academic_score),
        "trend_slope": round(slope_overall, 2),
        "trend_label": trend_label,
        "consistency_score": trunc_1_dec(consistency_score),
        "std_dev": round(std_dev, 2),
        "std_dev_c1": round(std_dev_c1, 2),
        "std_dev_c2": round(std_dev_c2, 2),
        "std_dev_hw": round(std_dev_hw, 2),
        "consistency_label": consistency_label,
        "ema_level": trunc_1_dec(ema),
        "ema_score": trunc_1_dec(ema_score),
        "ema_c1": trunc_1_dec(ema_c1),
        "ema_c2": trunc_1_dec(ema_c2),
        "ema_hw": trunc_1_dec(ema_hw),
        "ema_vocab": trunc_1_dec(ema_c1),
        "ema_grammar": trunc_1_dec(ema_c2),
        "predicted_next": trunc_1_dec(pred_overall),
        "pred_overall": trunc_1_dec(pred_overall),
        "pred_c1": trunc_1_dec(pred_c1),
        "pred_c2": trunc_1_dec(pred_c2),
        "pred_hw": trunc_1_dec(pred_hw),
        "pred_vocab": trunc_1_dec(pred_c1),
        "pred_grammar": trunc_1_dec(pred_c2),
        "avg_vocab": trunc_1_dec(avg_c1),
        "avg_grammar": trunc_1_dec(avg_c2),
        "prediction_model": prediction_model,
        "model_used": prediction_model,
        "fitted_c1": fitted_c1,
        "fitted_c2": fitted_c2,
        "fitted_hw": fitted_hw,
        "att_pct": round(att_pct, 1),
        "attendance_pct": round(att_pct, 1),
        "performance_index": round(performance_index, 1),
        "rating_label": rating_label,
        "recommendations": recs
    }
