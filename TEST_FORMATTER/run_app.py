import os
import subprocess
import sys

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("======================================================")
    print("          ANTIGRAVITY OFFLINE APP LAUNCHER            ")
    print("======================================================\n")
    
    # 1. Install pip requirements
    print("[*] Checking python dependencies (Streamlit & python-docx)...")
    subprocess.run("py -m pip install -r requirements.txt", shell=True, cwd=root_dir)
    print("[+] Dependencies check completed.\n")
    
    # 2. Launch Streamlit app (which runs locally and opens in browser)
    print("[+] Launching offline Streamlit browser dashboard...")
    subprocess.run("py -m streamlit run app.py", shell=True, cwd=root_dir)

if __name__ == "__main__":
    main()
