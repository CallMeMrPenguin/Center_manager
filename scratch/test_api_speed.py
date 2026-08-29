import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, path):
    t0 = time.time()
    try:
        r = requests.get(f"{BASE_URL}{path}", timeout=10)
        dt = (time.time() - t0) * 1000
        print(f"[{name}] status={r.status_code}, time={dt:.1f}ms, size={len(r.content)} bytes")
    except Exception as e:
        dt = (time.time() - t0) * 1000
        print(f"[{name}] ERROR after {dt:.1f}ms: {e}")

if __name__ == "__main__":
    print("Testing actual API endpoints response speed...")
    test_endpoint("Classes", "/api/classes?search=")
    test_endpoint("Students", "/api/students?search=&status=")
    test_endpoint("Teachers", "/api/teachers_cm?search=&role=")
    test_endpoint("Courses", "/api/courses?search=&status=")
    test_endpoint("Grade Analytics", "/api/reports/grade-analytics?")
    test_endpoint("Assignments", "/api/assignments")
