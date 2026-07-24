import os
import time
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from config.settings import get_setting
from database.db_manager import (
    get_documents, get_document, get_folders, insert_folder, delete_folder,
    insert_document, delete_document, restore_document, restore_folder,
    permanently_delete_document, permanently_delete_folder_recursive,
    update_document_tags, update_document_folder, update_folder_parent,
    insert_attachment, get_attachments, delete_attachment, get_attachment
)

router = APIRouter()

class CreateFolderRequest(BaseModel):
    name: str
    parent_id: Optional[int] = None

class MoveDocumentRequest(BaseModel):
    folder_id: Optional[Any] = None

class MoveFolderRequest(BaseModel):
    parent_id: Optional[Any] = None

class UpdateTagsRequest(BaseModel):
    tags: str

@router.get("/api/documents")
def api_get_documents(folder_id: Optional[str] = '__ALL__', tag: Optional[str] = None, search: Optional[str] = None):
    docs = get_documents(folder_id=folder_id if folder_id != '' else '__ALL__', tag=tag, search=search, is_deleted=0)
    return {"success": True, "documents": docs}

@router.get("/api/documents/folders")
def api_get_document_folders():
    folders = get_folders(is_deleted=0)
    return {"success": True, "folders": folders}

@router.post("/api/documents/folders")
def api_create_document_folder(req: CreateFolderRequest):
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")
    fid = insert_folder(name, req.parent_id)
    return {"success": True, "id": fid, "name": name, "parent_id": req.parent_id}

@router.delete("/api/documents/folders/{folder_id}")
def api_delete_document_folder(folder_id: int):
    delete_folder(folder_id)
    return {"success": True}

@router.post("/api/documents/upload")
async def api_upload_document(file: UploadFile = File(...), folder_id: Optional[str] = Form(None), tags: Optional[str] = Form("")):
    files_dir = get_setting("files_dir")
    docs_storage_dir = os.path.join(files_dir, "document_manager_files")
    os.makedirs(docs_storage_dir, exist_ok=True)

    original_name = file.filename
    ext = os.path.splitext(original_name)[1]
    saved_filename = f"doc_{int(time.time())}_{original_name}"
    saved_filepath = os.path.join(docs_storage_dir, saved_filename)

    contents = await file.read()
    with open(saved_filepath, "wb") as f:
        f.write(contents)

    file_size = len(contents)
    file_type = ext.lower().replace(".", "")

    rel_filepath = os.path.join("document_manager_files", saved_filename)
    did = insert_document(original_name, saved_filename, rel_filepath, folder_id, file_type, file_size, tags or "")
    return {"success": True, "id": did, "name": original_name, "filepath": rel_filepath}

@router.delete("/api/documents/{doc_id}")
def api_delete_document(doc_id: int):
    delete_document(doc_id)
    return {"success": True}

@router.post("/api/documents/{doc_id}/tags")
def api_update_document_tags(doc_id: int, req: UpdateTagsRequest):
    update_document_tags(doc_id, req.tags)
    return {"success": True}

@router.post("/api/documents/{doc_id}/move")
def api_move_document(doc_id: int, req: MoveDocumentRequest):
    update_document_folder(doc_id, req.folder_id)
    return {"success": True}

@router.post("/api/documents/folders/{folder_id}/move")
def api_move_folder(folder_id: int, req: MoveFolderRequest):
    update_folder_parent(folder_id, req.parent_id)
    return {"success": True}

@router.post("/api/documents/{doc_id}/attachments/upload")
async def api_upload_attachment(doc_id: int, file: UploadFile = File(...)):
    files_dir = get_setting("files_dir")
    docs_storage_dir = os.path.join(files_dir, "document_manager_files")
    os.makedirs(docs_storage_dir, exist_ok=True)

    original_name = file.filename
    ext = os.path.splitext(original_name)[1]
    saved_filename = f"att_{doc_id}_{int(time.time())}_{original_name}"
    saved_filepath = os.path.join(docs_storage_dir, saved_filename)

    contents = await file.read()
    with open(saved_filepath, "wb") as f:
        f.write(contents)

    file_size = len(contents)
    file_type = ext.lower().replace(".", "")

    rel_filepath = os.path.join("document_manager_files", saved_filename)
    aid = insert_attachment(doc_id, original_name, rel_filepath, file_type, file_size)
    return {"success": True, "id": aid, "filename": original_name}

@router.delete("/api/documents/attachments/{att_id}")
def api_delete_attachment(att_id: int):
    delete_attachment(att_id)
    return {"success": True}

@router.get("/api/documents/download/{doc_id}")
def api_download_document(doc_id: int):
    files_dir = get_setting("files_dir")
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    filepath = os.path.join(files_dir, doc["filepath"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File on disk not found")
    return FileResponse(filepath, filename=doc["name"])

@router.get("/api/documents/attachments/download/{att_id}")
def api_download_attachment(att_id: int):
    files_dir = get_setting("files_dir")
    att = get_attachment(att_id)
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    filepath = os.path.join(files_dir, att["filepath"])
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File on disk not found")
    return FileResponse(filepath, filename=att["filename"])

@router.get("/api/documents/trash")
def api_get_trash():
    docs = get_documents(folder_id='__ALL__', is_deleted=1)
    folders = get_folders(is_deleted=1)
    return {"success": True, "documents": docs, "folders": folders}

@router.post("/api/documents/{doc_id}/restore")
def api_restore_document(doc_id: int):
    restore_document(doc_id)
    return {"success": True}

@router.post("/api/documents/folders/{folder_id}/restore")
def api_restore_folder(folder_id: int):
    restore_folder(folder_id)
    return {"success": True}

@router.delete("/api/documents/{doc_id}/permanent")
def api_permanently_delete_document(doc_id: int):
    permanently_delete_document(doc_id)
    return {"success": True}

@router.delete("/api/documents/folders/{folder_id}/permanent")
def api_permanently_delete_folder(folder_id: int):
    permanently_delete_folder_recursive(folder_id)
    return {"success": True}
