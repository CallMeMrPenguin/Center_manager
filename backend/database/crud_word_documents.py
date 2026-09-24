import json
from typing import List, Dict, Any, Optional
from database.connection import get_connection

def create_word_documents_table(cursor):
    """Creates the word_documents table if not exists."""
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS word_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content_html TEXT NOT NULL DEFAULT '',
        content_json TEXT DEFAULT '',
        category TEXT DEFAULT 'Chung',
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '',
        paper_size TEXT DEFAULT 'A4',
        orientation TEXT DEFAULT 'portrait',
        margins TEXT DEFAULT '{"top":20,"bottom":20,"left":25,"right":20}',
        is_template INTEGER DEFAULT 0,
        created_by INTEGER DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted INTEGER DEFAULT 0,
        deleted_at TIMESTAMP DEFAULT NULL
    )
    """)

DEFAULT_TEMPLATES = [
    {
        "title": "Mẫu Thông Báo Thu Học Phí",
        "category": "Thông báo",
        "description": "Mẫu thông báo nộp học phí định kỳ gửi phụ huynh và học sinh",
        "is_template": 1,
        "content_html": """
<h2 style="text-align: center;"><strong>TRUNG TÂM ANH NGỮ &amp; LUYỆN THI CHẤT LƯỢNG CAO</strong></h2>
<p style="text-align: center;"><em>Địa chỉ: 123 Đường Giáo Dục, Quận 1 | Hotline: 0901 234 567</em></p>
<hr />
<h3 style="text-align: center; color: #1e3a8a;"><strong>THÔNG BÁO VỀ VIỆC THU HỌC PHÍ</strong></h3>
<p style="text-align: center;"><strong>Khóa học / Tháng: {{thang_hoc}}</strong></p>
<p>&nbsp;</p>
<p>Kính gửi: Quý Phụ huynh em: <strong>{{ten_hoc_sinh}}</strong> (Lớp: <strong>{{lop_hoc}}</strong>)</p>
<p>Trung tâm xin chân thành cảm ơn Quý phụ huynh đã luôn tin tưởng và đồng hành cùng sự tiến bộ của các em trong suốt thời gian qua.</p>
<p>Nay Trung tâm xin trân trọng thông báo chi tiết học phí của em như sau:</p>
<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="border: 1px solid #cbd5e1; padding: 8px;">STT</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Khoản mục</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Số buổi / Thời lượng</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Đơn giá</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Thành tiền</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">1</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Học phí khóa {{lop_hoc}}</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">8 buổi</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">150.000 đ</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">1.200.000 đ</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">2</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Tài liệu học tập &amp; Giáo trình</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">1 bộ</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">100.000 đ</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">100.000 đ</td>
    </tr>
    <tr style="background-color: #f8fafc; font-weight: bold;">
      <td colspan="4" style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">TỔNG CỘNG:</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #dc2626;">1.300.000 đ</td>
    </tr>
  </tbody>
</table>
<p>&nbsp;</p>
<p><strong>Thông tin chuyển khoản:</strong></p>
<p>- Ngân hàng: <strong>MB Bank (Ngân hàng Quân Đội)</strong></p>
<p>- Số tài khoản: <strong>999988886666</strong> - Chủ TK: <strong>TRUNG TAM GIAO DUC</strong></p>
<p>- Nội dung chuyển khoản: <em>[Họ tên học sinh] - [Lớp] - HP T{{thang_hoc}}</em></p>
<p>Rất mong Quý phụ huynh vui lòng hoàn thành trước ngày <strong>{{han_dong}}</strong> để Trung tâm sắp xếp công tác giảng dạy tốt nhất.</p>
<p style="text-align: right;"><em>Ngày {{ngay_hien_tai}}</em><br /><strong>Ban Quản Lý Trung Tâm</strong></p>
"""
    },
    {
        "title": "Mẫu Hợp Đồng Giảng Dạy Giáo Viên",
        "category": "Hợp đồng",
        "description": "Hợp đồng cộng tác thỉnh giảng dành cho giáo viên và trợ giảng",
        "is_template": 1,
        "content_html": """
