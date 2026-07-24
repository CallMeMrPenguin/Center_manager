# Desktop Document Compiler - Standalone Offline Streamlit App

This project is a **100% offline standalone desktop web application** built with Streamlit and python-docx. It compiles a local JSON questions file (such as `TEST.json`) directly into a native Microsoft Word (`.docx`) file conforming to strict academic formatting rules.

No external API keys, internet connection, Node/npm, or Electron installs are needed.

---

## 1. Application Architecture (Offline Streamlit)

```
[ Local JSON File / Pasted JSON ]
                │
                ▼ (Load or Paste)
┌──────────────────────────────────────────────┐
│  Streamlit Web UI (Offline in Local Browser) │
└──────────────────────┬───────────────────────┘
                       │ (Executes Compiler Engine)
                       ▼
┌──────────────────────────────────────────────┐
│  python-docx Layout & Styling Engine         │
│  - Margins: Top/Bottom=2cm, Left=3cm, etc.   │
│  - Aligned Options Tables (4-col, 2-col)     │
│  - Text styles: [under], **bold**, [his](A)  │
│  - Parsers for Cloze, Reading & Reordering   │
└──────────────────────┬───────────────────────┘
                       │ (Compiles Word Document in-memory)
                       ▼
┌──────────────────────────────────────────────┐
│  Streamlit Download Button                   │
└──────────────────────────────────────────────┘
```

---

## 2. File Structure

- **`app.py`**: The Streamlit web GUI showing live option grid previews, Cloze/Reading passage formatting, and notices, with in-memory docx compiling.
- **`compiler.py`**: The underlying layout-deterministic compilation module (`WordDocumentCompiler` class).
- **`requirements.txt`**: Python dependencies (`streamlit` and `python-docx`).
- **`run_app.py`**: Autolauncher script which checks/installs dependencies and launches Streamlit.
- **`run_app.bat`**: Double-clickable shortcut file to start the launcher.
- **`TEST.json`**: Example JSON question configuration file.

---

## 3. How to Launch and Use the App

1. Double-click the **`run_app.bat`** file in this directory.
2. The launcher will automatically:
   - Check if you have requirements installed (runs `pip install -r requirements.txt`).
   - Start the local Streamlit application.
   - Open the dark-themed dashboard directly in your default web browser (`http://localhost:8501`).
3. Under **Choose Input Method**:
   - Upload the `TEST.json` file, or paste your custom JSON payload.
4. Review the **Live Layout Preview** on the right to see the formatted passage blocks, signs, notices, and aligned options columns.
5. Click **DOWNLOAD WORD DOCUMENT (.DOCX)** to save your compiled file!
