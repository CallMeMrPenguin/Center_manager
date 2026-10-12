# HƯỚNG DẪN CHẠY BENCHMARK 100 ACTIVE USERS TRONG 10 PHÚT

Tài liệu này hướng dẫn cách kiểm tra khả năng chịu tải của VPS (IP: `160.30.161.121` hoặc Domain `https://upkidscentermanager.io.vn`) với 100 người dùng hoạt động đồng thời liên tục trong 10 phút.

---

## 1. Khái niệm "100 Active Users" trong 10 phút

- **100 người dùng đồng thời (Concurrency = 100)**: Mô phỏng 100 học sinh/giáo viên thực tế đang vào hệ thống.
- **Hành vi thực tế (Think Time 1 - 2.5s)**: Giữa mỗi lần bấm xem danh sách học sinh, lớp học, giáo viên,... người dùng dừng lại 1-2.5s để đọc giao diện.
- **Tải lên VPS**: Tạo ra khoảng **30 - 80 Requests/giây (RPS)** đều đặn và bền bỉ trong suốt 10 phút (tương đương 20,000 - 45,000 requests).

---

## 2. Cách 1: Dùng Locust (Giao diện Web hoặc Tự động xuất HTML Report)

### Cách 1A: Chạy bằng giao diện Web UI (Trực quan nhất)
1. Mở Terminal tại thư mục dự án và chạy:
   ```bash
   py -m locust -f benchmark/locustfile.py --host https://upkidscentermanager.io.vn
   ```
2. Mở trình duyệt truy cập: `http://localhost:8089`
3. Điền các thông số:
   - **Number of users**: `100`
   - **Ramp up**: `10` (mỗi giây tăng 10 user cho đến khi đủ 100)
   - **Host**: `https://upkidscentermanager.io.vn` (hoặc `http://160.30.161.121`)
4. Bấm **Start swarming**. Bạn sẽ thấy biểu đồ thời gian thực về RPS, Latency và Error rate. Sau 10 phút bấm **Stop**.

### Cách 1B: Chạy dòng lệnh tự động 10 phút & xuất báo cáo HTML
Chạy 1 lệnh duy nhất, hệ thống tự đếm ngược 10 phút (`--run-time 10m`) và xuất file báo cáo `report_100_users.html`:
```bash
py -m locust -f benchmark/locustfile.py --headless -u 100 -r 10 --run-time 10m --host https://upkidscentermanager.io.vn --html report_100_users.html
```

---

## 3. Cách 2: Dùng Script độc lập `run_bench.py` (In kết quả trực tiếp ra Terminal)

Script `run_bench.py` đã viết sẵn sử dụng thư viện `httpx` async:
- Tự động hiển thị tiến trình mỗi 5 giây.
- Đếm ngược đúng 10 phút (600 giây).
- Tự động xuất bảng tổng kết và đánh giá sức khỏe VPS.

### Lệnh chạy 10 phút:
```bash
py benchmark/run_bench.py --host https://upkidscentermanager.io.vn --users 100 --duration 600
```
*(Nếu muốn test nhanh 1 phút trước để thử nghiệm: đổi `--duration 60`)*

---

## 4. Cách theo dõi (Monitor) VPS trong lúc đang chạy Benchmark

Trong lúc máy tính của bạn đang chạy benchmark, mở thêm 1 cửa sổ Terminal SSH vào VPS để quan sát máy chủ hoạt động:

```bash
ssh root@160.30.161.121
```

### 1. Quan sát Docker Containers:
```bash
docker stats
```
- Xem container `center_manager_backend`: % CPU và RAM chiếm bao nhiêu.
- Xem container `center_manager_db`: % CPU và RAM của PostgreSQL.

### 2. Quan sát toàn hệ thống VPS:
```bash
htop
```
- Xem tổng CPU các nhân và lượng RAM / Swap sử dụng.

---

## 5. Tiêu chuẩn đánh giá VPS "Xử lý ổn"

| Chỉ số | Ổn định (Tốt) | Cần tối ưu thêm | Bị quá tải |
|---|---|---|---|
| **Tỉ lệ lỗi (Error %)** | 0% (hoặc < 0.1%) | 0.5% - 2% | > 5% (xuất hiện 502/504) |
| **Latency p95** | < 400ms | 500ms - 1500ms | > 2500ms |
| **CPU VPS** | Dưới 70% | 75% - 90% | 100% liên tục |
| **RAM VPS** | Ổn định, không tràn Swap | Dùng một phần Swap | Hết RAM, container bị kill |