<h3 style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></h3>
<p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
<p style="text-align: center;">----------o0o----------</p>
<h2 style="text-align: center; color: #1e3a8a;"><strong>HỢP ĐỒNG GIẢNG DẠY</strong></h2>
<p style="text-align: center;"><em>(Số: HDGD-{{nam}}/{{ma_hop_dong}})</em></p>
<p>&nbsp;</p>
<p>Hôm nay, ngày {{ngay_hien_tai}}, tại Văn phòng Trung tâm, chúng tôi gồm có:</p>
<p><strong>BÊN A (BÊN THUÊ GIẢNG DẠY): TRUNG TÂM GIÁO DỤC</strong></p>
<p>- Đại diện: Ông/Bà <strong>{{giam_doc}}</strong> - Chức vụ: Giám đốc</p>
<p>- Địa chỉ: {{dia_chi_tt}} | Điện thoại: {{sdt_tt}}</p>
<p>&nbsp;</p>
<p><strong>BÊN B (BÊN ĐƯỢC THUÊ GIẢNG DẠY): GIÁO VIÊN</strong></p>
<p>- Ông/Bà: <strong>{{ten_giao_vien}}</strong></p>
<p>- Ngày sinh: {{ngay_sinh_gv}} - Số CCCD: {{cccd_gv}}</p>
<p>- Chuyên môn: {{chuyen_mon}} - Điện thoại: {{sdt_gv}}</p>
<p>&nbsp;</p>
<p><strong>ĐIỀU 1: NỘI DUNG VÀ NHIỆM VỤ GIẢNG DẠY</strong></p>
<p>Bên B nhận giảng dạy môn học cho các lớp do Bên A phân công theo đúng khung phân phối chương trình, giáo án và quy định chuyên môn của Trung tâm.</p>
<p><strong>ĐIỀU 2: THÙ LAO VÀ PHƯƠNG THỨC THANH TOÁN</strong></p>
<p>1. Thù lao giảng dạy: <strong>{{muc_luong_gio}}</strong> VNĐ/giờ dạy thực tế.</p>
<p>2. Thời gian thanh toán: Định kỳ từ ngày 01 đến ngày 05 hàng tháng qua hình thức chuyển khoản.</p>
<p><strong>ĐIỀU 3: CAM KẾT CHUNG</strong></p>
<p>Hai bên cam kết thực hiện nghiêm túc các điều khoản đã thỏa thuận trong hợp đồng.</p>
<table style="width: 100%; border: none; margin-top: 30px;">
  <tr>
    <td style="text-align: center; width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br /><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align: center; width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br /><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>
"""
    },
    {
        "title": "Mẫu Báo Cáo Tình Hình Học Tập Định Kỳ",
        "category": "Báo cáo",
        "description": "Báo cáo tổng kết điểm kiểm tra, chuyên cần và nhận xét của giáo viên",
        "is_template": 1,
        "content_html": """
<h2 style="text-align: center; color: #1e3a8a;"><strong>PHIẾU BÁO CÁO KẾT QUẢ HỌC TẬP</strong></h2>
<p style="text-align: center;"><strong>Học kỳ I - Năm học {{nam_hoc}}</strong></p>
<hr />
<p><strong>1. Thông tin học sinh:</strong></p>
<p>- Họ và tên: <strong>{{ten_hoc_sinh}}</strong> | Lớp: <strong>{{lop_hoc}}</strong> | Mã HS: <strong>{{ma_hoc_sinh}}</strong></p>
<p>- Giáo viên chủ nhiệm / đứng lớp: <strong>{{ten_giao_vien}}</strong></p>
<p>&nbsp;</p>
<p><strong>2. Kết quả điểm số &amp; Chuyên cần:</strong></p>
<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Chỉ tiêu</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Kết quả</th>
      <th style="border: 1px solid #cbd5e1; padding: 8px;">Đánh giá</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Tỷ lệ chuyên cần</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">100%</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Chăm chỉ, đi học đúng giờ</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Điểm kiểm tra 15 phút</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">8.5</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Nắm chắc từ vựng</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Điểm kiểm tra 1 tiết (Midterm)</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">8.8</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Kỹ năng đọc hiểu tốt</td>
    </tr>
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Điểm bài tập về nhà</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">9.0</td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Làm bài đầy đủ</td>
    </tr>
  </tbody>
</table>
<p>&nbsp;</p>
<p><strong>3. Nhận xét của giáo viên phụ trách:</strong></p>
<p>- <em>Em có thái độ học tập tích cực, phát biểu sôi nổi trong giờ học. Cần rèn luyện thêm phản xạ phát âm chuẩn.</em></p>
<p><strong>4. Đề xuất phương hướng rèn luyện:</strong></p>
<p>- <em>Duy trì thói quen ôn từ vựng 15 phút mỗi ngày, luyện thêm bài tập nghe chuyên sâu.</em></p>
<table style="width: 100%; border: none; margin-top: 40px;">
  <tr>
    <td style="text-align: center; width: 50%;"><strong>Ý KIẾN PHỤ HUYNH</strong><br /><em>(Ký và gửi lại trung tâm)</em></td>
    <td style="text-align: center; width: 50%;"><strong>GIÁO VIÊN BỘ MÔN</strong><br /><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>
