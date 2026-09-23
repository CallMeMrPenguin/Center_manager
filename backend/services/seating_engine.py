import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
try:
    import networkx as nx
except ImportError:
    nx = None

@dataclass
class Student:
    id: int
    name: str
    gender: str = "Nam"             # 'Nam' | 'Nữ' | 'Khác'
    group_id: Optional[int] = None   # FriendGroup ID
    group_name: Optional[str] = None
    group_color: Optional[str] = None
    social_group: Optional[str] = None # Legacy alias
    is_absent: bool = False

    def __post_init__(self):
        if self.social_group and not self.group_name:
            self.group_name = self.social_group

@dataclass
class RelationshipData:
    friend_groups: Dict[int, Set[int]] = field(default_factory=dict)     # group_id -> set of student_ids
    conflict_groups: Dict[int, Set[int]] = field(default_factory=dict)   # group_id -> set of student_ids
    trusted_swap_students: Set[int] = field(default_factory=set)        # set of student_ids trusted for same-gender swap
    conflict_pairs: Set[frozenset] = field(default_factory=set)          # legacy pair compatibility
    trusted_swap_pairs: Set[frozenset] = field(default_factory=set)      # legacy pair compatibility

    def is_conflict(self, a_id: int, b_id: int) -> bool:
        if frozenset((a_id, b_id)) in self.conflict_pairs:
            return True
        for members in self.conflict_groups.values():
            if a_id in members and b_id in members:
                return True
        return False

    def is_trusted_swap(self, a_id: int, b_id: int) -> bool:
        if frozenset((a_id, b_id)) in self.trusted_swap_pairs:
            return True
        return (a_id in self.trusted_swap_students) or (b_id in self.trusted_swap_students)

    def is_friend_group(self, a_id: int, b_id: int) -> bool:
        for members in self.friend_groups.values():
            if a_id in members and b_id in members:
                return True
        return False

    def same_group(self, a: Student, b: Student) -> bool:
        if self.is_friend_group(a.id, b.id):
            return True
        if a.group_id is not None and b.group_id is not None and a.group_id == b.group_id:
            return True
        if a.group_name and b.group_name and a.group_name == b.group_name:
            return True
        return False

def build_seat_position_map(layout: Optional[List[Dict[str, Any]]]) -> Dict[int, Tuple[int, int, int]]:
    """Builds student_id -> (col_rank, desk_index, position_index) map."""
    seat_pos: Dict[int, Tuple[int, int, int]] = {}
    if not layout or not isinstance(layout, list):
        return seat_pos
    ordered_cols = sorted(layout, key=lambda c: c.get("col_index", 0))
    for col_rank, col in enumerate(ordered_cols):
        for s in col.get("seats", []):
            sid = s.get("student_id")
            if sid is not None:
                try:
                    seat_pos[int(sid)] = (col_rank, int(s.get("desk", 0)), int(s.get("position", 0)))
                except (ValueError, TypeError):
                    pass
    return seat_pos

def can_swap(
    a: Student,
    b: Student,
    rel: RelationshipData,
    seat_pos: Optional[Dict[int, Tuple[int, int, int]]] = None
) -> bool:
    """Returns True if A and B are allowed to swap test papers."""
    if a.id == b.id:
        return False
    # STRICT RULE 1: Never swap test papers with someone in your Conflict Group
    if rel.is_conflict(a.id, b.id):
        return False
    # STRICT RULE 2: Never swap test papers with a Close Friend (same Friend Group)
    if rel.same_group(a, b) or rel.is_friend_group(a.id, b.id):
        return False
    # RULE 3: Same gender swap requires trusted swap permission (AND must NOT be close friends)
    if a.gender == b.gender and not rel.is_trusted_swap(a.id, b.id):
        return False
    # RULE 4: Seating layout row rule
    if seat_pos and a.id in seat_pos and b.id in seat_pos:
        ca, da, pa = seat_pos[a.id]
        cb, db, pb = seat_pos[b.id]
        if da == db:
            is_adjacent = abs((ca * 2 + pa) - (cb * 2 + pb)) <= 1
            a_t = a.id in rel.trusted_swap_students
            b_t = b.id in rel.trusted_swap_students
            pair_t = frozenset((a.id, b.id)) in rel.trusted_swap_pairs
            is_trusted = (a_t and b_t) or pair_t
            if is_adjacent or not is_trusted:
                return False
    return True

