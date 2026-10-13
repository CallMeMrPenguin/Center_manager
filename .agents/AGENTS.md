# Center Manager App — Agent Rules & Global Standards

> **MANDATORY READING**: Read this file completely at the start of every agent session.
> This is the single central source of truth for all coding, architectural, UI/UX, database, and git standards.

---

## 🏗️ 1. Project Overview & Architecture

**Center Manager App** — Hệ thống quản lý trung tâm dạy học & luyện thi.
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS v4
- **Backend**: Python (FastAPI) + SQLite
- **Remote**: `https://github.com/CallMeMrPenguin/Center_manager.git` (branch: `main`)

### 📏 Giới Hạn Dung Lượng File & Kiến Trúc Module
- **Frontend Files**: **Tối đa nghiêm ngặt 400 dòng** mỗi file. Mọi component, trang hoặc view tiệm cận 400 dòng BẮT BUỘC phải được tách nhỏ thành subcomponents, custom hooks, types hoặc tab sub-views.
- **Backend Files**: **Tối đa nghiêm ngặt 500 dòng** mỗi file. Các router hoặc service lớn phải được phân tách thành các module nghiệp vụ riêng biệt.
- **Nghiêm cấm file nguyên khối (Monolith)**: Tuyệt đối không viết file 800–1000+ dòng.

---

## 🎨 2. Triết Lý Thiết Kế: Light UI, Flat UI & Minimalism

Toàn bộ ứng dụng sử dụng giao diện **Light UI**, phong cách **Flat UI** và tinh thần **Tối giản (Minimalism)**:

1. **Bảng màu Sáng & Tương phản cao**:
   - Nền chính: `#ffffff` (trắng tinh) và `#f8fafc` / `#f1f5f9` (xám sáng dịu mắt).
   - Viền: `#e2e8f0` / `#cbd5e1` sắc nét, mảnh và phẳng.
   - Chữ: `#0f172a` / `#1e293b` (slate đậm, độ tương phản cao, dễ đọc tuyệt đối).
2. **Phong cách Flat & Tối giản (Zero Bloat)**:
   - Không dùng hiệu ứng neon glow, bóng đổ đậm, skeuomorphism hay màu mè phức tạp.
   - Không dùng bộ lọc mờ CSS (`backdrop-blur-*`, `blur-*`) gây nghẽn GPU. Mọi bề mặt dùng nền solid phẳng và sạch.
3. **Quy tắc "One Container, One Visual Boundary"**:
   - **Tuyệt đối không lồng viền trong viền (Border-in-Border / Card-in-Card)**: Không bọc các phần tử có viền (input, select, picker) bên trong các thẻ card con cũng có viền bao quanh.
   - Mỗi khối thông tin chỉ có **duy nhất một đường ranh giới hiển thị**. Các phần tử bên trong phân cách bằng khoảng cách (`gap-3`) hoặc đường kẻ đơn (`divide-x` / `divide-y`).
4. **Dropdown & DatePicker Custom Đồng Bộ**:
   - Dropdown BẮT BUỘC dùng `<CustomSelect />` giao diện sáng phẳng. Cấm dùng thẻ `<select>` gốc của trình duyệt.
   - Chọn ngày BẮT BUỘC dùng `<CustomDatePicker />`. Cấm dùng `<input type="date">` gốc của trình duyệt.
5. **Modal Overlays Gọn Nhẹ**:
   - Lớp phủ nền modal dùng overlay phẳng tối giản (`bg-black/60` hoặc `bg-slate-900/50`), không dùng `backdrop-blur`.

---

## 🚫 3. Quy Tắc Giữ Giao Diện Sạch Sẽ & Tối Giản Tuyệt Đối

### 3.1. Tuyệt Đối Không Chèn Note / Chú Thích Tùy Tiện
- **KHÔNG được tự ý chèn Note / Chú thích / Hướng dẫn** vào bảng, tiêu đề, thẻ card hay phản hồi trò chuyện trừ khi người dùng yêu cầu rõ ràng.
- Tránh thêm các dòng chữ giải thích phụ, chú thích chân trang, ghi chú mẹo (`Tip:`, `Lưu ý:`, `#STT`, v.v.) gây rác giao diện. Giao diện chỉ tập trung 100% vào dữ liệu và chức năng chính.

