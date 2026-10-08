# Báo Cáo Hoàn Thành: Dọn Sạch Vercel & Supabase, Hoàn Tất Chuyển Đổi PostgreSQL VPS và Tầng Bảo Mật Xác Thực Chống Can Thiệp Dữ Liệu

## 1. Loại Bỏ Hoàn Toàn Vercel & Supabase (100% Clean)
- **Xóa các file & cấu hình Vercel Serverless**:
  - Đã xóa: `vercel.json`, `.vercelignore`, `frontend/vercel.json`, và toàn bộ thư mục `api/` (vốn chỉ phục vụ Vercel serverless functions).
  - Loại bỏ các middleware tiền tố Vercel (`VercelApiPrefixMiddleware`).
- **Xóa mã nguồn Supabase Auth & Supabase Secrets**:
  - Đã xóa `backend/services/supabase_auth_service.py`.
  - Đã xóa các scratch script chứa hardcoded Supabase connection pooler URLs trong `scratch/` và `backend/scratch/`.
  - Đã đổi tên `backend/database/supabase_schema.sql` $\rightarrow$ `backend/database/postgres_schema.sql` và cập nhật header dành riêng cho máy chủ VPS PostgreSQL.
  - Đã chuyển đổi `backend/scratch/migrate_sqlite_to_supabase.py` $\rightarrow$ `backend/scratch/migrate_sqlite_to_postgres.py`.
- **Dọn dẹp mã nguồn Backend & Frontend**:
  - Xóa toàn bộ các khối lệnh sync Supabase Auth trong `crud_students_teachers.py`, `crud_users.py`, `crud_classes_sessions.py`.
  - Cập nhật tài liệu kiến trúc triển khai `future web app implementations.md` sang chuẩn Docker Compose + PostgreSQL 16 + FastAPI + Nginx trên VPS.
  - Cập nhật toàn bộ các nhãn UI và chuỗi thông báo:
    - `SystemSettingsTab.tsx`: "Đồng Bộ Máy Chủ PostgreSQL (VPS)".
    - `SyncIndicator.tsx`: "Đang đồng bộ với máy chủ trung tâm...".
    - `App.tsx`: "Local-First Engine — Tự động đồng bộ với máy chủ PostgreSQL".

---

## 2. Hoàn Tất Chuyển Đổi Database Chuẩn PostgreSQL VPS & Local SQLite
- Hệ thống hoạt động theo mô hình **Local-First SQLite + VPS PostgreSQL Bi-directional Sync**:
  - Tại máy trạm cá nhân: SQLite hoạt động độc lập, ngoại tuyến 100%, 0ms độ trễ.
  - Khi có mạng hoặc chạy trên máy chủ trung tâm: Đồng bộ 2 chiều qua PostgreSQL chuẩn (`postgres_schema.sql`), kết nối qua chuỗi `DATABASE_URL`.
  - Cập nhật tài liệu hướng dẫn triển khai VPS `vps_deployment_guide.md` và `docker-compose.yml`.

---

# Walkthrough: UI Redesign & Streamlining

## 1. Tổng Quan Buổi Học (`SessionOverviewBanner.tsx` & `SessionOverviewCards.tsx`)
- **Bỏ Chú Thích & Thanh Chuẩn Nhanh**: Loại bỏ hoàn toàn dòng mô tả phụ và thanh nút chọn nhanh (`Dưới 5.0 (Chuẩn VN)`, `Dưới TB Buổi Học`, `Tùy chỉnh`). Mặc định hiển thị học sinh có điểm nhỏ hơn điểm trung bình buổi học trừ khi có giá trị được nhập vào trực tiếp tại card.
- **Card Độ Lệch Thống Nhất Giao Diện**: Độ lệch hiển thị chuẩn form giống hệt 3 card còn lại (`Check 1`, `Check 2`, `BTVN`) với ô nhập ngưỡng trực tiếp ngay tiêu đề (`> [input] đ`) và danh sách học sinh dưới dạng badge pill nổi bật.
- **Bỏ Viền Card Mà Vẫn Nổi**: Bỏ các đường viền thô cứng (`border-0`), thay bằng nền màu pastel thanh nhã (`bg-blue-50/70`, `bg-purple-50/70`, `bg-emerald-50/70`, `bg-amber-50/70`), đổ bóng nhẹ (`shadow-xs` / `shadow-sm`) và các tag học sinh màu trắng nổi khối rõ nét.

