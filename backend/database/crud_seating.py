import json
from typing import Dict, Any
from .connection import get_connection

def get_class_seating(class_id: int) -> Dict[str, Any]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM class_seating WHERE class_id = ?", (class_id,))
        row = cursor.fetchone()
        if not row:
            return {"class_id": class_id, "num_rows": 4, "layout_json": "[]"}
        res = dict(row)
        layout_str = res.get("layout_json")
        if layout_str and layout_str != "[]":
            try:
                cursor.execute("SELECT student_id FROM class_students WHERE class_id = ?", (class_id,))
                active_ids = {r[0] if isinstance(r, (list, tuple)) else r["student_id"] for r in cursor.fetchall()}
                grid = json.loads(layout_str)
                changed = False
                for col in grid:
                    for s in col.get("seats", []):
                        if s.get("student_id") and s["student_id"] not in active_ids:
                            s["student_id"] = None
                            s["student_name"] = None
                            changed = True
                if changed:
                    res["layout_json"] = json.dumps(grid, ensure_ascii=False)
            except Exception:
                pass
        return res
    finally:
        conn.close()

def save_class_seating(class_id: int, num_rows: int, layout_json: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO class_seating (class_id, num_rows, layout_json)
            VALUES (?, ?, ?)
            ON CONFLICT(class_id) DO UPDATE SET
                num_rows = EXCLUDED.num_rows,
                layout_json = EXCLUDED.layout_json,
                updated_at = CURRENT_TIMESTAMP
        """, (class_id, num_rows, layout_json))
        conn.commit()
    finally:
        conn.close()
