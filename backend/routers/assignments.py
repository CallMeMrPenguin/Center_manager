from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from database.crud_assignments import (
    get_assignments,
    create_assignment,
    update_assignment,
    delete_assignment,
    get_assignment_submissions,
    batch_update_submissions
)

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

class AssignmentCreate(BaseModel):
    class_id: int
    title: str
    description: Optional[str] = ""
    assigned_date: Optional[str] = None
    due_date: Optional[str] = None
    max_score: Optional[float] = 10.0
    content_json: Optional[str] = ""
    quiz_config: Optional[str] = ""

class AssignmentUpdate(BaseModel):
    title: str
    description: Optional[str] = ""
    assigned_date: str
    due_date: str
    max_score: Optional[float] = 10.0
    content_json: Optional[str] = ""
    quiz_config: Optional[str] = ""


class SubmissionBatchUpdate(BaseModel):
    submissions: List[Dict[str, Any]]

@router.get("")
def list_assignments(class_id: Optional[int] = None, month: Optional[str] = ""):
    try:
        data = get_assignments(class_id=class_id, month=month or "")
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
def add_assignment(payload: AssignmentCreate):
    try:
        assignment_id = create_assignment(payload.model_dump())
        return {"success": True, "id": assignment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{assignment_id}")
def edit_assignment(assignment_id: int, payload: AssignmentUpdate):
    try:
        update_assignment(assignment_id, payload.model_dump())
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{assignment_id}")
def remove_assignment(assignment_id: int):
    try:
        delete_assignment(assignment_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{assignment_id}/submissions")
def list_submissions(assignment_id: int):
    try:
        submissions = get_assignment_submissions(assignment_id)
        return submissions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{assignment_id}/submissions")
def save_submissions(assignment_id: int, payload: SubmissionBatchUpdate):
    try:
        batch_update_submissions(assignment_id, payload.submissions)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
