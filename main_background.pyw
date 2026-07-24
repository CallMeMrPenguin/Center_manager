# -*- coding: utf-8 -*-
"""
CENTER MANAGER -- Silent Background Launcher (.pyw)
Runs the FastAPI server silently in the background without opening a CMD console window.
"""

import sys
import os

# Add workspace directory to sys.path
ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(ROOT)
sys.path.append(os.path.join(ROOT, "backend"))

# Pass --background flag to main.py logic
sys.argv.append("--background")

if __name__ == "__main__":
    from main import main
    main()
