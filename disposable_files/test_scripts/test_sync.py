import sys
sys.path.append('backend')
from services.sync_service import run_bidirectional_sync
import json

res = run_bidirectional_sync(force_full=True)
print("FORCE FULL SYNC RESULT:")
print(json.dumps(res, indent=2, ensure_ascii=False))

res2 = run_bidirectional_sync(force_full=False)
print("DELTA SYNC RESULT:")
print(json.dumps(res2, indent=2, ensure_ascii=False))
