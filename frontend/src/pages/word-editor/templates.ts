import { WordDocTemplate } from './types';

export const BUILTIN_TEMPLATES: WordDocTemplate[] = [
  {
    id: 'fee-notice',
    title: 'Thông Báo Thu Học Phí',
    category: 'Thông báo',
    description: 'Mẫu thông báo nộp học phí định kỳ gửi phụ huynh và học sinh',
    content_html: `
<h2 style="text-align: center;"><strong>TRUNG TÂM ANH NGỮ &amp; LUYỆN THI CHẤT LƯỢNG CAO</strong></h2>
<p style="text-align: center;"><em>Địa chỉ: {{dia_chi_tt}} | Hotline: {{sdt_tt}}</em></p>
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
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right; color: #dc2626;">{{hoc_phi}}</td>
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
`
  },
  {
    id: 'teacher-contract',
    title: 'Hợp Đồng Giảng Dạy Giáo Viên',
    category: 'Hợp đồng',
    description: 'Hợp đồng cộng tác thỉnh giảng dành cho giáo viên và trợ giảng',
    content_html: `
<h3 style="text-align: center;"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong></h3>
<p style="text-align: center;"><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
<p style="text-align: center;">----------o0o----------</p>
<h2 style="text-align: center; color: #1e3a8a;"><strong>HỢP ĐỒNG GIẢNG DẠY</strong></h2>
<p style="text-align: center;"><em>(Số: HDGD-{{nam_hoc}}/GV)</em></p>
<p>&nbsp;</p>
<p>Hôm nay, ngày {{ngay_hien_tai}}, tại Văn phòng Trung tâm, chúng tôi gồm có:</p>
<p><strong>BÊN A (BÊN THUÊ GIẢNG DẠY): {{ten_trung_tam}}</strong></p>
<p>- Đại diện: Ban Giám Đốc Trung Tâm</p>
<p>- Địa chỉ: {{dia_chi_tt}} | Điện thoại: {{sdt_tt}}</p>
<p>&nbsp;</p>
<p><strong>BÊN B (BÊN ĐƯỢC THUÊ GIẢNG DẠY): GIÁO VIÊN</strong></p>
<p>- Thầy/Cô: <strong>{{ten_giao_vien}}</strong></p>
<p>- Số điện thoại: {{sdt_gv}}</p>
<p>&nbsp;</p>
<p><strong>ĐIỀU 1: NỘI DUNG VÀ NHIỆM VỤ GIẢNG DẠY</strong></p>
<p>Bên B nhận giảng dạy môn học cho các lớp {{lop_hoc}} do Bên A phân công theo đúng khung phân phối chương trình, giáo án và quy định chuyên môn của Trung tâm.</p>
<p><strong>ĐIỀU 2: THÙ LAO VÀ PHƯƠNG THỨC THANH TOÁN</strong></p>
<p>1. Thù lao giảng dạy được tính theo số giờ dạy thực tế của mỗi buổi học theo bảng thỏa thuận nội bộ.</p>
<p>2. Thời gian thanh toán: Định kỳ từ ngày 01 đến ngày 05 hàng tháng qua hình thức chuyển khoản ngân hàng.</p>
<p><strong>ĐIỀU 3: CAM KẾT CHUNG</strong></p>
<p>Hai bên cam kết thực hiện nghiêm túc các điều khoản đã thỏa thuận trong hợp đồng.</p>
<table style="width: 100%; border: none; margin-top: 30px;">
  <tr>
    <td style="text-align: center; width: 50%;"><strong>ĐẠI DIỆN BÊN A</strong><br /><em>(Ký, ghi rõ họ tên)</em></td>
    <td style="text-align: center; width: 50%;"><strong>ĐẠI DIỆN BÊN B</strong><br /><em>(Ký, ghi rõ họ tên)</em></td>
  </tr>
</table>
`
  },
  {
    id: 'academic-report',
    title: 'Phiếu Báo Cáo Kết Quả Học Tập',
    category: 'Báo cáo',
    description: 'Báo cáo tổng kết điểm kiểm tra, chuyên cần và nhận xét của giáo viên',
    content_html: `
<h2 style="text-align: center; color: #1e3a8a;"><strong>PHIẾU BÁO CÁO KẾT QUẢ HỌC TẬP</strong></h2>
<p style="text-align: center;"><strong>Học kỳ - Năm học {{nam_hoc}}</strong></p>
<hr />
<p><strong>1. Thông tin học sinh:</strong></p>
<p>- Họ và tên: <strong>{{ten_hoc_sinh}}</strong> | Lớp: <strong>{{lop_hoc}}</strong> | Mã HS: <strong>{{ma_hoc_sinh}}</strong></p>
<p>- Giáo viên phụ trách: <strong>{{ten_giao_vien}}</strong></p>
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
      <td style="border: 1px solid #cbd5e1; padding: 8px;">Điểm kiểm tra giữa kỳ</td>
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
`
  }
];
