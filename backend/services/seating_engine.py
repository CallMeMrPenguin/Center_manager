import random
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Set, Tuple
import networkx as nx

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

def can_swap(a: Student, b: Student, rel: RelationshipData) -> bool:
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
    if a.gender == b.gender:
        return rel.is_trusted_swap(a.id, b.id)
    return True

def can_sit_adjacent(a: Student, b: Student, rel: RelationshipData) -> bool:
    """Returns True if A and B may sit adjacent to each other."""
    if rel.is_conflict(a.id, b.id):
        return False
    if rel.same_group(a, b):
        return False
    return True

def generate_swap_pairs(students: List[Student], relationships: RelationshipData, seed: Optional[int] = None) -> Dict[str, Any]:
    """
    Runs Edmonds' Blossom Matching on the student compatibility graph.
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

    # Shuffle student iteration order to avoid repetitive matching outputs
    shuffled_present = list(present)
    random.shuffle(shuffled_present)

    G = nx.Graph()
    for s in shuffled_present:
        G.add_node(s.id, name=s.name, gender=s.gender)

    for i in range(len(shuffled_present)):
        for j in range(i + 1, len(shuffled_present)):
            a, b = shuffled_present[i], shuffled_present[j]
            if can_swap(a, b, relationships):
                weight = 1.0
                if a.gender != b.gender:
                    weight += 2.0
                if not relationships.same_group(a, b):
                    weight += 1.0
                # Add random weight jitter to produce varied optimal pairings on each run
                weight += random.uniform(0.01, 0.5)
                G.add_edge(a.id, b.id, weight=weight)

    matching = nx.max_weight_matching(G, maxcardinality=True, weight='weight')

    student_map = {s.id: s for s in present}
    matched_ids = set()
    pairs = []

    for id1, id2 in matching:
        s1, s2 = student_map[id1], student_map[id2]
        is_trusted = relationships.is_trusted_swap(s1.id, s2.id)
        same_group = relationships.same_group(s1, s2)
        pairs.append({
            "student1_id": s1.id,
            "student1_name": s1.name,
            "student1_group": s1.group_name or "N/A",
            "student2_id": s2.id,
            "student2_name": s2.name,
            "student2_group": s2.group_name or "N/A",
            "same_group_conflict": same_group,
            "is_trusted": is_trusted,
            # Legacy fields for UI compatibility
            "grader_name": s1.name,
            "owner_name": s2.name,
            "grader_group": s1.group_name,
            "owner_group": s2.group_name
        })
        matched_ids.update([id1, id2])

    unmatched = []
    for s in absent:
        unmatched.append({
            "id": s.id,
            "name": s.name,
            "group": s.group_name or "N/A",
            "reason": "Vắng mặt (Không đi học)"
        })
    for s in present:
        if s.id not in matched_ids:
            compatible = [other for other in present if other.id != s.id and can_swap(s, other, relationships)]
            reason = "Không có học sinh tương thích" if not compatible else "Bị loại do cấu trúc ghép cặp tối ưu (số lượng lẻ hoặc cạnh độc lập)"
            unmatched.append({
                "id": s.id,
                "name": s.name,
                "group": s.group_name or "N/A",
                "reason": reason
            })

    return {"pairs": pairs, "unmatched": unmatched}

def order_crossover(p1: List[Optional[int]], p2: List[Optional[int]]) -> List[Optional[int]]:
    """OX (Order Crossover) for permutation chromosome with None paddings."""
    length = len(p1)
    c1, c2 = sorted(random.sample(range(length), 2))
    
    child = [None] * length
    # Copy segment from p1
    child[c1:c2+1] = p1[c1:c2+1]
    
    # Fill remaining from p2 in order
    p2_pos = (c2 + 1) % length
    child_pos = (c2 + 1) % length
    
    in_child = set(x for x in child[c1:c2+1] if x is not None)
    # Count of None values in segment
    none_in_segment = sum(1 for x in child[c1:c2+1] if x is None)
    none_filled = 0
    none_total = sum(1 for x in p1 if x is None)
    
    while None in child:
        val = p2[p2_pos]
        p2_pos = (p2_pos + 1) % length
        
        if val is not None:
            if val not in in_child:
                child[child_pos] = val
                in_child.add(val)
                child_pos = (child_pos + 1) % length
        else:
            # Handle None padding items
            total_nones_placed = sum(1 for x in child if x is None)
            if total_nones_placed > 0:
                # Place None if we still need None slots
                if child[child_pos] is None and child_pos < c1 or child_pos > c2:
                    child[child_pos] = None
                    child_pos = (child_pos + 1) % length

    return child

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
