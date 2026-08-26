import os
from typing import List, Dict, Any, Optional
from database.connection import get_connection

# ----------------------------------------------------
# DOCUMENT MANAGER OPERATIONS
# ----------------------------------------------------
def insert_folder(name: str, parent_id: Any = None) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO document_folders (name, parent_id) VALUES (?, ?)", (name, parent_id))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_folders(is_deleted: int = 0) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM document_folders WHERE is_deleted = ? ORDER BY name ASC", (is_deleted,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def delete_folder(folder_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Mark folder and all recursive subfolders as deleted
        cursor.execute("""
            WITH RECURSIVE sub_folders(id) AS (
                SELECT id FROM document_folders WHERE id = ?
                UNION ALL
                SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
            )
            UPDATE document_folders SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
            WHERE id IN (SELECT id FROM sub_folders)
        """, (folder_id,))
        # Soft delete all documents in folder and subfolders
        cursor.execute("""
            WITH RECURSIVE sub_folders(id) AS (
                SELECT id FROM document_folders WHERE id = ?
                UNION ALL
                SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
            )
            UPDATE documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP
            WHERE folder_id IN (SELECT id FROM sub_folders)
        """, (folder_id,))
        conn.commit()
    finally:
        conn.close()

def insert_document(name: str, filename: str, filepath: str, folder_id: Any, file_type: str, file_size: int, tags: str = "") -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        fid = int(folder_id) if (folder_id is not None and str(folder_id).strip() != '' and str(folder_id) != 'null') else None
        cursor.execute("""
            INSERT INTO documents (name, filename, filepath, folder_id, file_type, file_size, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, filename, filepath, fid, file_type, file_size, tags))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_documents(folder_id: Any = '__ALL__', tag: str = None, search: str = None, is_deleted: int = 0) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM documents WHERE is_deleted = ?"
        params = [is_deleted]
        
        if folder_id != '__ALL__':
            if folder_id is None or str(folder_id).strip() == '' or str(folder_id) == 'null':
                query += " AND folder_id IS NULL"
            else:
                query += " AND folder_id = ?"
                params.append(int(folder_id))
                
        if tag:
            query += " AND (',' || tags || ',') LIKE ?"
            params.append(f"%,{tag.strip()},%")
            
        if search:
            query += " AND (name LIKE ? OR filename LIKE ? OR tags LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])
            
        query += " ORDER BY id DESC"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_document(doc_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def delete_document(doc_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()

def restore_document(doc_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET is_deleted = 0, deleted_at = NULL WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()

def restore_folder(folder_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            WITH RECURSIVE sub_folders(id) AS (
                SELECT id FROM document_folders WHERE id = ?
                UNION ALL
                SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
            )
            UPDATE document_folders SET is_deleted = 0, deleted_at = NULL
            WHERE id IN (SELECT id FROM sub_folders)
        """, (folder_id,))
        cursor.execute("""
            WITH RECURSIVE sub_folders(id) AS (
                SELECT id FROM document_folders WHERE id = ?
                UNION ALL
                SELECT f.id FROM document_folders f JOIN sub_folders sf ON f.parent_id = sf.id
            )
            UPDATE documents SET is_deleted = 0, deleted_at = NULL
            WHERE folder_id IN (SELECT id FROM sub_folders)
        """, (folder_id,))
        conn.commit()
    finally:
        conn.close()

def permanently_delete_document(doc_id: int):
    from config.settings import get_setting
    files_dir = get_setting("files_dir")
    conn = get_connection()
    try:
        cursor = conn.cursor()
        # Get document path
        cursor.execute("SELECT filepath FROM documents WHERE id = ?", (doc_id,))
        row = cursor.fetchone()
        filepath = row[0] if row else None
        
        # Delete attachments
        cursor.execute("SELECT id, filepath FROM document_attachments WHERE document_id = ?", (doc_id,))
        atts = cursor.fetchall()
        for aid, att_filepath in atts:
            att_path = os.path.join(files_dir, att_filepath)
            if os.path.exists(att_path) and os.path.isfile(att_path):
                try: 
                    os.remove(att_path)
                except Exception: 
                    pass
            cursor.execute("DELETE FROM document_attachments WHERE id = ?", (aid,))
            
        # Delete document file
        if filepath:
            doc_path = os.path.join(files_dir, filepath)
            if os.path.exists(doc_path) and os.path.isfile(doc_path):
                try: 
                    os.remove(doc_path)
                except Exception: 
                    pass
                
        cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        conn.commit()
    finally:
        conn.close()

def permanently_delete_folder_recursive(folder_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM documents WHERE folder_id = ?", (folder_id,))
        doc_ids = [r[0] for r in cursor.fetchall()]
    finally:
        conn.close()
    
    for doc_id in doc_ids:
        permanently_delete_document(doc_id)
        
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM document_folders WHERE parent_id = ?", (folder_id,))
        child_ids = [r[0] for r in cursor.fetchall()]
    finally:
        conn.close()
    
    for cid in child_ids:
        permanently_delete_folder_recursive(cid)
        
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM document_folders WHERE id = ?", (folder_id,))
        conn.commit()
    finally:
        conn.close()

def purge_old_trash():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM documents WHERE is_deleted = 1 AND deleted_at < datetime('now', '-30 days')")
        old_doc_ids = [r[0] for r in cursor.fetchall()]
        cursor.execute("SELECT id FROM document_folders WHERE is_deleted = 1 AND deleted_at < datetime('now', '-30 days')")
        old_folder_ids = [r[0] for r in cursor.fetchall()]
    finally:
        conn.close()
    
    for doc_id in old_doc_ids:
        try:
            permanently_delete_document(doc_id)
        except Exception as e:
            print(f"Error purging document {doc_id}: {e}")
            
    for f_id in old_folder_ids:
        try:
            permanently_delete_folder_recursive(f_id)
        except Exception as e:
            print(f"Error purging folder {f_id}: {e}")

def update_document_tags(doc_id: int, tags: str):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE documents SET tags = ? WHERE id = ?", (tags, doc_id))
        conn.commit()
    finally:
        conn.close()

def update_document_folder(doc_id: int, folder_id: Any):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        fid = int(folder_id) if (folder_id is not None and str(folder_id).strip() != '' and str(folder_id) != 'null') else None
        cursor.execute("UPDATE documents SET folder_id = ? WHERE id = ?", (fid, doc_id))
        conn.commit()
    finally:
        conn.close()

def insert_attachment(document_id: int, filename: str, filepath: str, file_type: str, file_size: int) -> int:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO document_attachments (document_id, filename, filepath, file_type, file_size)
            VALUES (?, ?, ?, ?, ?)
        """, (document_id, filename, filepath, file_type, file_size))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_attachments(document_id: int) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM document_attachments WHERE document_id = ? ORDER BY id DESC", (document_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_attachment(attachment_id: int) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM document_attachments WHERE id = ?", (attachment_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def delete_attachment(attachment_id: int):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM document_attachments WHERE id = ?", (attachment_id,))
        conn.commit()
    finally:
        conn.close()

def update_folder_parent(folder_id: int, parent_id: Any):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        pid = int(parent_id) if (parent_id is not None and str(parent_id).strip() != '' and str(parent_id) != 'null') else None
        cursor.execute("UPDATE document_folders SET parent_id = ? WHERE id = ?", (pid, folder_id))
        conn.commit()
    finally:
        conn.close()