### 3.2. Nghiêm Cấm Lạm Dụng Icon
- **Hạn chế tối đa icon**: Không gắn icon vào mọi tiêu đề, mọi tab, mọi cột hay mọi nút bấm.
- Nút bấm và tab ưu tiên dùng chữ ngắn gọn, dứt khoát (ví dụ: `Chọn Đề`, `Lịch học`) thay vì trang trí bằng icon rườm rà.
- Icon chỉ được dùng khi thật sự phục vụ chức năng cốt lõi (kính lúp tìm kiếm, dấu X đóng, bút sửa).

### 3.3. Nghiêm Cấm Chèn Emoji Vào Giao Diện
- Tuyệt đối không tự ý chèn Emoji (như `👉`, `✨`, `🎨`, `📌`, `🎯`, `📄`, `⚡`, v.v.) vào UI, parser hoặc bộ định dạng dữ liệu, trừ khi nội dung gốc của người dùng có chứa emoji đó.

### 3.4. Cấm Dùng Ký Tự Ngăn Cách Dạng Pipe (`|`) Hoặc Dấu Chấm (`•`)
- Không dùng dấu gạch đứng (`|`) hoặc dấu chấm tròn (`•`) để ngăn cách các trường dữ liệu trong chuỗi văn bản.
- Phân tách thông tin bằng flex badges cấu trúc phẳng, phân cấp typography hoặc khoảng cách hợp lý.

### 3.5. Một Nút Bút Sửa Duy Nhất (Single Pen Button)
- Không đặt icon thùng rác bên cạnh icon bút sửa trên thẻ hoặc hàng.
- Chỉ hiển thị một icon Bút Sửa (`<Edit3 />`). Chức năng xóa được đặt là nút Xóa màu đỏ bên trong modal chỉnh sửa.
- Riêng bảng điểm danh/nhập điểm: Mở chi tiết học sinh bằng thao tác Double-click vào tên/hàng, loại bỏ hoàn toàn cột Thao Tác thừa thãi.

---

## 📊 4. Chuẩn TanStack Table — BẮT BUỘC CHO MỌI BẢNG DỮ LIỆU

> **QUY TẮC BẮT BUỘC: MỌI BẢNG DỮ LIỆU ĐỀU PHẢI DÙNG `<DataTable />` TỪ `src/components/DataTable.tsx`. KHÔNG NGOẠI LỆ.**

### 4.1. Nguyên Tắc Cốt Lõi
1. **Luôn dùng `<DataTable />`**: Không bao giờ viết thẻ `<table>` HTML thủ công với phân trang hay sắp xếp tự chế.
2. **Không quản lý state bảng ở cấp trang**: Không tạo `useState` cho search, pagination, sorting hay column visibility trong trang. Mọi thứ được xử lý nội bộ bởi TanStack Table.
3. **Mặc định nghiêm ngặt 20 dòng / trang**: Phân trang chuẩn 20 dòng/trang, có nút `Trước`, `Trang X / Y`, `Sau`. Cấm dropdown chọn số dòng hiển thị.
4. **Bộ Lọc Tiêu Đề Cột (Chuẩn Ngân Hàng Câu Hỏi)**:
   - Icon lọc bên cạnh tiêu đề cột trong `<th>`. Khi có lọc/sắp xếp, icon sáng màu chủ đạo.
   - Popover nổi gồm: Tiêu đề cột, Sắp xếp Tăng/Giảm (A-Z, Z-A), ô tìm kiếm giá trị, danh sách checkbox chọn nhiều giá trị, nút Xóa bộ lọc cột.
5. **Double-click mở bản ghi**: Hỗ trợ prop `onRowDoubleClick` để xem chi tiết bản ghi, giữ bảng sạch sẽ không cần cột thao tác thừa.

