import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any, Optional, Set

from services.seating_engine import (
    Student, RelationshipData, generate_swap_pairs, genetic_seat_mix
)
from database.db_manager import (
    get_class_students, get_class_seating, save_class_seating,
    get_friend_groups, create_friend_group, delete_friend_group,
    add_member_to_group, remove_member_from_group,
    get_conflict_pairs, add_conflict_pair, remove_conflict_pair,
    get_trusted_swap_pairs, add_trusted_swap_pair, remove_trusted_swap_pair,
    get_conflict_groups, create_conflict_group, delete_conflict_group,
    add_member_to_conflict_group, remove_member_from_conflict_group,
    get_trusted_swap_students, add_trusted_swap_student, remove_trusted_swap_student,
    get_class_attendance_grades
)

router = APIRouter()

class SeatingPayload(BaseModel):
    num_rows: int = 4
    layout_json: str

    @field_validator('layout_json')
    def validate_layout_json(cls, v):
        try:
            parsed = json.loads(v)
            if not isinstance(parsed, (list, dict)):
                raise ValueError("Layout JSON must be a list or dict object")
        except Exception as e:
            raise ValueError(f"Invalid layout_json format: {e}")
        return v

class FriendGroupPayload(BaseModel):
    group_name: str
    color_hex: Optional[str] = "#6366F1"

class FriendGroupMemberPayload(BaseModel):
    student_id: int

class ConflictGroupPayload(BaseModel):
    group_name: str

class ConflictGroupMemberPayload(BaseModel):
    student_id: int

class PairRelationshipPayload(BaseModel):
    student_id1: int
    student_id2: int

def load_class_relationship_data(class_id: int) -> RelationshipData:
    fg_list = get_friend_groups(class_id)
    cg_list = get_conflict_groups(class_id)
    ts_list = get_trusted_swap_students(class_id)
    
    fg_dict = {g["id"]: set(m["student_id"] for m in g.get("members", [])) for g in fg_list}
    cg_dict = {g["id"]: set(m["student_id"] for m in g.get("members", [])) for g in cg_list}
    ts_set = set(t["student_id"] for t in ts_list)
    
    conflicts = get_conflict_pairs(class_id)
    trusted = get_trusted_swap_pairs(class_id)
    c_set = set(frozenset((c["student_id1"], c["student_id2"])) for c in conflicts)
    t_set = set(frozenset((t["student_id1"], t["student_id2"])) for t in trusted)
    
    return RelationshipData(
        friend_groups=fg_dict,
        conflict_groups=cg_dict,
        trusted_swap_students=ts_set,
        conflict_pairs=c_set,
        trusted_swap_pairs=t_set
    )

def load_class_student_objects(class_id: int, absent_ids: Set[int]) -> List[Student]:
    db_students = get_class_students(class_id)
    student_objs = []
    for s in db_students:
        sid = s["id"]
        is_abs = sid in absent_ids
        gid = s.get("group_id")
        gname = s.get("group_name")
        gcolor = s.get("group_color") or s.get("seat_color")
        student_objs.append(Student(
            id=sid,
            name=s["full_name"],
            gender=s.get("gender", "Nam"),
            group_id=gid,
            group_name=gname,
            group_color=gcolor,
            social_group=gname,
            is_absent=is_abs
        ))
    return student_objs

@router.get("/api/classes/{class_id}/seating")
def api_get_seating(class_id: int):
    return get_class_seating(class_id)

@router.put("/api/classes/{class_id}/seating")
def api_save_seating(class_id: int, payload: SeatingPayload):
    save_class_seating(class_id, payload.num_rows, payload.layout_json)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/friend-groups")
def api_get_friend_groups(class_id: int):
    return get_friend_groups(class_id)

@router.post("/api/classes/{class_id}/friend-groups")
def api_create_friend_group(class_id: int, payload: FriendGroupPayload):
    gid = create_friend_group(class_id, payload.group_name, payload.color_hex or "#6366F1")
    return {"id": gid, "status": "success"}

@router.delete("/api/classes/{class_id}/friend-groups/{group_id}")
def api_delete_friend_group(group_id: int):
    delete_friend_group(group_id)
    return {"status": "success"}

@router.post("/api/classes/{class_id}/friend-groups/{group_id}/members")
def api_add_friend_group_member(class_id: int, group_id: int, payload: FriendGroupMemberPayload):
    add_member_to_group(group_id, payload.student_id, class_id)
    return {"status": "success"}

