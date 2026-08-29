import urllib.request
import json
import time

try:
    t0 = time.time()
    req = urllib.request.Request('http://127.0.0.1:8000/api/classes/5/attendance?date=2026-08-29')
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'GET time: {time.time() - t0:.3f}s, records count: {len(data.get("records", []))}')

    t0 = time.time()
    body = json.dumps({'date': '2026-08-29', 'records': [{'student_id': 30, 'check_1': 8.5, 'check_2': 9.0, 'homework': 10.0, 'status': 'Có mặt'}]}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/classes/5/attendance', data=body, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print(f'POST time: {time.time() - t0:.3f}s, res: {res}')
except Exception as e:
    print('Error:', e)