### 4.2. Mẫu Khai Báo Cột Chuẩn
```tsx
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

const columns = useMemo<ColumnDef<Student>[]>(() => [
  {
    accessorKey: 'full_name',
    header: 'Họ và Tên',
    cell: (info) => <span className="font-semibold text-slate-900">{info.getValue<string>()}</span>,
  },
  {
    accessorKey: 'class_name',
    header: 'Lớp Học',
    cell: (info) => <span className="text-slate-600">{info.getValue<string>()}</span>,
  },
], []);

<DataTable<Student>
  data={students}
  columns={columns}
  pageSize={20}
  exportFilename="students_list"
  onRowDoubleClick={(row) => handleOpenDetail(row)}
/>
```

---

## 🔢 5. Toàn Vẹn Dữ Liệu & Quy Chuẩn Tính Toán

1. **Không Mặc Định Điểm 0 (No Grade 0 Defaults)**:
   - Điểm chưa nhập hoặc vắng mặt BẮT BUỘC lưu là `NULL`, tuyệt đối không lưu là số `0` hoặc `0.0` để tránh kéo tụt điểm trung bình thật của học sinh.
2. **Cắt Gọn Đúng 1 Chữ Số Thập Phân (Single Decimal Truncation)**:
   - Tất cả điểm số, điểm trung bình, dự đoán học lực BẮT BUỘC cắt đúng **1 chữ số sau dấu phẩy KHÔNG làm tròn lên/xuống** (`format1Dec` / `trunc1Dec`), ví dụ: `6.21` → `6.2`, `6.28` → `6.2`, `8.89` → `8.8`.
3. **Tìm Kiếm Không Phân Biệt Hoa Thường**:
   - Mọi bộ lọc tìm kiếm text phải luôn xử lý `.toLowerCase().trim()`.
4. **Điều Hướng Nhập Điểm Trên Mobile (Student-First Navigation)**:
   - Trên giao diện mobile chuyển vị (học sinh nằm theo trục X, các chỉ số điểm nằm theo trục Y): Nhấn Enter, Tab hoặc phím Mũi tên Xuống sẽ di chuyển dọc theo các đầu điểm của cùng học sinh đó trước khi nhảy sang học sinh tiếp theo.

---

## 🚀 6. Chuẩn Tự Động Commit, Tăng Phiên Bản & Push Git

### 6.1. Tự Động Commit & Push Cuối Mỗi Task
- Sau khi hoàn thành cập nhật code hoặc tính năng trong mỗi phiên làm việc, agent BẮT BUỘC tự động chạy:
  ```bash
  git add . ; git commit -m "feat/fix: [Tóm tắt ngắn gọn thay đổi]" ; git push origin main
  ```

### 6.2. Quy Trình Phát Hành Bản Cập Nhật (Version Bump)
Khi được yêu cầu phát hành bản cập nhật hoặc bump version:
1. Tăng chuỗi phiên bản trong file `VERSION` (ví dụ: `1.0.0` → `1.0.1`).
2. Build lại frontend (`npm run build`) và bộ cài đặt (`python installer/build_installer.py`).
3. Commit và gắn git tag tương ứng:
   ```bash
   git add . ; git commit -m "release: v1.0.1" ; git tag v1.0.1 ; git push origin main --tags
   ```

---

## 📈 7. Chuẩn Biểu Đồ & Trực Quan Hóa Dữ Liệu

1. **Tọa độ Phóng To SVG Điểm Dữ Liệu**:
   - Thẻ `<circle>` dữ liệu SVG khi hover phóng to phải có style: `style={{ transformBox: 'fill-box', transformOrigin: 'center' }}` để điểm nở đều từ tâm, không bị nhảy góc.
2. **Tooltip Tương Tác**:
   - Hover vào điểm dữ liệu trên đồ thị tiến độ bắt buộc hiển thị tooltip chi tiết giá trị số thực tế.