@router.delete("/api/classes/{class_id}/friend-groups/{group_id}/members/{student_id}")
def api_remove_friend_group_member(class_id: int, group_id: int, student_id: int):
    remove_member_from_group(class_id, student_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/conflict-groups")
def api_get_conflict_groups(class_id: int):
    return get_conflict_groups(class_id)

@router.post("/api/classes/{class_id}/conflict-groups")
def api_create_conflict_group(class_id: int, payload: ConflictGroupPayload):
    gid = create_conflict_group(class_id, payload.group_name)
    return {"id": gid, "status": "success"}

@router.delete("/api/classes/{class_id}/conflict-groups/{group_id}")
def api_delete_conflict_group(group_id: int):
    delete_conflict_group(group_id)
    return {"status": "success"}

@router.post("/api/classes/{class_id}/conflict-groups/{group_id}/members")
def api_add_conflict_group_member(class_id: int, group_id: int, payload: ConflictGroupMemberPayload):
    add_member_to_conflict_group(group_id, payload.student_id, class_id)
    return {"status": "success"}

@router.delete("/api/classes/{class_id}/conflict-groups/{group_id}/members/{student_id}")
def api_remove_conflict_group_member(class_id: int, group_id: int, student_id: int):
    remove_member_from_conflict_group(class_id, student_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/conflicts")
def api_get_conflicts(class_id: int):
    return get_conflict_pairs(class_id)

@router.post("/api/classes/{class_id}/conflicts")
def api_add_conflict(class_id: int, payload: PairRelationshipPayload):
    cid = add_conflict_pair(class_id, payload.student_id1, payload.student_id2)
    return {"id": cid, "status": "success"}

@router.delete("/api/classes/{class_id}/conflicts/{conflict_id}")
def api_delete_conflict(conflict_id: int):
    remove_conflict_pair(conflict_id)
    return {"status": "success"}

@router.get("/api/classes/{class_id}/trusted-swaps")
def api_get_trusted_swaps(class_id: int):
    return get_trusted_swap_students(class_id)

@router.post("/api/classes/{class_id}/trusted-swaps")
def api_add_trusted_swap(class_id: int, payload: Dict[str, Any]):
    if "student_id" in payload:
        tid = add_trusted_swap_student(class_id, int(payload["student_id"]))
        return {"id": tid, "status": "success"}
    elif "student_id1" in payload and "student_id2" in payload:
        tid = add_trusted_swap_pair(class_id, int(payload["student_id1"]), int(payload["student_id2"]))
        return {"id": tid, "status": "success"}
    raise HTTPException(status_code=400, detail="Thiếu student_id")

@router.delete("/api/classes/{class_id}/trusted-swaps/{student_id}")
def api_delete_trusted_swap(class_id: int, student_id: int):
    remove_trusted_swap_student(class_id, student_id)
    remove_trusted_swap_pair(student_id)
    return {"status": "success"}

@router.post("/api/classes/{class_id}/seating/mix")
@router.post("/api/classes/{class_id}/seating/genetic-mix")
def api_genetic_mix(class_id: int, payload: Dict[str, Any]):
    cols_config = payload.get("cols_config")
    num_cols = payload.get("num_cols", 3)
    desks_per_col = payload.get("desks_per_col", 3)
    rows = payload.get("rows", desks_per_col)
    cols = payload.get("cols", num_cols * 2)
    pop_size = payload.get("population_size", 80)
    max_gen = payload.get("max_generations", 300)
    mut_rate = payload.get("mutation_rate", 0.15)
    seed = payload.get("seed")
    absent_ids = set(payload.get("absent_student_ids", []))
    date_str = payload.get("date")

    if date_str:
        att = get_class_attendance_grades(class_id, date_str)
        for r in att:
            if r.get("status") == "Vắng mặt":
                absent_ids.add(r.get("student_id"))

    students = load_class_student_objects(class_id, absent_ids)
    rel = load_class_relationship_data(class_id)
    return genetic_seat_mix(
        students=students,
        rows=rows,
        cols=cols,
        relationships=rel,
        cols_config=cols_config,
        population_size=pop_size,
        max_generations=max_gen,
        mutation_rate=mut_rate,
        seed=seed
    )

@router.post("/api/classes/{class_id}/seating/grading-pairs")
@router.post("/api/classes/{class_id}/seating/blossom-swap")
def api_blossom_swap(class_id: int, payload: Optional[Dict[str, Any]] = None):
    payload = payload or {}
    seed = payload.get("seed")
    absent_ids = set(payload.get("absent_student_ids", []))
    date_str = payload.get("date")

    if date_str:
        att = get_class_attendance_grades(class_id, date_str)
        for r in att:
            if r.get("status") == "Vắng mặt":
                absent_ids.add(r.get("student_id"))

    students = load_class_student_objects(class_id, absent_ids)
    rel = load_class_relationship_data(class_id)
    return generate_swap_pairs(students, rel, seed=seed)
