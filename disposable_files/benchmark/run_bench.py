"""
Benchmark Tool for Center Manager App:
Simulates 100 concurrent active users over 10 minutes.
Uses built-in asyncio + httpx (Zero external tools required).
"""
import asyncio
import time
import random
import sys
import argparse
from typing import List

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

try:
    import httpx
except ImportError:
    print("[ERROR] 'httpx' is required. Run: py -m pip install httpx")
    sys.exit(1)

ENDPOINTS = [
    ("/api/students", 4),
    ("/api/classes", 3),
    ("/api/teachers", 2),
    ("/api/courses", 2),
    ("/api/system/version", 1),
    ("/", 1),
]

# Flatten weighted endpoints
WEIGHTED_ENDPOINTS = []
for ep, weight in ENDPOINTS:
    WEIGHTED_ENDPOINTS.extend([ep] * weight)

class BenchmarkStats:
    def __init__(self):
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
        self.status_codes = {}
        self.latencies: List[float] = []
        self.start_time = 0
        self._lock = asyncio.Lock()

    async def record(self, status_code: int, duration_ms: float, is_success: bool):
        async with self._lock:
            self.total_requests += 1
            if is_success:
                self.successful_requests += 1
            else:
                self.failed_requests += 1
            self.status_codes[status_code] = self.status_codes.get(status_code, 0) + 1
            self.latencies.append(duration_ms)

    def get_summary(self):
        elapsed = max(time.time() - self.start_time, 0.001)
        sorted_latencies = sorted(self.latencies) if self.latencies else [0]
        n = len(sorted_latencies)
        p50 = sorted_latencies[int(n * 0.50)] if n > 0 else 0
        p95 = sorted_latencies[int(n * 0.95)] if n > 0 else 0
        p99 = sorted_latencies[int(n * 0.99)] if n > 0 else 0
        avg_lat = sum(sorted_latencies) / n if n > 0 else 0

        return {
            "elapsed_s": round(elapsed, 1),
            "total_req": self.total_requests,
            "success_req": self.successful_requests,
            "failed_req": self.failed_requests,
            "rps": round(self.total_requests / elapsed, 2),
            "avg_ms": round(avg_lat, 1),
            "p50_ms": round(p50, 1),
            "p95_ms": round(p95, 1),
            "p99_ms": round(p99, 1),
            "status_codes": dict(self.status_codes)
        }

async def simulated_user(user_id: int, base_url: str, stop_event: asyncio.Event, stats: BenchmarkStats):
    """
    Simulates 1 active user making periodic requests with human think time (1 - 3 seconds).
    """
    # Stagger user initial startup (ramp up)
    await asyncio.sleep(random.uniform(0.1, 5.0))
    
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    async with httpx.AsyncClient(base_url=base_url, timeout=15.0, limits=limits, verify=False, follow_redirects=True) as client:
        while not stop_event.is_set():
            endpoint = random.choice(WEIGHTED_ENDPOINTS)
            t0 = time.perf_counter()
            try:
                resp = await client.get(endpoint)
                dur_ms = (time.perf_counter() - t0) * 1000.0
                is_ok = 200 <= resp.status_code < 400
                await stats.record(resp.status_code, dur_ms, is_ok)
            except Exception as e:
                dur_ms = (time.perf_counter() - t0) * 1000.0
                await stats.record(599, dur_ms, False)

            # Think time: 1.0 to 2.5 seconds between clicks
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=random.uniform(1.0, 2.5))
            except asyncio.TimeoutError:
                pass

async def live_reporter(stop_event: asyncio.Event, stats: BenchmarkStats, total_seconds: int):
    while not stop_event.is_set():
        await asyncio.sleep(5)
        s = stats.get_summary()
        remain = max(0, int(total_seconds - s["elapsed_s"]))
        rem_m, rem_s = divmod(remain, 60)
        err_pct = (s["failed_req"] / s["total_req"] * 100) if s["total_req"] > 0 else 0.0
        
        print(
            f"[{int(s['elapsed_s'])}s | Con: {rem_m:02d}:{rem_s:02d}] "
            f"Reqs: {s['total_req']} | RPS: {s['rps']} | "
            f"Latency: p50={s['p50_ms']}ms, p95={s['p95_ms']}ms | "
            f"Lỗi: {s['failed_req']} ({err_pct:.1f}%)"
        )

