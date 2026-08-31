import sqlite3
import psycopg2
import psycopg2.extras
import sys
sys.path.append('backend')
from services.sync_service import _parse_ts, FAST_SYNC_TABLES

conn = sqlite3.connect('test_formatter.db')
conn.row_factory = sqlite3.Row
scur = conn.cursor()

SUPABASE_DEFAULT_DB_URL = "postgresql://postgres.jttlekzqveygejvyhfqn:Callmemrpenguin%402004@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
pconn = psycopg2.connect(SUPABASE_DEFAULT_DB_URL, connect_timeout=8)
pcur = pconn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

table = "class_attendance_grades"
pks = ["class_id", "student_id", "date"]

scur.execute(f"SELECT * FROM {table}")
local_rows = [dict(r) for r in scur.fetchall()]

pcur.execute(f"SELECT * FROM {table}")
cloud_rows = [dict(r) for r in pcur.fetchall()]

def make_pk(row):
    return tuple(str(row.get(k, "")) for k in pks)

local_map = {make_pk(r): r for r in local_rows}
cloud_map = {make_pk(r): r for r in cloud_rows}

print(f"Total local rows: {len(local_rows)}, Total cloud rows: {len(cloud_rows)}")

for k in list(local_map.keys())[:10]:
    loc = local_map[k]
    cld = cloud_map.get(k)
    if loc and cld:
        loc_raw = loc.get("updated_at") or loc.get("created_at")
        cld_raw = cld.get("updated_at") or cld.get("created_at")
        loc_ts = _parse_ts(loc_raw)
        cld_ts = _parse_ts(cld_raw)
        print(f"PK {k}:")
        print(f"  loc_raw={loc_raw} (type={type(loc_raw)}) -> loc_ts={loc_ts}")
        print(f"  cld_raw={cld_raw} (type={type(cld_raw)}) -> cld_ts={cld_ts}")
        print(f"  diff={cld_ts - loc_ts} (cld > loc: {cld_ts > loc_ts})")
        print(f"  loc scores: c1={loc.get('check_1')}, c2={loc.get('check_2')}, hw={loc.get('homework')}")
        print(f"  cld scores: c1={cld.get('check_1')}, c2={cld.get('check_2')}, hw={cld.get('homework')}")
