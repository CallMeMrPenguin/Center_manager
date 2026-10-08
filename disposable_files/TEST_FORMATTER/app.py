import os
import sys
import json
import io
import re
import base64
import http.server
import socketserver
import threading
import streamlit as st

# Add root folder to sys path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from compiler import WordDocumentCompiler, MOCK_PAYLOAD

# ================= CONFIGURATION STORAGE AND PERSISTENCE =================
DEFAULT_SETTINGS = {
    "margin_top": 2.0,
    "margin_bottom": 2.0,
    "margin_left": 3.0,
    "margin_right": 1.5,
    "font_name": "Times New Roman",
    "font_size": 12.0,
    "line_spacing": 1.15,
    "space_after": 6.0,
    "header_space_before": 14.0,
    "header_space_after": 8.0,
    "question_space_before": 6.0,
    "question_space_after": 4.0,
    "options_left_indent": 0.5,
    "options_space_before": 0.0,
    "options_space_after": 3.0,
    "passage_space_before": 4.0,
    "passage_space_after": 6.0,
    "passage_indent_first": 0.75,
    "reorder_space_before": 0.0,
    "reorder_space_after": 2.0,
    "reorder_left_indent": 1.0,
    "notice_space_before": 4.0,
    "notice_space_after": 6.0,
    "notice_left_indent": 1.0
}

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "saved_configs.json")

def load_saved_configs():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    if "Default Settings" not in loaded:
                        loaded["Default Settings"] = DEFAULT_SETTINGS.copy()
                    return loaded
        except Exception as e:
            print(f"Error loading configs: {e}")
    return {"Default Settings": DEFAULT_SETTINGS.copy()}

def save_configs(configs):
    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(configs, f, indent=2)
    except Exception as e:
        print(f"Error saving configs: {e}")

def on_config_select():
    selected = st.session_state.config_select_box
    config_data = st.session_state.saved_configs.get(selected, DEFAULT_SETTINGS)
    for key, val in DEFAULT_SETTINGS.items():
        st.session_state[f"w_{key}"] = config_data.get(key, val)

# Initialize session state for configurations
if "saved_configs" not in st.session_state:
    st.session_state.saved_configs = load_saved_configs()

if "config_select_box" not in st.session_state:
    st.session_state.config_select_box = "Default Settings"

# Set up state values for each setting widget
for key, val in DEFAULT_SETTINGS.items():
    state_key = f"w_{key}"
    if state_key not in st.session_state:
        current_config = st.session_state.saved_configs.get(st.session_state.config_select_box, DEFAULT_SETTINGS)
        st.session_state[state_key] = current_config.get(key, val)

# Set premium wide-mode layout and header
st.set_page_config(
    page_title="Antigravity Offline Compiler",
    page_icon="📝",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom premium dark mode CSS styles
st.markdown("""
<style>
    /* Dark Theme Core Styles */
    .stApp {
        background-color: #030712;
        color: #f1f5f9;
    }
    
    /* Header Container styling */
    .header-box {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid #334155;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    
    .header-title {
        font-family: 'Outfit', sans-serif;
        font-size: 28px;
        font-weight: 800;
        background: linear-gradient(to right, #38bdf8, #818cf8);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 4px;
    }
    
    .header-subtitle {
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        color: #94a3b8;
    }
    
    /* Card Panel styling */
    .card-panel {
        background-color: #0b0f19;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
    }
    
    .section-title {
        font-size: 16px;
        font-weight: 700;
        color: #38bdf8;
        margin-bottom: 12px;
        font-family: 'Outfit', sans-serif;
    }
    
    /* Input Textarea customization */
    .stTextArea textarea {
        background-color: #131a2a !important;
        color: #f1f5f9 !important;
        border: 1px solid #1e293b !important;
        font-family: 'Courier New', monospace !important;
        border-radius: 8px !important;
    }
    
    .stTextArea textarea:focus {
        border-color: #38bdf8 !important;
        box-shadow: 0 0 0 1px #38bdf8 !important;
    }
    
    /* Preview box styling */
    .preview-card {
        background-color: #0b0f19;
        border: 1px solid #1e293b;
        border-radius: 8px;
        padding: 14px;
        margin-bottom: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .preview-option {
        background-color: #070a12;
        border: 1px solid #111827;
        border-radius: 6px;
        padding: 6px 12px;
        font-family: monospace;
        font-size: 13px;
        margin-top: 4px;
        margin-left: 19px; /* Appends 5mm (19px) left indent simulation */
    }
</style>
""", unsafe_allow_html=True)

# Helper function to convert custom markup to HTML tags for rendering inside browser preview
def format_to_html(text: str) -> str:
    if not text:
        return ""
    # Parse [text](A) error tags
    text = re.sub(r'\[([^\]]+)\]\(([A-D])\)', r'<u>\1</u> <b style="color:#38bdf8;">(\2)</b>', text)
    # Parse bold+under tags
    text = re.sub(r'\*\*\[([^\]]+)\]\*\*', r'<b><u>\1</u></b>', text)
    text = re.sub(r'\[\*\*([^*]+)\*\*\]', r'<b><u>\1</u></b>', text)
    # Parse bold
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    # Parse italic
    text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
    # Parse underline
    text = re.sub(r'\[([^\]]+)\]', r'<u>\1</u>', text)
    return text

# ================= BACKGROUND PDF SERVER =================
# Set up directory to host temp preview PDF
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(ROOT_DIR, "pdf_server_dir")
os.makedirs(PDF_DIR, exist_ok=True)

# Initialize server variables in session state
if 'pdf_server_port' not in st.session_state:
    st.session_state.pdf_server_port = 8502

class SilentHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PDF_DIR, **kwargs)
        
    def log_message(self, format, *args):
        pass # Suppress logging console spam