3. **Chiều Cao Rộng Rãi**:
   - Biểu đồ tiến trình cần duy trì chiều cao tối thiểu hợp lý để các đường lưới điểm số tách biệt rõ ràng, dễ nhìn.

---

## 🚫 8. Bảng Tổng Hợp Các Hành Vi Bị Cấm (Anti-Patterns)

| Hành vi BỊ CẤM | Quy chuẩn BẮT BUỘC thay thế |
|---|---|
| Dùng Dark theme / Nền tối / Neon glow | Dùng **Light UI phẳng, tối giản, tương phản cao** (`#ffffff`, `#f8fafc`, text `#0f172a`) |
| Tự ý chèn Note, chú thích, mẹo vặt thừa thãi | Không ghi note trừ khi được yêu cầu. Giữ UI tập trung vào dữ liệu |
| Lạm dụng icon trên nút, tiêu đề, tab | Dùng chữ ngắn gọn; chỉ dùng icon khi thật sự cần thiết cho tính năng |
| Thẻ `<table>` thủ công với state tự viết | Dùng `<DataTable data={...} columns={...} />` duy nhất |
| `useState` cho search/sort/page ở cấp trang | DataTable tự quản lý bên trong, trang chỉ truyền data gốc |
| File > 400 dòng (frontend) hoặc > 500 dòng (backend) | Tách nhỏ thành subcomponents, hooks, tabs, service modules |
| Bộ lọc mờ `backdrop-blur-*` | Nền solid phẳng, độ tương phản cao, 0 lag GPU |
| Dropdown `<select>` gốc của trình duyệt | Dùng `<CustomSelect />` light theme phẳng |
| DatePicker `<input type="date">` gốc | Dùng `<CustomDatePicker />` light theme phẳng |
| Icon thùng rác đứng cạnh bút sửa | Một icon Bút Sửa (`<Edit3 />`), nút Xóa đặt trong Modal |
| Dấu phân cách Pipe `|` hoặc Chấm `•` | Dùng flex badges, spacing và typography |
| Điểm chưa nhập lưu thành `0` hoặc `0.0` | Lưu thành `NULL` |
| Làm tròn điểm số lên/xuống | Cắt gọn đúng 1 chữ số thập phân (`trunc1Dec`) |
| Đổ code dài dòng (code dump) vào chat | Trả lời súc tích, chỉ trích dẫn dòng cần thiết, kèm link file |
| Viết thành phần UI/token phân tán, lặp style ở từng trang | Mỗi thành phần (màu, button, table, chart, select, datepicker) BẮT BUỘC có **thư mục riêng + `index.ts`**. Sửa 1 nơi cập nhật toàn bộ app |

---

## 📦 10. Kiến Trúc Thư Mục Thành Phần Riêng Biệt (Modular Component & Token Isolation)

> **QUY TẮC CỐT LÕI: MỌI THÀNH PHẦN DÙNG CHUNG PHẢI CÓ THƯ MỤC RIÊNG VỚI BARREL EXPORT (`index.ts`). SỬA 1 NƠI — TỰ ĐỘNG CẬP NHẬT TOÀN BỘ ỨNG DỤNG.**

### 10.1. Danh Mục Thư Mục Thành Phần Chuẩn
1. **Màu Sắc & Tokens Hệ Thống (`src/theme/`)**:
   - Quản lý tập trung toàn bộ token màu sắc (`tokens.ts`), màu nền, viền, chữ, palette biểu đồ và hàm áp dụng theme (`applyTheme.ts`).
   - Khi cần đổi màu thương hiệu hay tone màu toàn app, CHỈ ĐƯỢC PHÉP sửa tại `src/theme/tokens.ts`.
2. **Nút Bấm Chuẩn (`src/components/button/`)**:
   - Quản lý `<Button />` (Primary, Secondary, Danger, Ghost, Outline) và `<SinglePenButton />` (nút Bút sửa duy nhất).
   - Khi muốn đổi bo góc, độ đậm viền hoặc hiệu ứng hover của nút, chỉ sửa 1 nơi tại `src/components/button/`.
