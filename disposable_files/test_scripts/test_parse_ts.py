from datetime import datetime, timezone

# 1. Old _parse_ts
def old_parse_ts(val):
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        return val.timestamp()
    try:
        s = str(val).replace("T", " ").split("+")[0].split(".")[0]
        return datetime.strptime(s, "%Y-%m-%d %H:%M:%S").timestamp()
    except Exception:
        return 0.0

# 2. Fixed _parse_ts
def fixed_parse_ts(val):
    if not val:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, datetime):
        if val.tzinfo is not None:
            return val.timestamp()
        return val.replace(tzinfo=timezone.utc).timestamp()
    try:
        s = str(val).strip().replace("T", " ")
        if "+" in s:
            # ISO with offset e.g. "2026-08-29 15:47:15.316818+00:00"
            return datetime.fromisoformat(s).timestamp()
        elif s.endswith("Z"):
            return datetime.fromisoformat(s[:-1]).replace(tzinfo=timezone.utc).timestamp()
        else:
            # SQLite CURRENT_TIMESTAMP is UTC
            base = s.split(".")[0]
            return datetime.strptime(base, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc).timestamp()
    except Exception as e:
        return 0.0

# Test values
sqlite_val = "2026-08-29 15:47:15.316818+00:00"
sqlite_curr_ts = "2026-08-29 15:47:15"
pg_val = datetime(2026, 8, 29, 15, 47, 15, 316818, tzinfo=timezone.utc)

print("--- OLD PARSE TS ---")
print("sqlite_val:", old_parse_ts(sqlite_val))
print("sqlite_curr_ts:", old_parse_ts(sqlite_curr_ts))
print("pg_val:    ", old_parse_ts(pg_val))
print("Difference (old):", old_parse_ts(pg_val) - old_parse_ts(sqlite_val))

print("\n--- FIXED PARSE TS ---")
print("sqlite_val:", fixed_parse_ts(sqlite_val))
print("sqlite_curr_ts:", fixed_parse_ts(sqlite_curr_ts))
print("pg_val:    ", fixed_parse_ts(pg_val))
print("Difference (fixed):", fixed_parse_ts(pg_val) - fixed_parse_ts(sqlite_val))