## 2. So Sánh & Thống Kê Sâu (`HeadToHeadDuel.tsx`, `DualComparisonBars.tsx`, `TierDistributionCard.tsx`, `UnitBreakdownTable.tsx`)
- **Đổi Tiêu Đề**: Đổi "SO SÁNH ĐỐI ĐẦU 2 LỚP HỌC" thành **"SO SÁNH 2 LỚP HỌC"**.
- **Tăng Độ Tương Phản & Ranh Giới**: Phân định rõ ràng giữa container ngoài và các card bên trong bằng viền tương phản cao (`border-slate-300 dark:border-[#1b253b]`) và nền khác biệt (`bg-slate-50/70 dark:bg-[#0e1322]`).
- **Chuẩn Hóa Typography (Đồng Bộ Bảng Xếp Hạng)**:
  - Tên lớp học, danh mục, tiêu đề thang điểm: tăng kích thước từ `text-[10px]/text-xs` lên `text-xs sm:text-sm font-extrabold`.
  - Tên học sinh: tăng lên `text-base sm:text-lg font-extrabold`.
  - Điểm số và thông số thống kê: chuyển sang font mono sắc nét, kích thước lớn `text-sm/text-base font-black font-mono` (điểm đối đầu lớn `text-3xl font-black font-mono`).
  - Thanh đo phổ điểm / thanh năng lực: tăng chiều cao track từ `h-2` lên `h-4` với viền rõ ràng, dễ nhìn.

## 3. Chuyển Đổi Nút Tương Tác Sang Màu Xanh Dương & Bo Sát Nút Segmented Control
- **Segmented Control Bo Sát**:
  - Giảm padding container từ `p-1` xuống `p-0.5`, bo góc `rounded-lg`.
  - Con trượt lướt (sliding pill indicator) chuyển sang bo sát viền nút (`top-0.5 bottom-0.5 rounded-md`).
- **Đồng Bộ Nút Màu Xanh Dương Toàn Bộ Ứng Dụng**:
  - Chuyển tất cả các nút bấm, icon trạng thái active, thanh trượt segmented pill từ màu tím/indigo (`bg-[#5c36f5]`, `bg-indigo-600`) sang màu xanh dương chuẩn (`bg-blue-600 hover:bg-blue-500`, viền `border-blue-500`, shadow xanh đồng bộ).
  - Áp dụng trên tất cả các màn hình: Điểm danh & Điểm, Nhóm bạn & Xung đột, Đăng ký học sinh, Quản lý tài khoản & Phân quyền, Thẻ giáo viên & học sinh, Bài tập & Nộp bài, Bảng vẽ Whiteboard & Chèn ảnh, Báo cáo & Thống kê, Cài đặt hệ thống, Bảng dữ liệu TanStack DataTable.

## 4. Kiểm Thử & Xác Nhận
- `npm run build`: Hoàn thành với mã thoát `0`, không có bất kỳ lỗi TypeScript hay Vite bundle nào.
- Git commit & push: Đã đồng bộ toàn bộ thay đổi lên nhánh `main` trên GitHub remote.

---

## 3. Tầng Bảo Mật Xác Thực & Chống Can Thiệp Dữ Liệu (DevTools/Script Anti-Tampering)
Để ngăn chặn triệt để học sinh hoặc người dùng tò mò mở Chrome DevTools (F12) / Console / Network Tab hoặc chạy script cURL/fetch can thiệp sửa điểm và thuật toán:

