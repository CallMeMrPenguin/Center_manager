# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['C:\\Users\\ACER\\Desktop\\Center_Manager_App\\main.py'],
    pathex=[],
    binaries=[],
    datas=[('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\backend', 'backend'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\frontend\\dist', 'frontend/dist'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\unit_config.json', '.'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\exercise_config.json', '.'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\config.json', '.'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\prompts.json', '.'), ('C:\\Users\\ACER\\Desktop\\Center_Manager_App\\test_formatter.db', '.')],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='CenterManager',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='CenterManager',
)
