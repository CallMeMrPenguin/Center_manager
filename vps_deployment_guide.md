# Hướng Dẫn Triển Khai Center Manager Lên VPS (PostgreSQL Thuần)

Tài liệu này hướng dẫn chi tiết cách triển khai toàn bộ ứng dụng **Center Manager** lên máy chủ VPS độc lập với cơ sở dữ liệu **PostgreSQL** và kiến trúc **Client-Side Heavy** (tất cả tính toán, xếp chỗ, phân tích, xuất Excel chạy trực tiếp trên trình duyệt của người dùng).

---

## 1. Yêu Cầu Chuẩn Bị Trên VPS
- VPS chạy Ubuntu 22.04 LTS / 24.04 LTS (hoặc Debian).
- RAM: Tối thiểu 1GB (khuyến nghị 2GB).
- Đã cài đặt **Docker** & **Docker Compose**:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo apt-get install -y docker-compose-plugin
  ```

---

## 2. Triển Khai Nhanh Bằng Docker Compose (Khuyến Nghị)

### Bước 1: Sao chép dự án lên VPS
```bash
git clone https://github.com/CallMeMrPenguin/Center_manager.git
cd Center_manager
```

### Bước 2: Khởi chạy PostgreSQL và FastAPI Backend
```bash
# Khởi động PostgreSQL và Backend
docker compose up -d --build
```
Hệ thống sẽ:
1. Tạo container PostgreSQL 16 và tự động chạy schema khởi tạo ban đầu (`supabase_schema.sql`).
2. Khởi tạo container FastAPI backend kết nối nội bộ tốc độ cao với PostgreSQL qua `DATABASE_URL`.
3. Mở cổng `8000` cho API.

### Bước 3: Build & Phục Vụ Frontend
Có thể build frontend trực tiếp trên VPS hoặc đưa thư mục `frontend/dist` lên Caddy / Nginx:
```bash
cd frontend
npm install
npm run build
# Thư mục build nằm tại: frontend/dist
```
Cấu hình Caddy đơn giản (`/etc/caddy/Caddyfile`) để phục vụ SSL tự động:
```caddy
your-domain.com {
    root * /path/to/Center_manager/frontend/dist
    file_server
    try_files {path} /index.html

    # Proxy API về backend
    handle /api/* {
        reverse_proxy localhost:8000
    }
    handle /auth/* {
        reverse_proxy localhost:8000
    }
    handle /users/* {
        reverse_proxy localhost:8000
    }
}
```

---

## 3. Kiến Trúc Client-Heavy (Xử Lý Tại Trình Duyệt)
- **Tính toán điểm & độ lệch**: Tính trực tiếp trong React component `AttendanceGradesTab.tsx` theo công thức:
  $$\text{Độ Lệch} = |\text{BTVN} - \text{Trung Bình}(\text{Check 1}, \text{Check 2})|$$
- **Xuất Excel (.xlsx)**: Sử dụng thư viện `ExcelJS` chạy trực tiếp trên trình duyệt, chỉ xuất các cột đang được toggle hiển thị trên bảng, không gây tải CPU cho VPS.
- **Xếp chỗ Genetic Algorithm & Đổi bài Blossom**: Chạy hoàn toàn trên máy khách, backend chỉ lưu trữ và trả về kết quả JSON.