def can_sit_adjacent(a: Student, b: Student, rel: RelationshipData) -> bool:
    """Returns True if A and B may sit adjacent to each other."""
    if rel.is_conflict(a.id, b.id):
        return False
    if rel.same_group(a, b):
        return False
    return True

def generate_swap_pairs(
    students: List[Student],
    relationships: RelationshipData,
    seating_layout: Optional[List[Dict[str, Any]]] = None,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Arranges all present students into an optimal closed circular directed grading cycle:
    A grades B, B grades C, ..., and the last student grades A.
    Considers conflict groups, friend groups, gender rules, and seating chart layout:
    Individuals in the same row cannot swap UNLESS they belong to trusted and are not adjacent.
    """
    if seed is not None:
        random.seed(seed)

    present = [s for s in students if not s.is_absent]
    absent = [s for s in students if s.is_absent]
    if not present:
        return {
            "pairs": [],
            "unmatched": [{"id": s.id, "name": s.name, "group": s.group_name or "N/A", "reason": "Vắng mặt (Không đi học)"} for s in absent]
        }

    if len(present) == 1:
        s = present[0]
        unmatched = [{"id": s.id, "name": s.name, "group": s.group_name or "N/A", "reason": "Chỉ có 1 học sinh đi học, không thể đổi bài"}]
        for a in absent:
            unmatched.append({"id": a.id, "name": a.name, "group": a.group_name or "N/A", "reason": "Vắng mặt (Không đi học)"})
        return {"pairs": [], "unmatched": unmatched}

    seat_pos = build_seat_position_map(seating_layout)

    # Evaluate penalty for directed edge u -> v (u grades v's test)
    def directed_edge_penalty(u: Student, v: Student) -> float:
        penalty = 0.0
        if relationships.is_conflict(u.id, v.id):
            penalty += 10000.0
        if relationships.same_group(u, v) or relationships.is_friend_group(u.id, v.id):
            penalty += 10000.0
        if u.gender == v.gender and not relationships.is_trusted_swap(u.id, v.id):
            penalty += 100.0

        # Seating row & adjacency check
        if u.id in seat_pos and v.id in seat_pos:
            cu, du, pu = seat_pos[u.id]
            cv, dv, pv = seat_pos[v.id]
            if du == dv:  # Same row
                is_adjacent = abs((cu * 2 + pu) - (cv * 2 + pv)) <= 1
                u_t = u.id in relationships.trusted_swap_students
                v_t = v.id in relationships.trusted_swap_students
                pair_t = frozenset((u.id, v.id)) in relationships.trusted_swap_pairs
                
                if is_adjacent:
                    penalty += 10000.0  # Adjacent in same row strictly forbidden
                elif not (u_t or v_t or pair_t):
                    penalty += 10000.0  # Neither trusted strictly forbidden
                elif not ((u_t and v_t) or pair_t):
                    penalty += 5000.0   # Only one trusted strongly avoided
                else:
                    # Trusted and not adjacent: allowed exception!
                    penalty += 30.0

        # Random jitter to ensure variety across runs
        penalty += random.uniform(0.01, 1.0)
        return penalty

    n = len(present)
    cost_map: Dict[Tuple[int, int], float] = {}
    for u in present:
        for v in present:
            if u.id != v.id:
                cost_map[(u.id, v.id)] = directed_edge_penalty(u, v)

    def total_cycle_cost(order: List[Student]) -> float:
        return sum(cost_map.get((order[i].id, order[(i + 1) % n].id), 0.0) for i in range(n))

    # Fast 2-opt / swap local search to find conflict-free circular order
    best_order = list(present)
    random.shuffle(best_order)
    best_cost = total_cycle_cost(best_order)

    improved = True
    iterations = 0
    while improved and iterations < 1500:
        improved = False
        iterations += 1
        for i in range(n):
            for j in range(i + 1, n):
                # 2-opt segment reversal
                cand_order = best_order[:i] + best_order[i:j+1][::-1] + best_order[j+1:]
                cand_cost = total_cycle_cost(cand_order)
                if cand_cost < best_cost - 1e-4:
                    best_order = cand_order
                    best_cost = cand_cost
                    improved = True
                    break
                # Pair swap
                cand_swap = list(best_order)
                cand_swap[i], cand_swap[j] = cand_swap[j], cand_swap[i]
                cand_cost = total_cycle_cost(cand_swap)
                if cand_cost < best_cost - 1e-4:
                    best_order = cand_swap
                    best_cost = cand_cost
                    improved = True
                    break
            if improved:
                break

    pairs = []
    for i in range(n):
        s1 = best_order[i]                   # Grader (Người chấm)
        s2 = best_order[(i + 1) % n]         # Owner (Chủ bài thi)
        is_trusted = relationships.is_trusted_swap(s1.id, s2.id)
        same_group = relationships.same_group(s1, s2)
        has_conflict = relationships.is_conflict(s1.id, s2.id)

        # Check seating conflict
        seating_conflict = False
        if s1.id in seat_pos and s2.id in seat_pos:
            c1, d1, p1 = seat_pos[s1.id]
            c2, d2, p2 = seat_pos[s2.id]
            if d1 == d2:
                is_adj = abs((c1 * 2 + p1) - (c2 * 2 + p2)) <= 1
                u_t = s1.id in relationships.trusted_swap_students
                v_t = s2.id in relationships.trusted_swap_students
                pair_t = frozenset((s1.id, s2.id)) in relationships.trusted_swap_pairs
                if is_adj or not ((u_t and v_t) or pair_t):
                    seating_conflict = True

        pairs.append({
            "student1_id": s1.id,
            "student1_name": s1.name,
            "student1_group": s1.group_name or "N/A",
            "student2_id": s2.id,
            "student2_name": s2.name,
            "student2_group": s2.group_name or "N/A",
            "grader_id": s1.id,
            "grader_name": s1.name,
            "grader_group": s1.group_name or "N/A",
            "owner_id": s2.id,
            "owner_name": s2.name,
            "owner_group": s2.group_name or "N/A",
            "same_group_conflict": same_group or has_conflict or seating_conflict,
            "is_trusted": is_trusted,
            "is_circular": True,
            "step": i + 1,
            "total": n
        })

    unmatched = [{"id": s.id, "name": s.name, "group": s.group_name or "N/A", "reason": "Vắng mặt (Không đi học)"} for s in absent]
    return {"pairs": pairs, "unmatched": unmatched}


def fitness(chromosome: List[Optional[int]], rows: int, cols: int, relationships: RelationshipData, students_map: Dict[int, Student]) -> float:
    score = 0.0
    HARD_PENALTY = -100.0
    SOFT_BONUS = 10.0

    for r in range(rows):
        for c in range(cols):
            idx = r * cols + c
            if idx >= len(chromosome):
                break
            a_id = chromosome[idx]
            if a_id is None or a_id not in students_map:
                continue
            a = students_map[a_id]

            # Check adjacent seats: right, down, diagonal-down-right, diagonal-down-left
            for dr, dc in [(0, 1), (1, 0), (1, 1), (1, -1)]:
                nr, nc = r + dr, c + dc
                n_idx = nr * cols + nc
                if 0 <= nr < rows and 0 <= nc < cols and n_idx < len(chromosome):
                    b_id = chromosome[n_idx]
                    if b_id is not None and b_id in students_map:
                        b = students_map[b_id]
                        if relationships.is_conflict(a.id, b.id):
                            score += HARD_PENALTY
                        if relationships.same_group(a, b):
                            score += HARD_PENALTY

            # Check 2x2 block (top-left corner)
            if r % 2 == 0 and c % 2 == 0:
                block_students = []
                for br in range(r, r + 2):
                    for bc in range(c, c + 2):
                        b_index = br * cols + bc
                        if 0 <= br < rows and 0 <= bc < cols and b_index < len(chromosome):
                            st_id = chromosome[b_index]
                            if st_id is not None and st_id in students_map:
                                block_students.append(students_map[st_id])
                for i in range(len(block_students)):
                    for j in range(i + 1, len(block_students)):
                        x, y = block_students[i], block_students[j]
                        if relationships.is_conflict(x.id, y.id):
                            score += HARD_PENALTY
                        if relationships.same_group(x, y):
                            score += HARD_PENALTY

            # Soft preference: mix gender with right neighbor
            if c + 1 < cols:
                r_idx = r * cols + (c + 1)
                if r_idx < len(chromosome) and chromosome[r_idx] is not None:
                    b_id = chromosome[r_idx]
                    if b_id in students_map:
                        b = students_map[b_id]
                        if a.gender != b.gender:
                            score += SOFT_BONUS

    return score

def genetic_seat_mix(
    students: List[Student],
    rows: int,
    cols: int,
    relationships: RelationshipData,
    cols_config: Optional[List[Dict[str, Any]]] = None,
    population_size: int = 80,
    max_generations: int = 300,
    mutation_rate: float = 0.15,
    seed: Optional[int] = None
) -> Dict[str, Any]:
    if seed is not None:
        random.seed(seed)

    present = [s.id for s in students if not s.is_absent]
    total_seats = rows * cols
    if len(present) > total_seats:
        # Expand rows if seats are fewer than students
        rows = (len(present) + cols - 1) // cols
        total_seats = rows * cols

    # Pad chromosome template with None
    template = present + [None] * (total_seats - len(present))
    students_map = {s.id: s for s in students}

    # Initial population
    population = [random.sample(template, len(template)) for _ in range(population_size)]

    best_chromosome = template
    best_score = float('-inf')
    stale = 0
    generations_run = 0

    for gen in range(max_generations):
        generations_run = gen + 1
        scored = [(fitness(chrom, rows, cols, relationships, students_map), chrom) for chrom in population]
        scored.sort(key=lambda x: x[0], reverse=True)

        current_best_score, current_best = scored[0]
        if current_best_score > best_score:
            best_score = current_best_score
            best_chromosome = current_best
            stale = 0
        else:
            stale += 1

        if stale >= 40:
            break

        # Selection (top 50%)
        survivors = [chrom for _, chrom in scored[:population_size // 2]]

        # Crossover & Mutation
        children = []
        while len(children) < population_size - len(survivors):
            p1, p2 = random.sample(survivors, 2)
            child = list(p1)
            # Swap mutation or shuffle crossover
            if random.random() < mutation_rate:
                idx1, idx2 = random.sample(range(total_seats), 2)
                child[idx1], child[idx2] = child[idx2], child[idx1]
            children.append(child)

        population = survivors + children

    # Extract ordered list of actual student IDs from best_chromosome
    placed_student_ids = [sid for sid in best_chromosome if sid is not None and sid in students_map]
    # Guarantee that every present student is included in the placement queue
    for sid in present:
        if sid not in placed_student_ids:
            placed_student_ids.append(sid)

    c_count = len(cols_config) if cols_config else (cols // 2 if cols > 1 else 1)
    if c_count <= 0:
        c_count = 1

    # Populate cols_config if missing or empty
    if not cols_config:
        cols_config = [{"col_index": i, "desks_in_col": rows} for i in range(c_count)]
    else:
        cols_config = [dict(c) for c in cols_config]

    # Calculate current total seat capacity
    total_grid_seats = sum(c.get("desks_in_col", rows) * 2 for c in cols_config)

    # Automatically expand desks if student count exceeds current capacity
    while total_grid_seats < len(placed_student_ids):
        min_idx = 0
        min_desks = float('inf')
        for idx, c in enumerate(cols_config):
            d_cnt = c.get("desks_in_col", rows)
            if d_cnt < min_desks:
                min_desks = d_cnt
                min_idx = idx
        cols_config[min_idx]["desks_in_col"] = cols_config[min_idx].get("desks_in_col", rows) + 1
        total_grid_seats += 2

    # Queue of student IDs to place sequentially
    student_queue = list(placed_student_ids)
    layout = []

    for c in range(c_count):
        desks = cols_config[c].get("desks_in_col", rows)
        seats = []
        for d in range(desks):
            for pos in range(2):
                if student_queue:
                    sid = student_queue.pop(0)
                    st_obj = students_map.get(sid)
                else:
                    st_obj = None

                seats.append({
                    "desk": d,
                    "position": pos,
                    "student_id": st_obj.id if st_obj else None,
                    "student_name": st_obj.name if st_obj else None,
                    "seat_color": st_obj.group_color or st_obj.group_name if st_obj else None,
                    "grade_group": st_obj.group_name if st_obj else None
                })
        layout.append({
            "col_index": c,
            "desks_in_col": desks,
            "seats": seats
        })

    return {
        "layout": layout,
        "fitness_score": best_score,
        "generations_run": generations_run
    }

class SeatingPairingEngine:
    """Class wrapper for backward compatibility with main.py endpoints."""
    def __init__(self, students: List[Student], relationships: Optional[RelationshipData] = None, seed: Optional[int] = None):
        self.students = students
        self.relationships = relationships or RelationshipData()
        self.seed = seed

    def mix_seating_layout(self, cols_config: Optional[List[Dict[str, Any]]] = None, num_cols: int = 3, desks_per_col: int = 3) -> Dict[str, Any]:
        return genetic_seat_mix(
            students=self.students,
            rows=desks_per_col,
            cols=num_cols * 2,
            relationships=self.relationships,
            cols_config=cols_config,
            seed=self.seed
        )

    def generate_swap_test_pairs(self) -> Dict[str, Any]:
        return generate_swap_pairs(self.students, self.relationships, seed=self.seed)
