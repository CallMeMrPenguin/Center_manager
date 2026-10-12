import json
import sys

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

with open("report_100_users.html", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('"num_requests"')
if idx != -1:
    start = text.rfind('[', 0, idx)
    end = text.find(']', idx)
    snippet = text[start:end+1]
    data = json.loads(snippet)
    
    print("=" * 105)
    print(f"{'Method':<6} {'Endpoint':<22} {'Reqs':<8} {'Fails':<6} {'Avg (ms)':<10} {'Min':<6} {'Max':<6} {'Med (p50)':<10} {'p95':<6} {'p99':<6} {'RPS':<6}")
    print("=" * 105)
    for r in data:
        name = r.get("name", "")
        method = r.get("method", "") or ""
        reqs = r.get("num_requests", 0)
        fails = r.get("num_failures", 0)
        avg_ms = round(r.get("avg_response_time", 0), 1)
        min_ms = round(r.get("min_response_time", 0))
        max_ms = round(r.get("max_response_time", 0))
        med_ms = r.get("median_response_time", 0)
        p95 = r.get("response_time_percentile_0.95", 0)
        p99 = r.get("response_time_percentile_0.99", 0)
        rps = round(r.get("total_rps", 0), 2)
        print(f"{method:<6} {name:<22} {reqs:<8} {fails:<6} {avg_ms:<10} {min_ms:<6} {max_ms:<6} {med_ms:<10} {p95:<6} {p99:<6} {rps:<6}")
    print("=" * 105)

# Also check for percentiles table
idx_pct = text.find('"percentiles"')
if idx_pct != -1:
    start = text.find('[', idx_pct)
    end = text.find(']', start)
    snippet = text[start:end+1]
    p_data = json.loads(snippet)
    print("\nPERCENTILE DETAILS:")
    for p in p_data:
        name = p.get("name", "")
        print(f"\nEndpoint: {name}")
        for k in ["0.5", "0.66", "0.75", "0.8", "0.9", "0.95", "0.99", "1.0"]:
            if k in p:
                print(f"  {k:>4}: {p[k]} ms")
