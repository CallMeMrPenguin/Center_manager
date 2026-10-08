# Disposable & Scratch Files (Thư mục tệp dùng 1 lần)

Thư mục này gom nhóm tất cả các tệp dùng 1 lần, kịch bản thử nghiệm cục bộ, báo cáo cũ và tệp tạm thời không thuộc mã nguồn chính của ứng dụng:

## Cấu trúc thư mục:
- `test_scripts/`: Các script python dùng để kiểm tra tốc độ API, đối soát giới hạn, kiểm thử dữ liệu các lớp hoặc debug tính năng.
- `patches_and_reports/`: Báo cáo HTML kiểm thử tải 100 người dùng và các tệp SQL vá lỗi tạm thời trước đây.
- `unused_dbs/`: Các tệp SQLite 0-byte rỗng được tạo ra trong các phiên thử nghiệm cũ.
