import os
root_dir = "c:/Users/ACER/Desktop/Center_Manager_App"
for root, dirs, files in os.walk(root_dir):
    if ".git" in root or "node_modules" in root or ".gemini" in root:
        continue
    for file in files:
        if file.endswith((".py", ".json", ".js", ".ts", ".tsx", ".html", ".css")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                if "UpKid_File_Manager" in content:
                    print(f"Found in {path}")
            except Exception:
                pass