### A. Tầng Xác Thực & Phân Quyền (HMAC-SHA256 Token & RBAC Middleware)
1. **Dịch vụ sinh & xác thực Token cryptographically signed (`backend/services/auth_security.py`)**:
   - Sử dụng chuẩn HMAC-SHA256 an toàn cao, không cần phụ thuộc thư viện bên ngoài.
   - Token chứa chữ ký điện tử không thể giả mạo và timestamp hết hạn (`exp`).
   - Constant-time comparison chống timing attacks (`hmac.compare_digest`).
2. **Middleware Bảo Vệ Chặn Can Thiệp (`backend/middlewares/security_middleware.py`)**:
   - Chặn tất cả các HTTP mutations (`POST`, `PUT`, `DELETE`, `PATCH`).
   - Yêu cầu token hợp lệ: Nếu token bị sửa đổi hoặc hết hạn $\rightarrow$ trả về `401 Unauthorized`.
   - **Chặn quyền Học sinh (Role Guard)**: Nếu tài khoản mang vai trò `Học sinh` cố tình gửi request sửa đổi thông tin các lớp học, điểm số, học sinh, giáo viên (`/api/classes`, `/api/students`, `/api/teachers`, `/api/reports`, `/api/users`, `/api/seating`) $\rightarrow$ trả về ngay lập tức `403 Forbidden: Tài khoản học sinh không được phép thay đổi điểm số hoặc dữ liệu hệ thống`.
3. **Frontend Token Tự Động Đính Kèm (`frontend/src/utils/authUtils.ts` & `frontend/src/api/client.ts`)**:
   - Đăng nhập thành công sẽ lưu token vào `auth_token`.
   - Mọi request của hệ thống đều tự động chèn header `Authorization: Bearer <token>`.

### B. Tầng Kiểm Soát Giới Hạn Dữ Liệu Phía Máy Chủ (Server-Side Data Bounds & Integrity)
- Trong `backend/database/crud_scores_attendance.py`:
  - **Kiểm soát điểm số**: Điểm số (`check_1`, `check_2`, `homework`, `mock_test`) bắt buộc nằm trong khoảng $[0.0, 10.0]$ hoặc `None`. Nếu script gửi số âm, số $> 10$, hoặc chuỗi độc hại $\rightarrow$ tự động làm sạch và reject về `None`.
  - **Quy tắc Trunc1Dec (Rule 17)**: Server tự động cắt cụt đúng 1 chữ số thập phân (`math.floor(v * 10.0 + 1e-9) / 10.0`) không làm tròn lên/xuống, loại bỏ mọi số thập phân lẻ do script can thiệp.
  - **Quy tắc No Grade 0 Defaults (Rule 8)**: Điểm chưa chấm lưu `NULL`, không biến thành `0.0`.
  - **Trạng thái điểm danh**: Bắt buộc nằm trong danh mục hợp lệ `{"Có mặt", "Đi muộn", "Có phép", "Vắng mặt", "Nghỉ học", "Chưa học"}`.
  - **Chống tràn dữ liệu ghi chú**: Cắt độ dài `notes` tối đa 500 ký tự.

---

## 4. Kiểm Thử & Tiêu Chuẩn Kỹ Thuật
- **Frontend Build**: `npm run build` chạy thành công 100% với 0 lỗi TypeScript.
- **Backend Tests**: 
  - Token signature verification test: PASS.
  - Tampered token rejection test: PASS (`Chữ ký token không hợp lệ hoặc đã bị can thiệp`).
  - Expired token rejection test: PASS (`Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại`).
  - Score bounds validation test: PASS.
- **Tiêu chuẩn giới hạn dòng**:
  - Tất cả các file Frontend: $\le 400$ dòng.
  - Tất cả các file Backend: $\le 500$ dòng.
