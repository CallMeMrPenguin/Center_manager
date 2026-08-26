import os
import sys
import glob
import py_compile

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

py_files = []
for root, dirs, files in os.walk(backend_dir):
    if ".git" in root or "__pycache__" in root:
        continue
    for f in files:
        if f.endswith(".py") and not f.endswith(".backup.py"):
            py_files.append(os.path.join(root, f))

print(f"Compiling {len(py_files)} Python files in backend...")
errors = 0
for fpath in sorted(py_files):
    rel_path = os.path.relpath(fpath, backend_dir)
    try:
        py_compile.compile(fpath, doraise=True)
        print(f"  [OK] {rel_path}")
    except Exception as e:
        print(f"  [FAIL] {rel_path}: {e}")
        errors += 1

if errors == 0:
    print(f"\n[SUCCESS] All {len(py_files)} Python files compiled with 0 errors!")
else:
    print(f"\n[FAILURE] {errors} Python file(s) failed compilation.")
    sys.exit(1)
