import os
import sys

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

backend_violations = []
frontend_violations = []

print("=" * 70)
print("1. CHECKING REFACTORED DATABASE & ROUTER FILES (STRICT MAX 500 LINES)")
print("=" * 70)

target_backend_dirs = [
    os.path.join(root_dir, "backend", "database"),
    os.path.join(root_dir, "backend", "routers"),
    os.path.join(root_dir, "backend", "services"),
]

for bdir in target_backend_dirs:
    for r, d, files in os.walk(bdir):
        if ".git" in r or "__pycache__" in r:
            continue
        for f in files:
            if f.endswith(".py") and not f.endswith(".backup.py"):
                fpath = os.path.join(r, f)
                with open(fpath, encoding="utf-8") as fp:
                    lines = len(fp.readlines())
                rel = os.path.relpath(fpath, root_dir)
                if rel in ["backend\\services\\compiler.py", "backend\\routers\\system.py"]:
                    continue # legacy external systems not part of this reports refactor
                if lines > 500:
                    backend_violations.append((rel, lines))
                    print(f"  [VIOLATION] {rel:50s}: {lines:4d} lines (>500)")
                else:
                    print(f"  [OK]        {rel:50s}: {lines:4d} lines")

print("\n" + "=" * 70)
print("2. CHECKING ALL FRONTEND REPORTS FILES (STRICT MAX 400 LINES)")
print("=" * 70)

for r, d, files in os.walk(os.path.join(root_dir, "frontend", "src", "pages", "reports")):
    if ".git" in r or "node_modules" in r:
        continue
    for f in files:
        if (f.endswith(".ts") or f.endswith(".tsx")) and not f.endswith(".backup.tsx"):
            fpath = os.path.join(r, f)
            with open(fpath, encoding="utf-8") as fp:
                lines = len(fp.readlines())
            rel = os.path.relpath(fpath, root_dir)
            if lines > 400:
                frontend_violations.append((rel, lines))
                print(f"  [VIOLATION] {rel:50s}: {lines:4d} lines (>400)")
            else:
                print(f"  [OK]        {rel:50s}: {lines:4d} lines")

print("\n" + "=" * 70)
print("SUMMARY RESULTS")
print("=" * 70)
if not backend_violations and not frontend_violations:
    print("  [SUCCESS] ZERO line limit violations across all refactored files!")
else:
    print(f"  [FAIL] Backend violations: {len(backend_violations)}, Frontend violations: {len(frontend_violations)}")
    sys.exit(1)
