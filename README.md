# Center Manager App

Hệ thống quản lý trung tâm gia sư, ngân hàng câu hỏi và chấm thi học sinh (Desktop & Web VPS).

---

## Cấu trúc thư mục dự án

```text
Center_Manager_App/
├── backend/            # Python FastAPI Backend, SQLite / PostgreSQL logic
├── frontend/           # React 19 + TypeScript + Vite + TailwindCSS v4
├── configs/            # Toàn bộ cấu hình hệ thống (JSON configs)
├── data/               # Cơ sở dữ liệu SQLite cục bộ (test_formatter.db)
├── docs/               # Tài liệu dự án, hướng dẫn VPS & kiến trúc
│   ├── Do_later.md
│   ├── IMPLEMENTATION.md
│   ├── VPS_INFO.md
│   ├── future web app implementations.md
│   ├── vps_deployment_guide.md
│   ├── walkthrough.md
│   └── ui_references/  # Hình ảnh UI mẫu & thiết kế
├── scripts/            # Scripts vận hành VPS, tự động cập nhật & dev
│   ├── dev.py          # Script khởi chạy dev song song (Backend + Frontend)
│   ├── deploy_vps.sh   # Script triển khai VPS
│   ├── run_vps.sh      # Master controller khởi động & tự động cấu hình VPS
│   ├── auto_pull.sh    # Watcher daemon tự kéo cập nhật từ GitHub
│   ├── update.sh       # Script cập nhật nhanh
│   └── optimize_vps.sh # Script tối ưu hóa bộ nhớ VPS
├── disposable_files/   # Các script tạm, prototype cũ & file dùng 1 lần
├── installer/          # Cấu hình đóng gói installer Windows (.exe)
├── workspace_files/    # Thư mục lưu trữ tài liệu Word sinh ra
├── main.py             # Điểm khởi chạy ứng dụng Desktop
├── start.bat           # File khởi chạy nhanh cho người dùng Windows
├── updater.py          # Bộ tự động cập nhật phiên bản in-place
├── VERSION             # Chuỗi phiên bản ứng dụng hiện tại
└── docker-compose.yml  # Cấu hình Docker containers cho môi trường VPS
```

---

## Hướng dẫn khởi chạy

### Chế độ phát triển (Development):
```bash
python scripts/dev.py
```

### Chế độ Desktop thông thường:
Nhấp đúp chuột vào `start.bat` hoặc chạy:
```bash
python main.py
```

---

## Tài liệu chi tiết
- [Kiến trúc & Triển khai](docs/IMPLEMENTATION.md)
- [Thông tin máy chủ VPS](docs/VPS_INFO.md)
- [Hướng dẫn cấu hình VPS](docs/vps_deployment_guide.md)
- [Tổng quan quy trình](docs/walkthrough.md)
- [Kế hoạch phát triển tiếp theo](docs/Do_later.md)