def run_pdf_server():
    import socket
    # Find a free local port starting from 8502
    port = 8502
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    for p in range(8502, 8600):
        try:
            s.bind(('127.0.0.1', p))
            port = p
            s.close()
            break
        except Exception:
            pass
            
    st.session_state.pdf_server_port = port
    
    class SilentTCPServer(socketserver.TCPServer):
        allow_reuse_address = True
        
    try:
        with SilentTCPServer(('127.0.0.1', port), SilentHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except Exception as e:
        print(f"PDF Server Thread exception: {e}")

# Start the background server daemon thread (only once)
if 'pdf_server_started' not in st.session_state:
    server_thread = threading.Thread(target=run_pdf_server, daemon=True)
    server_thread.start()
    st.session_state.pdf_server_started = True

# ================= SIDEBAR CONFIGURATION MANAGER =================
st.sidebar.markdown("### 📂 Configuration Profile")

# Load current configs list
config_names = list(st.session_state.saved_configs.keys())
selected_config = st.sidebar.selectbox(
    "Active Profile:",
    options=config_names,
    key="config_select_box",
    on_change=on_config_select
)

col_act1, col_act2 = st.sidebar.columns([1, 1])

# Delete button
delete_disabled = (selected_config == "Default Settings")
if col_act1.button("🗑️ Delete", disabled=delete_disabled, use_container_width=True):
    if selected_config in st.session_state.saved_configs and selected_config != "Default Settings":
        st.session_state.saved_configs.pop(selected_config)
        save_configs(st.session_state.saved_configs)
        st.session_state.config_select_box = "Default Settings"
        on_config_select()
        st.toast(f"Profile '{selected_config}' deleted successfully.")
        st.rerun()

# Text input and Save button
new_config_name = st.sidebar.text_input("Save profile as:", placeholder="e.g., Exam Format A", key="new_config_name_input")
if st.sidebar.button("💾 Save Current Profile", use_container_width=True):
    name_to_save = new_config_name.strip()
    if name_to_save:
        if name_to_save == "Default Settings":
            st.sidebar.error("Cannot overwrite 'Default Settings'. Please use a different name.")
        else:
            # Capture all current settings from session state widgets
            new_profile = {}
            for key in DEFAULT_SETTINGS.keys():
                new_profile[key] = st.session_state[f"w_{key}"]
            
            # Save configuration
            st.session_state.saved_configs[name_to_save] = new_profile
            save_configs(st.session_state.saved_configs)
            st.session_state.config_select_box = name_to_save
            st.toast(f"Profile '{name_to_save}' saved successfully!")
            st.rerun()
    else:
        st.sidebar.error("Please enter a profile name first.")

st.sidebar.markdown("---")

# ================= SIDEBAR LAYOUT CUSTOMIZER =================
st.sidebar.markdown("### 📐 Global Margins (cm)")
margin_top = st.sidebar.number_input("Top Margin", min_value=0.5, max_value=5.0, step=0.1, key="w_margin_top")
margin_bottom = st.sidebar.number_input("Bottom Margin", min_value=0.5, max_value=5.0, step=0.1, key="w_margin_bottom")
margin_left = st.sidebar.number_input("Left Margin", min_value=0.5, max_value=5.0, step=0.1, key="w_margin_left")
margin_right = st.sidebar.number_input("Right Margin", min_value=0.5, max_value=5.0, step=0.1, key="w_margin_right")

st.sidebar.markdown("### 🔤 Global Typography")
font_options = ["Times New Roman", "Arial", "Calibri", "Georgia", "Segoe UI"]
font_name = st.sidebar.selectbox("Font Family", font_options, key="w_font_name")
font_size = st.sidebar.number_input("Font Size (pt)", min_value=8.0, max_value=20.0, step=0.5, key="w_font_size")
line_spacing = st.sidebar.number_input("Line Spacing", min_value=1.0, max_value=3.0, step=0.05, key="w_line_spacing")
space_after = st.sidebar.number_input("Paragraph Spacing After (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_space_after")

st.sidebar.markdown("### 📝 Spacing Formats")
st.sidebar.write("**Directions Headers:**")
header_space_before = st.sidebar.number_input("Space Before Directions (pt)", min_value=0.0, max_value=36.0, step=1.0, key="w_header_space_before")
header_space_after = st.sidebar.number_input("Space After Directions (pt)", min_value=0.0, max_value=36.0, step=1.0, key="w_header_space_after")

st.sidebar.write("**Question Prompts:**")
question_space_before = st.sidebar.number_input("Space Before Question (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_question_space_before")
question_space_after = st.sidebar.number_input("Space After Question (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_question_space_after")

st.sidebar.write("**Option Items:**")
options_left_indent = st.sidebar.number_input("Options Left Indent (cm)", min_value=0.0, max_value=4.0, step=0.05, key="w_options_left_indent")
options_space_before = st.sidebar.number_input("Space Before Options (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_options_space_before")
options_space_after = st.sidebar.number_input("Space After Options (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_options_space_after")

st.sidebar.write("**Passage Paragraphs:**")
passage_space_before = st.sidebar.number_input("Space Before Passage (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_passage_space_before")
passage_space_after = st.sidebar.number_input("Space After Passage (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_passage_space_after")
passage_indent_first = st.sidebar.number_input("Passage First Indent (cm)", min_value=0.0, max_value=3.0, step=0.05, key="w_passage_indent_first")

st.sidebar.write("**Sentence Reordering:**")
reorder_space_before = st.sidebar.number_input("Space Before Reorder (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_reorder_space_before")
reorder_space_after = st.sidebar.number_input("Space After Reorder (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_reorder_space_after")
reorder_left_indent = st.sidebar.number_input("Reorder Left Indent (cm)", min_value=0.0, max_value=4.0, step=0.05, key="w_reorder_left_indent")

st.sidebar.write("**Notice Cards:**")
notice_space_before = st.sidebar.number_input("Space Before Notice (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_notice_space_before")
notice_space_after = st.sidebar.number_input("Space After Notice (pt)", min_value=0.0, max_value=24.0, step=1.0, key="w_notice_space_after")
notice_left_indent = st.sidebar.number_input("Notice Left Indent (cm)", min_value=0.0, max_value=4.0, step=0.05, key="w_notice_left_indent")

# Bundle settings dictionary
settings = {
    "margin_top": margin_top,
    "margin_bottom": margin_bottom,
    "margin_left": margin_left,
    "margin_right": margin_right,
    "font_name": font_name,
    "font_size": font_size,
    "line_spacing": line_spacing,
    "space_after": space_after,
    "header_space_before": header_space_before,
    "header_space_after": header_space_after,
    "question_space_before": question_space_before,
    "question_space_after": question_space_after,
    "options_left_indent": options_left_indent,
    "options_space_before": options_space_before,
    "options_space_after": options_space_after,
    "passage_space_before": passage_space_before,
    "passage_space_after": passage_space_after,
    "passage_indent_first": passage_indent_first,
    "reorder_space_before": reorder_space_before,
    "reorder_space_after": reorder_space_after,
    "reorder_left_indent": reorder_left_indent,
    "notice_space_before": notice_space_before,
    "notice_space_after": notice_space_after,
    "notice_left_indent": notice_left_indent
}

# ================= MAIN UI =================
# Header box
st.markdown("""
<div class="header-box">
    <div class="header-title">ANTIGRAVITY DOCX COMPILER</div>
    <div class="header-subtitle">100% Offline Desktop Compiler — Paste your fixed JSON structure or load a file to generate pristine native A4 Word documents.</div>
</div>
""", unsafe_allow_html=True)

# App Core Columns
col_input, col_preview = st.columns([1, 1], gap="large")

# State variables
exercises_data = None
json_to_compile = ""

# 1. LEFT COLUMN: Input Interface
with col_input:
    st.markdown('<div class="section-title">📥 Upload or Paste JSON</div>', unsafe_allow_html=True)
    
    # Selection Tab
    input_tab = st.radio("Choose Input Method:", ["File Upload", "Paste JSON Text"], label_visibility="collapsed")
    
    if input_tab == "File Upload":
        uploaded_file = st.file_uploader("Upload JSON questions configuration file (like TEST.json):", type=["json"])
        if uploaded_file is not None:
            try:
                raw_bytes = uploaded_file.read()
                json_to_compile = raw_bytes.decode("utf-8")
                # Test parse to confirm validity
                parsed_val = json.loads(json_to_compile)
                exercises_data = parsed_val.get("exercises") or parsed_val.get("questions") or parsed_val.get("data") or parsed_val if isinstance(parsed_val, dict) else parsed_val
                st.success(f"Successfully loaded file: {uploaded_file.name}")
            except Exception as e:
                st.error(f"Failed to parse JSON file: {str(e)}")
    else:
        # Paste Text Area pre-loaded with mock payload
        pasted_text = st.text_area(
            "Paste JSON payload here:",
            value=json.dumps(MOCK_PAYLOAD, indent=2),
            height=380
        )
        if pasted_text.strip():
            json_to_compile = pasted_text
            try:
                parsed_val = json.loads(pasted_text)
                exercises_data = parsed_val.get("exercises") or parsed_val.get("questions") or parsed_val.get("data") or parsed_val if isinstance(parsed_val, dict) else parsed_val
            except Exception as e:
                st.warning("Validating JSON syntax... (typing)")

    # Compile Trigger Action Block
    st.markdown('<div style="margin-top:20px;"></div>', unsafe_allow_html=True)
    
    if exercises_data:
        try:
            # Pass custom settings dictionary to compiler
            compiler = WordDocumentCompiler(settings=settings)
            
            # Compile document to byte stream in-memory
            doc_stream = io.BytesIO()
            compiler.compile(exercises_data, doc_stream)
            doc_stream.seek(0)
            
            st.success("Word layout compiled in-memory successfully!")
            
            # Show download button directly
            st.download_button(
                label="📥 DOWNLOAD WORD DOCUMENT (.DOCX)",
                data=doc_stream,
                file_name="compiled_document.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                use_container_width=True
            )
            
        except Exception as e:
            st.error(f"Compilation layout failed: {str(e)}")
    else:
        st.info("Provide a valid JSON questions configuration to download your compiled Word document.")

# 2. RIGHT COLUMN: Live Interactive Document Layout Preview
with col_preview:
    st.markdown('<div class="section-title">👁️ Live Layout Preview</div>', unsafe_allow_html=True)
    
    # Toggle between Interactive HTML preview and Realistic PDF preview
    preview_mode = st.radio("Choose Preview Viewport:", ["Interactive HTML", "Realistic PDF (Word Required)"], horizontal=True)
    st.write("---")

    if exercises_data and isinstance(exercises_data, list):
        
        if preview_mode == "Interactive HTML":
            st.info(f"Loaded {len(exercises_data)} exercises. Simulating options grid spacing.")
            
            for item in exercises_data:
                q_type = item.get("t", "mq")
                
                # HTML template (no newlines/tabs inside HTML strings) to prevent Markdown parsing bug
                if q_type in ["cz", "rd"]:
                    passage_text = "<br><br>".join(item.get("b", []))
                    st.markdown(f'<div style="background-color:#0b1120; border-left:4px solid #818cf8; padding:16px; border-radius:6px; margin-bottom:14px; font-size:13px; line-height:1.6; border: 1px solid #1e293b; border-left: 4px solid #818cf8;">{format_to_html(passage_text)}</div>', unsafe_allow_html=True)
                    
                    for sub in item.get("k", []):
                        sub_q = sub.get("q")
                        sub_x = sub.get("x", "")
                        sub_o = sub.get("o", [])
                        
                        st.markdown(f'<div class="preview-card" style="margin-left: 20px;"><div style="font-size:13px; margin-bottom:6px;"><b>Question {sub_q}:</b> {format_to_html(sub_x)}</div>', unsafe_allow_html=True)
                        if sub_o:
                            max_len = max(len(str(opt)) for opt in sub_o) if sub_o else 0
                            col_span = 4 if max_len < 15 else (2 if max_len < 35 else 1)
                            
                            opt_html = f'<div style="display:grid; grid-template-columns: repeat({col_span}, 1fr); gap:8px;">'
                            for idx, opt in enumerate(sub_o):
                                prefix = chr(65 + idx)
                                opt_html += f'<div class="preview-option"><span style="color:#38bdf8; font-weight:bold;">{prefix}.</span> {format_to_html(opt)}</div>'
                            opt_html += '</div>'
                            st.markdown(opt_html, unsafe_allow_html=True)
                        st.markdown('</div>', unsafe_allow_html=True)
                
                elif q_type == "ro":
                    q_num = item.get("q")
                    q_text = item.get("x", "Choose the best arrangement of the sentences:")
                    sentences = item.get("i", [])
                    options = item.get("o", [])
                    
                    st.markdown(f'<div class="preview-card"><div style="font-size:13px; margin-bottom:8px;"><b>Question {q_num}:</b> {format_to_html(q_text)}</div>', unsafe_allow_html=True)
                    sent_html = '<div style="margin-bottom:10px; padding-left:12px; font-size:12.5px; line-height:1.5; color:#cbd5e1;">'
                    for sent in sentences:
                        sent_html += f"<div style='margin-bottom:3px;'>{format_to_html(sent)}</div>"
                    sent_html += '</div>'
                    st.markdown(sent_html, unsafe_allow_html=True)
                    
                    if options:
                        max_len = max(len(str(opt)) for opt in options) if options else 0
                        col_span = 4 if max_len < 15 else (2 if max_len < 35 else 1)
                        opt_html = f'<div style="display:grid; grid-template-columns: repeat({col_span}, 1fr); gap:8px;">'
                        for idx, opt in enumerate(options):
                            prefix = chr(65 + idx)
                            opt_html += f'<div class="preview-option"><span style="color:#38bdf8; font-weight:bold;">{prefix}.</span> {format_to_html(opt)}</div>'
                        opt_html += '</div>'
                        st.markdown(opt_html, unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                elif q_type == "nt":
                    q_num = item.get("q")
                    q_text = item.get("x", "")
                    notice_b = item.get("b", "")
                    options = item.get("o", [])
                    
                    st.markdown(f'<div class="preview-card"><div style="font-size:13px; margin-bottom:8px;"><b>Question {q_num}:</b> {format_to_html(q_text)}</div><div style="background-color:#1e293b50; border:1px solid #334155; padding:12px; border-radius:6px; margin-bottom:10px; font-style:italic; font-size:12.5px; line-height:1.5; color:#cbd5e1;">{format_to_html(notice_b)}</div>', unsafe_allow_html=True)
                    if options:
                        max_len = max(len(str(opt)) for opt in options) if options else 0
                        col_span = 4 if max_len < 15 else (2 if max_len < 35 else 1)
                        opt_html = f'<div style="display:grid; grid-template-columns: repeat({col_span}, 1fr); gap:8px;">'
                        for idx, opt in enumerate(options):
                            prefix = chr(65 + idx)
                            opt_html += f'<div class="preview-option"><span style="color:#38bdf8; font-weight:bold;">{prefix}.</span> {format_to_html(opt)}</div>'
                        opt_html += '</div>'
                        st.markdown(opt_html, unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                else:
                    q_num = item.get("q", 0)
                    q_text = item.get("x", "")
                    options = item.get("o", [])
                    
                    st.markdown(f'<div class="preview-card"><div style="font-size:13px; margin-bottom:10px;"><b>Question {q_num}:</b> {format_to_html(q_text)}</div>', unsafe_allow_html=True)
                    if options:
                        max_len = max(len(str(opt)) for opt in options) if options else 0
                        col_span = 4 if q_type in ["pr", "st"] or max_len < 15 else (2 if max_len < 35 else 1)
                        opt_html = f'<div style="display:grid; grid-template-columns: repeat({col_span}, 1fr); gap:8px;">'
                        for idx, opt in enumerate(options):
                            prefix = chr(65 + idx)
                            opt_html += f'<div class="preview-option"><span style="color:#38bdf8; font-weight:bold;">{prefix}.</span> {format_to_html(opt)}</div>'
                        opt_html += '</div>'
                        st.markdown(opt_html, unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)
                    
        else: # PDF Preview mode
            st.info("Render your test layout as a realistic PDF page. Includes full zoom, navigation, print, and search controls.")
            
            # Interactive compile trigger for PDF conversion to prevent UI locking during slider drags
            render_pdf = st.button("🔄 GENERATE PDF PREVIEW", use_container_width=True)
            
            # Initialize session states
            if 'pdf_preview_available' not in st.session_state:
                st.session_state.pdf_preview_available = False
                st.session_state.pdf_preview_error = None

            # Path to save PDF file statically served
            preview_pdf_filename = "preview.pdf"
            preview_pdf_path = os.path.join(PDF_DIR, preview_pdf_filename)

            if render_pdf:
                with st.spinner("Generating document and invoking Word PDF converter..."):
                    temp_docx_path = os.path.join(PDF_DIR, "temp_render.docx")
                    
                    try:
                        # 1. Compile docx using custom configurations
                        compiler = WordDocumentCompiler(settings=settings)
                        compiler.compile(exercises_data, temp_docx_path)
                        
                        # 2. Convert to PDF using docx2pdf
                        from docx2pdf import convert
                        # Convert docx to pdf
                        convert(temp_docx_path, preview_pdf_path)
                        
                        st.session_state.pdf_preview_available = True
                        st.session_state.pdf_preview_error = None
                        st.success("PDF preview rendered successfully!")
                    except Exception as e:
                        st.session_state.pdf_preview_available = False
                        st.session_state.pdf_preview_error = str(e)
                    finally:
                        # Clean up docx file
                        try:
                            if os.path.exists(temp_docx_path): os.remove(temp_docx_path)
                        except Exception:
                            pass
            
            # Show action controls and iframe if preview exists
            if st.session_state.pdf_preview_available and os.path.exists(preview_pdf_path):
                st.markdown('<div style="margin-top: 10px;"></div>', unsafe_allow_html=True)
                col_c1, col_c2, col_c3 = st.columns([1, 1, 1])
                
                open_desktop = col_c1.button("🔍 OPEN IN DESKTOP APP", use_container_width=True)
                if open_desktop:
                    try:
                        os.startfile(preview_pdf_path)
                    except Exception as ex:
                        st.error(f"Could not launch system reader: {ex}")
                
                server_url = f"http://127.0.0.1:{st.session_state.pdf_server_port}/{preview_pdf_filename}"
                col_c2.link_button("🌐 OPEN IN NEW TAB", server_url, use_container_width=True)
                
                zoom_option = col_c3.selectbox(
                    "Zoom level",
                    options=["Fit to Width", "Fit to Page", "50%", "75%", "100%", "125%", "150%", "200%", "300%"],
                    index=4,
                    label_visibility="collapsed"
                )
                
                # Map option to pdf fragment parameter
                if zoom_option == "Fit to Width":
                    zoom_param = "view=FitH"
                elif zoom_option == "Fit to Page":
                    zoom_param = "view=Fit"
                else:
                    zoom_val = zoom_option.replace("%", "")
                    zoom_param = f"zoom={zoom_val}"
                
                st.caption("💡 *Tip: Use the dropdown to zoom, or open in a new tab for native full-screen zoom controls.*")
                
                # Embed PDF from our local background server (enables full zoom, print, search, and toolbar controls)
                iframe_url = f"{server_url}#toolbar=1&{zoom_param}"
                pdf_iframe = f'<iframe src="{iframe_url}" width="100%" height="850px" style="border: 1px solid #1e293b; border-radius: 8px;"></iframe>'
                st.markdown(pdf_iframe, unsafe_allow_html=True)
                
            elif st.session_state.pdf_preview_error:
                st.error(f"Failed to generate PDF preview: {st.session_state.pdf_preview_error}")
                st.warning("Please verify that Microsoft Word is installed on your Windows PC and active. Reverting preview window tab to HTML viewport.")
            else:
                st.warning("Click the 'Generate PDF Preview' button above to compile and view your realistic layout page.")
            
    else:
        st.markdown("""
        <div style="border: 2px dashed #1e293b; border-radius: 12px; height: 350px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code"><path d="M10 12.5v5"/><path d="m14 12.5 1 2.5-1 2.5"/><path d="m14 15-1-1"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 1-1"/></svg>
            <div style="font-size: 13px; margin-top: 12px;">No active JSON questions structure loaded</div>
        </div>
        """, unsafe_allow_html=True)