"""
    }
]

def seed_default_word_templates(conn):
    """Seeds default templates if none exist."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM word_documents WHERE is_template = 1")
    count = cursor.fetchone()[0]
    if count == 0:
        for tpl in DEFAULT_TEMPLATES:
            cursor.execute("""
            INSERT INTO word_documents (title, content_html, category, description, is_template)
            VALUES (?, ?, ?, ?, 1)
            """, (tpl["title"], tpl["content_html"], tpl["category"], tpl["description"]))
        conn.commit()

def insert_word_document(
    title: str,
    content_html: str = "",
    content_json: str = "",
    category: str = "Chung",
    description: str = "",
    tags: str = "",
    paper_size: str = "A4",
    orientation: str = "portrait",
    margins: str = '{"top":20,"bottom":20,"left":25,"right":20}',
    is_template: int = 0,
    created_by: Optional[int] = None
) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        cursor.execute("""
        INSERT INTO word_documents (
            title, content_html, content_json, category, description, tags,
            paper_size, orientation, margins, is_template, created_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            title, content_html, content_json, category, description, tags,
            paper_size, orientation, margins, is_template, created_by
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_word_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_template: Optional[int] = None,
    is_deleted: int = 0
) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        seed_default_word_templates(conn)
        
        query = "SELECT id, title, category, description, tags, paper_size, orientation, is_template, created_at, updated_at FROM word_documents WHERE is_deleted = ?"
        params: List[Any] = [is_deleted]
        
        if is_template is not None:
            query += " AND is_template = ?"
            params.append(is_template)
            
        if category and category != "__ALL__":
            query += " AND category = ?"
            params.append(category)
            
        if search:
            query += " AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])
            
        query += " ORDER BY updated_at DESC, id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_word_document(doc_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        cursor.execute("SELECT * FROM word_documents WHERE id = ? AND is_deleted = 0", (doc_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def update_word_document(
    doc_id: int,
    title: Optional[str] = None,
    content_html: Optional[str] = None,
    content_json: Optional[str] = None,
    category: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[str] = None,
    paper_size: Optional[str] = None,
    orientation: Optional[str] = None,
    margins: Optional[str] = None,
    is_template: Optional[int] = None
) -> bool:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        fields = []
        params = []
        if title is not None:
            fields.append("title = ?")
            params.append(title)
        if content_html is not None:
            fields.append("content_html = ?")
            params.append(content_html)
        if content_json is not None:
            fields.append("content_json = ?")
            params.append(content_json)
        if category is not None:
            fields.append("category = ?")
            params.append(category)
        if description is not None:
            fields.append("description = ?")
            params.append(description)
        if tags is not None:
            fields.append("tags = ?")
            params.append(tags)
        if paper_size is not None:
            fields.append("paper_size = ?")
            params.append(paper_size)
        if orientation is not None:
            fields.append("orientation = ?")
            params.append(orientation)
        if margins is not None:
            fields.append("margins = ?")
            params.append(margins)
        if is_template is not None:
            fields.append("is_template = ?")
            params.append(is_template)
            
        fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(doc_id)
        
        sql = f"UPDATE word_documents SET {', '.join(fields)} WHERE id = ? AND is_deleted = 0"
        cursor.execute(sql, params)
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def delete_word_document(doc_id: int, permanent: bool = False) -> bool:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        if permanent:
            cursor.execute("DELETE FROM word_documents WHERE id = ?", (doc_id,))
        else:
            cursor.execute("UPDATE word_documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (doc_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()

def duplicate_word_document(doc_id: int) -> Optional[int]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        create_word_documents_table(cursor)
        cursor.execute("SELECT * FROM word_documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        new_title = f"{d['title']} (Bản sao)"
        cursor.execute("""
        INSERT INTO word_documents (
            title, content_html, content_json, category, description, tags,
            paper_size, orientation, margins, is_template, created_by, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        """, (
            new_title, d['content_html'], d['content_json'], d['category'],
            d['description'], d['tags'], d['paper_size'], d['orientation'],
            d['margins'], d.get('created_by')
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()