3. **Bảng Dữ Liệu Chuẩn (`src/components/DataTable/` hoặc `src/components/table/`)**:
   - Quản lý TanStack Table wrapper, header kéo thả, bộ lọc tiêu đề cột, thanh phân trang 20 dòng.
4. **Biểu Đồ Chuẩn (`src/components/chart/`)**:
   - Quản lý các thành phần biểu đồ dùng chung (`MiniTrendSparkline`, `ChartHoverTooltip`, `chartConfig.ts`), quy chuẩn SVG circular glow và center-origin transform.
5. **Dropdown Select (`src/components/select/`)**:
   - Quản lý `<CustomSelect />` và `<CustomMultiSelect />`.
6. **Bộ Chọn Ngày (`src/components/datepicker/`)**:
   - Quản lý `<CustomDatePicker />`, `<MonthGridPicker />`, và `datePickerUtils.ts`.
7. **Hộp Thoại & Modal (`src/components/modal/`)**:
   - Quản lý `<ConfirmDialog />`, `useConfirm()`, `<ChangePasswordModal />`.
8. **Thẻ Tabs & Phân Đoạn (`src/components/tabs/`)**:
   - Quản lý `<SegmentedControl />` (Sliding Pill Indicator), `<VercelTabs />`, và `<TabWrapper />`.
9. **Ô Nhập Liệu Tiếng Việt (`src/components/input/`)**:
   - Quản lý `<VietnameseInput />` hỗ trợ gõ Telex/VNI mượt mà không nhảy con trỏ.
10. **Thông Báo Toasts (`src/components/toast/`)**:
   - Quản lý hàm `showToast()` và hệ thống thông báo trạng thái.

### 10.2. Quy Tắc "Single Source of Truth & Zero Repetition"
- **Không viết style ad-hoc**: Các trang BẮT BUỘC import thành phần trực tiếp từ thư mục đại diện (ví dụ: `import { Button } from '@/components/button'; import { CustomSelect } from '@/components/select'`).
- **Tuyệt đối cấm viết lại thẻ `<button>` hoặc thẻ `<table>` thủ công** với hàng chục class Tailwind trùng lặp rải rác khắp các file.
- **Tương thích ngược**: Mỗi thư mục luôn cung cấp `index.ts` để xuất khẩu gọn gàng và giữ file bridge ở vị trí cũ (nếu có) để tránh làm đứt gãy các import hiện hữu.

---

## 📁 11. Tham Chiếu Các File Quan Trọng

| File / Đường dẫn | Vai trò |
|---|---|
| `frontend/src/theme/` | Hệ thống màu sắc, tokens và theme tập trung |
| `frontend/src/components/button/` | Chuẩn nút bấm (Button, SinglePenButton) dùng chung |
| `frontend/src/components/DataTable/` | Chuẩn TanStack Table duy nhất cho mọi bảng dữ liệu |
| `frontend/src/components/chart/` | Chuẩn biểu đồ, sparkline, tooltip và SVG bounds |
| `frontend/src/components/select/` | Dropdown CustomSelect & CustomMultiSelect Light UI phẳng |
| `frontend/src/components/datepicker/` | Bộ chọn ngày CustomDatePicker & MonthGridPicker |
| `frontend/src/components/modal/` | Hộp thoại xác nhận ConfirmDialog và các modal dùng chung |
| `frontend/src/components/tabs/` | SegmentedControl và VercelTabs thanh điều hướng |
| `frontend/src/components/input/` | VietnameseInput chuẩn gõ tiếng Việt |
| `frontend/src/components/toast/` | Thông báo trạng thái showToast dùng chung |
| `frontend/src/api.ts` | Tất cả API calls kết nối Backend |
| `frontend/src/pages/` | Các trang chính (teachers, students, classes, courses, reports, schedule) |
| `.agents/AGENTS.md` | Bộ quy chuẩn cốt lõi duy nhất của toàn bộ dự án |