async def main():
    parser = argparse.ArgumentParser(description="Center Manager Load Benchmark")
    parser.add_argument("--host", default="http://160.30.161.121", help="Target base URL (default: http://160.30.161.121)")
    parser.add_argument("--users", type=int, default=100, help="Number of active concurrent users (default: 100)")
    parser.add_argument("--duration", type=int, default=600, help="Duration in seconds (default: 600s = 10 mins)")
    args = parser.parse_args()

    print("=" * 70)
    print(" BENCHMARK TẢI: CENTER MANAGER APP")
    print(f" Target Host   : {args.host}")
    print(f" Active Users  : {args.users} users đồng thời")
    print(f" Thời gian test: {args.duration}s ({args.duration // 60} phút)")
    print(f" Think Time    : 1.0 - 2.5s / thao tác (Mô phỏng người dùng thật)")
    print("=" * 70)
    print("Đang khởi tạo các active user... Nhấn Ctrl+C để dừng sớm bất kỳ lúc nào.\n")

    stats = BenchmarkStats()
    stats.start_time = time.time()
    stop_event = asyncio.Event()

    # Launch users
    user_tasks = [
        asyncio.create_task(simulated_user(i, args.host, stop_event, stats))
        for i in range(args.users)
    ]
    reporter_task = asyncio.create_task(live_reporter(stop_event, stats, args.duration))

    try:
        await asyncio.sleep(args.duration)
    except (asyncio.CancelledError, KeyboardInterrupt):
        print("\n[!] Đã nhận tín hiệu dừng từ người dùng...")
    finally:
        stop_event.set()
        reporter_task.cancel()
        await asyncio.gather(*user_tasks, return_exceptions=True)

    summary = stats.get_summary()
    err_rate = (summary["failed_req"] / summary["total_req"] * 100) if summary["total_req"] > 0 else 0.0

    print("\n" + "=" * 70)
    print(" KẾT QUẢ TỔNG KẾT BENCHMARK (SUMMARY REPORT)")
    print("=" * 70)
    print(f" Thời gian thực tế     : {summary['elapsed_s']} giây")
    print(f" Tổng số request       : {summary['total_req']} reqs")
    print(f" Thành công            : {summary['success_req']} reqs")
    print(f" Thất bại (Lỗi)        : {summary['failed_req']} reqs ({err_rate:.2f}%)")
    print(f" Throughput trung bình : {summary['rps']} Requests / Giây (RPS)")
    print(f" Latency trung bình    : {summary['avg_ms']} ms")
    print(f" Latency Percentile 50%: {summary['p50_ms']} ms (50% người dùng nhận kết quả dưới mức này)")
    print(f" Latency Percentile 95%: {summary['p95_ms']} ms (95% người dùng nhận kết quả dưới mức này)")
    print(f" Latency Percentile 99%: {summary['p99_ms']} ms")
    print(f" Chi tiết HTTP Status  : {summary['status_codes']}")
    print("=" * 70)

    # Đánh giá sức khỏe VPS
    print("\n ĐÁNH GIÁ SỨC KHỎE VPS:")
    if err_rate == 0 and summary["p95_ms"] < 400:
        print(" [XUẤT SẮC] VPS xử lý cực kỳ mượt mà! 0% lỗi và độ trễ rất thấp (<400ms).")
    elif err_rate < 0.5 and summary["p95_ms"] < 1000:
        print(" [TỐT / ỔN ĐỊNH] VPS xử lý tốt 100 active user. Độ trễ chấp nhận được.")
    elif err_rate < 5.0 or summary["p95_ms"] < 2500:
        print(" [CẢNH BÁO NGHẼN] Có hiện tượng chậm hoặc lỗi nhẹ. Cần tăng Uvicorn workers hoặc kiểm tra DB queries.")
    else:
        print(" [QUÁ TẢI] VPS bị quá tải hoặc nghẽn mạng! Tỉ lệ lỗi cao hoặc độ trễ > 2.5s.")
    print("=" * 70)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
