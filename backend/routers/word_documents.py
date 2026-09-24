import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from database.db_manager import (
    insert_word_document,
    get_word_documents,
    get_word_document,
    update_word_document,
    delete_word_document,
    duplicate_word_document,
    get_students,
    get_classes,
    get_teachers_cm,
)

router = APIRouter(prefix="/api/word-documents", tags=["Word Documents"])

class CreateWordDocumentRequest(BaseModel):
    title: str
    content_html: Optional[str] = ""
    content_json: Optional[str] = ""
    category: Optional[str] = "Chung"
    description: Optional[str] = ""
    tags: Optional[str] = ""
    paper_size: Optional[str] = "A4"
    orientation: Optional[str] = "portrait"
    margins: Optional[str] = '{"top":20,"bottom":20,"left":25,"right":20}'
    is_template: Optional[int] = 0

class UpdateWordDocumentRequest(BaseModel):
    title: Optional[str] = None
    content_html: Optional[str] = None
    content_json: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None
    paper_size: Optional[str] = None
    orientation: Optional[str] = None
    margins: Optional[str] = None
    is_template: Optional[int] = None

@router.get("")
def api_get_word_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_template: Optional[int] = None
):
    docs = get_word_documents(category=category, search=search, is_template=is_template)
    return {"success": True, "documents": docs}

@router.get("/templates")
def api_get_templates():
    tpls = get_word_documents(is_template=1)
    return {"success": True, "templates": tpls}

@router.get("/merge-data")
def api_get_merge_data():
    """Returns students, classes, and teachers for easy dynamic placeholder insertion."""
    students = get_students()
    classes = get_classes()
    teachers = get_teachers_cm()
    return {
        "success": True,
        "students": [{"id": s["id"], "name": s["full_name"], "grade": s.get("grade", ""), "nickname": s.get("nickname", "")} for s in students],
        "classes": [{"id": c["id"], "name": c["class_name"], "grade": c.get("grade", "")} for c in classes],
        "teachers": [{"id": t["id"], "name": t["full_name"], "role": t.get("role", "")} for t in teachers]
    }

@router.get("/{doc_id}")
def api_get_word_document(doc_id: int):
    doc = get_word_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Văn bản không tồn tại")
    return {"success": True, "document": doc}

@router.post("")
def api_create_word_document(req: CreateWordDocumentRequest):
    title = req.title.strip()
    if not title:
        title = "Văn bản mới"
    doc_id = insert_word_document(
        title=title,
        content_html=req.content_html or "",
        content_json=req.content_json or "",
        category=req.category or "Chung",
        description=req.description or "",
        tags=req.tags or "",
        paper_size=req.paper_size or "A4",
        orientation=req.orientation or "portrait",
        margins=req.margins or '{"top":20,"bottom":20,"left":25,"right":20}',
        is_template=req.is_template or 0
    )
    return {"success": True, "id": doc_id, "title": title}

@router.put("/{doc_id}")
def api_update_word_document(doc_id: int, req: UpdateWordDocumentRequest):
    updated = update_word_document(
        doc_id=doc_id,
        title=req.title,
        content_html=req.content_html,
        content_json=req.content_json,
        category=req.category,
        description=req.description,
        tags=req.tags,
        paper_size=req.paper_size,
        orientation=req.orientation,
        margins=req.margins,
        is_template=req.is_template
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Không thể cập nhật văn bản")
    return {"success": True, "id": doc_id}

@router.delete("/{doc_id}")
def api_delete_word_document(doc_id: int, permanent: bool = False):
    deleted = delete_word_document(doc_id, permanent=permanent)
    if not deleted:
        raise HTTPException(status_code=404, detail="Không tìm thấy văn bản để xóa")
    return {"success": True, "id": doc_id}

@router.post("/{doc_id}/duplicate")
def api_duplicate_word_document(doc_id: int):
    new_id = duplicate_word_document(doc_id)
    if not new_id:
        raise HTTPException(status_code=404, detail="Không thể sao chép văn bản")
    return {"success": True, "id": new_id}
