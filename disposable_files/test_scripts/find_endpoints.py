import re
with open("c:/Users/ACER/Desktop/Center_Manager_App/backend/main.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "@app." in line:
        print(f"Line {i+1}: {line.strip()}")
